"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowUp,
  Bookmark,
  CornerDownLeft,
  Loader2,
  CheckCircle2,
  Users,
  AlertCircle,
  Gem,
  FlaskConical,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; text: string };

const FIRST_MESSAGE: Turn = {
  role: "assistant",
  text: "Welcome to Dalil Start. Tell me what you're trying to build, or the problem you want to solve. I'll help you sharpen the idea, the audience, and the wedge before you commit to a workspace.",
};

const STARTER_PROMPTS = [
  "I want to validate a startup idea",
  "Help me turn customer notes into insight",
  "What patterns are showing up in my latest calls?",
  "I have a problem but no product idea yet",
];

const AXES: Array<{
  label: string;
  icon: React.ReactNode;
  keywords: string[];
}> = [
  {
    label: "The idea, in one sentence",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    keywords: ["idea", "build", "product", "service"],
  },
  {
    label: "The narrowest honest audience",
    icon: <Users className="h-3.5 w-3.5" />,
    keywords: ["audience", "users", "customers", "who", "segment"],
  },
  {
    label: "A specific pain point",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    keywords: ["pain", "problem", "frustration", "hate", "struggle"],
  },
  {
    label: "Pressure-tested value",
    icon: <Gem className="h-3.5 w-3.5" />,
    keywords: ["value", "why", "pay", "switch", "adopt", "better"],
  },
  {
    label: "What to test first",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    keywords: ["test", "experiment", "validate", "first", "next"],
  },
];

const READY_MARKER = /save (this|it) as an idea|save it to your idea vault/i;

export function StartModal({
  open,
  onOpenChange,
  seedText,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  seedText?: string;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([FIRST_MESSAGE]);
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, startSave] = useTransition();
  const [offeredSave, setOfferedSave] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
      setTurns([FIRST_MESSAGE]);
      setDraft("");
      setStreaming(false);
      setOfferedSave(false);
      seededRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !seedText) return;
    if (seededRef.current === seedText) return;
    seededRef.current = seedText;
    void send(seedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedText]);

  // Auto-scroll the chat container to the bottom whenever turns or the
  // streaming-placeholder state changes.
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || streaming) return;
    const userTurn: Turn = { role: "user", text: clean };
    const next = [...turns, userTurn];
    setTurns(next);
    setDraft("");

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    // Reserve an empty assistant bubble that we'll stream into.
    setTurns((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      const res = await fetch("/api/stage-zero-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((t) => ({
            role: t.role,
            content: t.text,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Chat failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setTurns((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", text: full };
          return copy;
        });
      }

      if (READY_MARKER.test(full)) setOfferedSave(true);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error(e instanceof Error ? e.message : "Chat failed.");
      // Drop the placeholder if the stream errored.
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (streaming) return;
    void send(draft);
  }

  function save(convertToWorkspace: boolean) {
    startSave(async () => {
      try {
        const res = await fetch("/api/idea-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: turns.map((t) => ({
              role: t.role,
              content: t.text,
            })),
          }),
        });

        const body = (await res.json()) as
          | {
              success: true;
              data: {
                chat_transcript_summary: string;
                approved_idea: string;
                audience: string;
                problem_statement: string;
                convert_to_workspace_flag: boolean;
              };
            }
          | { success: false; error: string; message?: string };

        if (!res.ok || !body.success) {
          toast.error(
            ("message" in body && body.message) ||
              ("error" in body && body.error) ||
              "Extraction failed.",
          );
          return;
        }

        const idea = body.data;
        const supabase = createClient();

        const { data: saved, error: insertErr } = await supabase
          .from("ideas")
          .insert({
            approved_idea: idea.approved_idea,
            audience: idea.audience,
            problem_statement: idea.problem_statement,
            transcript_summary: idea.chat_transcript_summary,
          })
          .select("id")
          .single();

        if (insertErr || !saved) {
          toast.error(insertErr?.message ?? "Could not save idea.");
          return;
        }

        let workspaceId: string | null = null;
        if (convertToWorkspace || idea.convert_to_workspace_flag) {
          const { data: ws } = await supabase
            .from("workspaces")
            .insert({
              name: idea.approved_idea,
              description: idea.problem_statement,
            })
            .select("id")
            .single();

          if (ws) {
            workspaceId = ws.id;
            await supabase
              .from("ideas")
              .update({ converted_workspace_id: ws.id })
              .eq("id", saved.id);
          }
        }

        toast.success(
          workspaceId
            ? "Idea saved and workspace created."
            : "Saved to your Idea Vault.",
        );
        onOpenChange(false);
        if (workspaceId) router.push(`/w/${workspaceId}`);
        else router.push("/ideas");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  const canSend = draft.trim().length > 0 && !streaming && !saving;
  const userTurnCount = turns.filter((t) => t.role === "user").length;
  const canSave = userTurnCount >= 2 && !saving && !streaming;

  const coveredAxes = AXES.map((axis) => {
    const joined = turns.map((t) => t.text).join(" ").toLowerCase();
    return axis.keywords.some((k) => joined.includes(k));
  });
  const coveredCount = coveredAxes.filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[88vh] w-[min(1200px,96vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg leading-tight">
                Dalil Start
              </DialogTitle>
              <DialogDescription className="text-xs">
                Stage-zero chat · sharpen idea, audience, and wedge before
                committing to a workspace.
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="flex min-h-0 flex-col border-r border-border">
            <div
              ref={chatContainerRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth"
            >
              <div className="flex flex-col gap-4 p-6">
                {turns.length === 1 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {STARTER_PROMPTS.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        onClick={() => send(p)}
                        className="cursor-pointer gap-1 bg-card hover:bg-secondary"
                      >
                        <Sparkles className="h-3 w-3 text-teal-700" />
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
                {turns.map((t, i) => {
                  const isLastAssistant =
                    t.role === "assistant" &&
                    i === turns.length - 1 &&
                    streaming;
                  return (
                    <Bubble
                      key={i}
                      turn={t}
                      streaming={isLastAssistant}
                    />
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 border-t border-border bg-card/60 p-4"
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  turns.length === 1
                    ? "What do you want to do today?"
                    : "Reply to Dalil…"
                }
                rows={2}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={streaming || saving}
              />
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled={!canSend}
                aria-label="Send"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </form>
          </section>

          <aside className="flex min-h-0 flex-col bg-secondary/40">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-6">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sharpening progress
                  </p>
                  <div className="space-y-2">
                    {AXES.map((axis, i) => {
                      const done = coveredAxes[i];
                      return (
                        <div
                          key={axis.label}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md border p-2.5 text-sm transition-colors",
                            done
                              ? "border-teal-300/70 bg-teal-50/60 text-ink-950"
                              : "border-border bg-card text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full",
                              done
                                ? "bg-teal-700 text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              axis.icon
                            )}
                          </span>
                          <span className="flex-1 leading-tight">
                            {axis.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {coveredCount} of {AXES.length} axes covered ·{" "}
                    {userTurnCount} reply{userTurnCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    What happens on save
                  </p>
                  <ol className="space-y-1 text-xs text-muted-foreground">
                    <li>
                      1. GPT-4.1-mini summarizes the conversation via
                      <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                        /api/idea-extract
                      </code>
                      — validated against a strict Zod schema before save.
                    </li>
                    <li>
                      2. The idea lands in your Idea Vault with the approved
                      idea, narrow audience, and problem statement.
                    </li>
                    <li>
                      3. Optionally, Dalil spins up a workspace so you can
                      start capturing real customer signals against it.
                    </li>
                  </ol>
                </div>

                <div className="rounded-xl border border-dashed border-border bg-card/60 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    The move behind the wedge
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Founders who win at 0→1 don&apos;t just have an idea —
                    they know exactly who has the pain today, how often it
                    hurts, and what they&apos;d pay to make it stop. Dalil
                    Start is the conversation that gets you there.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border bg-card/60 p-4">
              <Button
                type="button"
                className="w-full gap-1.5"
                disabled={!canSave}
                onClick={() => save(true)}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Save & create workspace
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full gap-1.5",
                  offeredSave && "border-teal-400",
                )}
                disabled={!canSave}
                onClick={() => save(false)}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                Save to Idea Vault
              </Button>
              <p className="flex items-center justify-center gap-1 pt-1 text-[11px] text-muted-foreground">
                <CornerDownLeft className="h-3 w-3" />
                Enter to send · Shift+Enter for newline
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Bubble({
  turn,
  streaming,
}: {
  turn: Turn;
  streaming?: boolean;
}) {
  const isAssistant = turn.role === "assistant";
  const body = turn.text || (streaming ? "…" : "");
  return (
    <div className={isAssistant ? "flex gap-3" : "flex flex-row-reverse gap-3"}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          isAssistant ? "bg-teal-700" : "bg-ink-900",
        )}
      >
        {isAssistant ? "D" : "You"}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isAssistant
            ? "rounded-tl-sm bg-card shadow-sm ring-1 ring-border"
            : "rounded-tr-sm bg-ink-900 text-ink-50",
        )}
      >
        {body}
        {streaming && (
          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-teal-500 align-middle" />
        )}
      </div>
    </div>
  );
}
