"use client";

import { useMemo, useState, useTransition } from "react";
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
import { CheckCircle2, Search, X } from "lucide-react";

type SignalOption = {
  id: string;
  title: string | null;
  created_at: string;
  confirmed_summary: string | null;
  segment: string | null;
};

const CATEGORIES = [
  "Positioning",
  "Pricing",
  "Operations",
  "Messaging",
  "Product",
  "Channel",
  "Hiring",
  "Other",
];

export function NewDecisionForm({
  workspaceId,
  signals,
  preselectedSignalId,
}: {
  workspaceId: string;
  signals: SignalOption[];
  preselectedSignalId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [rationale, setRationale] = useState("");
  const [expected, setExpected] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(
    preselectedSignalId ? [preselectedSignalId] : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signals;
    return signals.filter((s) => {
      const hay = [s.title ?? "", s.confirmed_summary ?? "", s.segment ?? ""]
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

    startTransition(async () => {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: trimmedTitle,
            category: category || undefined,
            rationale: trimmedRationale,
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
        toast.success("Decision logged. Embedding queued.");
        router.push(`/w/${workspaceId}/decisions`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
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
              placeholder="e.g. Extend delivery window to midnight on weekends"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="expected">
              Expected outcome <span className="text-xs text-muted-foreground">optional</span>
            </Label>
            <Textarea
              id="expected"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              rows={3}
              placeholder="What will be better if this works? Make it measurable if you can."
            />
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="flex items-center justify-between">
              <span>Evidence</span>
              <span className="text-xs font-normal text-muted-foreground">
                {selected.length} selected
              </span>
            </Label>
            {selectedSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedSignals.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="gap-1 font-normal"
                  >
                    {s.title ?? "Untitled signal"}
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

      <Card className="lg:col-span-2">
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
              placeholder="Search signals, quotes, themes…"
              className="pl-9"
            />
          </div>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No signals match.
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
                        ? "block w-full rounded-md border border-teal-400 bg-teal-50/40 p-3 text-left transition-colors"
                        : "block w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-ink-300"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink-950 dark:text-ink-50">
                        {s.title ?? "Untitled signal"}
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
                      {s.segment ?? "unknown segment"} ·{" "}
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
  );
}
