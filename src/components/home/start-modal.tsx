"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  ArrowUp,
  Bookmark,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import {
  sendDalilStartMessage,
  saveDalilStartIdea,
} from "@/app/actions/chat";
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

const READY_MARKER = /save (this|it) as an idea/i;

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
  const [draft, setDraft] = useState("");
  const [loadingReply, startReply] = useTransition();
  const [saving, startSave] = useTransition();
  const [offeredSave, setOfferedSave] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<string | null>(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTurns([FIRST_MESSAGE]);
      setDraft("");
      setOfferedSave(false);
      seededRef.current = null;
    }
  }, [open]);

  // Seed from hero input
  useEffect(() => {
    if (!open || !seedText) return;
    if (seededRef.current === seedText) return;
    seededRef.current = seedText;
    send(seedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedText]);

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, loadingReply]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const next = [...turns, { role: "user" as const, text: clean }];
    setTurns(next);
    setDraft("");
    startReply(async () => {
      const res = await sendDalilStartMessage({ messages: next });
      if (!res.ok) {
        toast.error(res.error);
        setTurns(next); // keep user turn visible
        return;
      }
      setTurns([...next, { role: "assistant", text: res.reply }]);
      if (READY_MARKER.test(res.reply)) setOfferedSave(true);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loadingReply) return;
    send(draft);
  }

  function save(convertToWorkspace: boolean) {
    startSave(async () => {
      const res = await saveDalilStartIdea({
        messages: turns,
        convertToWorkspace,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.workspace_id
          ? "Idea saved and workspace created."
          : "Saved to your Idea Vault.",
      );
      onOpenChange(false);
      if (res.workspace_id) {
        router.push(`/w/${res.workspace_id}`);
      } else {
        router.push("/ideas");
      }
    });
  }

  const canSend =
    draft.trim().length > 0 && !loadingReply && !saving;
  const canSave = turns.filter((t) => t.role === "user").length >= 2 && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="gap-1 border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg leading-tight">
                Dalil Start
              </DialogTitle>
              <DialogDescription className="text-xs">
                Stage-zero chat — sharpen the idea, audience, and wedge
                before committing to a workspace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-5" ref={scrollRef as never}>
          <div className="flex flex-col gap-4">
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
            {turns.map((t, i) => (
              <Bubble key={i} turn={t} />
            ))}
            {loadingReply && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dalil is thinking…
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col items-stretch gap-3 border-t border-border bg-card/60 px-6 py-4 sm:flex-col">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
              disabled={loadingReply || saving}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={!canSend}
              aria-label="Send"
            >
              {loadingReply ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Enter to send · Shift+Enter for newline
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(offeredSave && "border-teal-400")}
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
              <Button
                type="button"
                size="sm"
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
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const isAssistant = turn.role === "assistant";
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
        {turn.text}
      </div>
    </div>
  );
}
