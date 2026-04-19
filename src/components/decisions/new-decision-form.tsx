"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  Telescope,
  X,
} from "lucide-react";

type SignalOption = {
  id: string;
  title: string | null;
  created_at: string;
  category: string | null;
  confirmed_summary: string | null;
  segment: string | null;
};

type RecurringTheme = {
  key: string;
  label: string;
  count: number;
  rationaleHint: string;
  evidenceIds: string[];
};

type ChatTurn = { role: "user" | "assistant"; text: string };

const CATEGORIES = [
  "Product",
  "Operations",
  "Pricing",
  "Positioning",
  "Messaging",
  "Channel",
  "Hiring",
  "Segment",
  "Roadmap",
  "Other",
];

export function NewDecisionForm({
  workspaceId,
  signals,
  preselectedSignalId,
  preselectedTheme,
  recurringThemes,
}: {
  workspaceId: string;
  signals: SignalOption[];
  preselectedSignalId?: string;
  preselectedTheme?: string;
  recurringThemes: RecurringTheme[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [rationale, setRationale] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(
    preselectedSignalId ? [preselectedSignalId] : [],
  );
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Embedded Dalil Assistant chat.
  const [chatDraft, setChatDraft] = useState("");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [refining, setRefining] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Apply a preselected theme from the URL (?theme=...).
  useEffect(() => {
    if (!preselectedTheme) return;
    const match =
      recurringThemes.find(
        (t) => t.key.toLowerCase() === preselectedTheme.toLowerCase(),
      ) ??
      recurringThemes.find((t) =>
        t.label.toLowerCase().includes(preselectedTheme.toLowerCase()),
      );
    if (match) applyTheme(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTheme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatTurns, refining]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signals;
    return signals.filter((s) => {
      const hay = [
        s.title ?? "",
        s.confirmed_summary ?? "",
        s.segment ?? "",
        s.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [signals, search]);

  const selectedSignals = useMemo(
    () => signals.filter((s) => selected.includes(s.id)),
    [signals, selected],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function applyTheme(theme: RecurringTheme) {
    setActiveTheme(theme.key);
    // Prefill title + category + rationale from the theme.
    if (!title.trim()) {
      setTitle(`Address ${theme.label.toLowerCase()}`);
    }
    if (!category) {
      setCategory(theme.key);
    }
    if (!rationale.trim() && theme.rationaleHint) {
      const countLine = theme.count
        ? `${theme.count} input${theme.count === 1 ? "" : "s"} in this category support the decision.`
        : "";
      setRationale(
        [
          `Recurring theme: ${theme.label}.`,
          countLine,
          "",
          "Supporting memories:",
          theme.rationaleHint,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    // Auto-select any evidence signals tied to the theme.
    if (theme.evidenceIds.length > 0) {
      setSelected((prev) =>
        Array.from(new Set([...prev, ...theme.evidenceIds])),
      );
    }
    toast.success(`Theme applied: ${theme.label}`);
  }

  async function refineWithDalil() {
    const clean = chatDraft.trim();
    if (!clean || refining) return;
    setChatTurns((prev) => [...prev, { role: "user", text: clean }]);
    setChatDraft("");
    setRefining(true);
    try {
      const evidenceSnippets = selectedSignals.slice(0, 10).map((s) => ({
        title: s.title,
        confirmed_summary: s.confirmed_summary,
      }));
      const res = await fetch(
        `/api/workspace/${workspaceId}/decision-refine`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_message: clean,
            current_form: {
              title,
              category,
              rationale,
              description,
              expected_outcome: expected,
            },
            active_theme: activeTheme ?? undefined,
            evidence_snippets: evidenceSnippets,
          }),
        },
      );
      const body = (await res.json()) as
        | {
            success: true;
            data: {
              updated_form: {
                title: string;
                category: string;
                rationale: string;
                description: string;
                expected_outcome: string;
              };
              assistant_reply: string;
            };
          }
        | { success: false; error: string; message?: string };
      if (!res.ok || !body.success) {
        const msg =
          ("message" in body && body.message) ||
          ("error" in body && body.error) ||
          "Dalil Assistant failed.";
        toast.error(msg);
        setChatTurns((prev) => [
          ...prev,
          { role: "assistant", text: `Sorry — ${msg}` },
        ]);
        return;
      }
      const f = body.data.updated_form;
      setTitle(f.title);
      setCategory(f.category);
      setRationale(f.rationale);
      setDescription(f.description);
      setExpected(f.expected_outcome);
      setChatTurns((prev) => [
        ...prev,
        { role: "assistant", text: body.data.assistant_reply },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refinement failed.");
    } finally {
      setRefining(false);
    }
  }

  function submit() {
    setErrors({});
    const trimmedTitle = title.trim();
    const trimmedRationale = rationale.trim();
    const fieldErrors: Record<string, string> = {};
    if (trimmedTitle.length < 3)
      fieldErrors.title = "Give the decision a title.";
    if (trimmedRationale.length < 10)
      fieldErrors.rationale = "Explain why — at least a sentence.";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    const combinedRationale = description.trim()
      ? `${trimmedRationale}\n\nDescription: ${description.trim()}`
      : trimmedRationale;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            category: category || undefined,
            rationale: combinedRationale,
            expected_outcome: expected.trim() || undefined,
            signal_ids: selected.length > 0 ? selected : undefined,
          }),
        });
        const body = (await res.json()) as
          | {
              success: true;
              data: { decision_id: string; embedding_status: string };
            }
          | { success: false; error: string; message?: string };

        if (!res.ok || !body.success) {
          toast.error(
            ("message" in body && body.message) ||
              ("error" in body && body.error) ||
              "Save failed.",
          );
          return;
        }
        toast.success("Decision logged.");
        router.push(`/w/${workspaceId}/decisions`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-lg">New decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Decision</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Switch to YKK zippers on the V2 cut"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category / department affected</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Include custom category if active theme doesn't match defaults */}
                  {category && !CATEGORIES.includes(category) && (
                    <SelectItem value={category}>{category}</SelectItem>
                  )}
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rationale">Rationale</Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={5}
                placeholder="Why this, why now? What did the evidence tell you?"
                aria-invalid={Boolean(errors.rationale)}
              />
              {errors.rationale && (
                <p className="text-xs text-destructive">{errors.rationale}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-xs text-muted-foreground">optional</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="A short paragraph describing the change itself — what exactly will you do."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected">
                Expected outcome{" "}
                <span className="text-xs text-muted-foreground">optional</span>
              </Label>
              <Textarea
                id="expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                rows={3}
                placeholder="What will be better if this works? Make it measurable if you can."
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/w/${workspaceId}/decisions`)}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Log decision
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Telescope className="h-4 w-4 text-teal-700" />
                Recurring theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringThemes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recurring themes yet. Add a few pieces of feedback — Dalil
                  AI will cluster them into themes you can pivot into decisions.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ranked most-recurring first. Click a theme to auto-draft the
                    decision and link its evidence.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recurringThemes.map((t) => {
                      const active = activeTheme === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => applyTheme(t)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? "border-teal-400 bg-teal-50 text-ink-950 dark:bg-teal-950/40 dark:text-ink-50"
                              : "border-border bg-card hover:border-teal-300 hover:bg-teal-50/50"
                          }`}
                        >
                          <Sparkles className="h-3 w-3 text-teal-700" />
                          {t.label}
                          {t.count > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              · {t.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Link evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search inputs, summaries, categories…"
                  className="pl-9"
                />
              </div>
              {selectedSignals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
                  {selectedSignals.map((s) => (
                    <Badge
                      key={s.id}
                      variant="secondary"
                      className="gap-1 font-normal"
                    >
                      {s.title ?? "Untitled input"}
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className="rounded-full hover:bg-foreground/10"
                        aria-label="Remove evidence"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No inputs match.
                  </p>
                ) : (
                  filtered.map((s) => {
                    const isSelected = selected.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggle(s.id)}
                        className={
                          isSelected
                            ? "block w-full rounded-md border border-teal-400 bg-teal-50/40 p-3 text-left transition-colors dark:border-teal-600 dark:bg-teal-950/40"
                            : "block w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-ink-300"
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-ink-950 dark:text-ink-50">
                            {s.title ?? "Untitled input"}
                          </p>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
                          )}
                        </div>
                        {s.confirmed_summary && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {s.confirmed_summary}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.category ?? s.segment ?? "uncategorized"} ·{" "}
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="h-4 w-4 text-teal-700" />
            Refine with Dalil Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Type what you want to change and Dalil Assistant will update the
            form in place. Try: <em>make the expected outcome measurable</em>,{" "}
            <em>tighten the rationale around payout timing</em>, or{" "}
            <em>add a description paragraph about the V2 rollout plan</em>.
          </p>

          {chatTurns.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/40 p-3">
              {chatTurns.map((t, i) => (
                <div
                  key={i}
                  className={
                    t.role === "assistant"
                      ? "flex gap-2"
                      : "flex flex-row-reverse gap-2"
                  }
                >
                  <span
                    className={
                      t.role === "assistant"
                        ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] font-semibold text-white"
                        : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[10px] font-semibold text-white"
                    }
                  >
                    {t.role === "assistant" ? "D" : "You"}
                  </span>
                  <div
                    className={
                      t.role === "assistant"
                        ? "max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-3 py-2 text-sm shadow-sm ring-1 ring-border"
                        : "max-w-[80%] rounded-2xl rounded-tr-sm bg-ink-900 px-3 py-2 text-sm text-ink-50"
                    }
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void refineWithDalil();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              placeholder="Ask Dalil Assistant to tweak the draft…"
              rows={2}
              className="flex-1 resize-none"
              disabled={refining}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void refineWithDalil();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={refining || !chatDraft.trim()}
              aria-label="Send"
            >
              {refining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
