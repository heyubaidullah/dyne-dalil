"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowUp } from "lucide-react";

type Turn = { role: "user" | "assistant"; text: string };

const STARTER_PROMPTS = [
  "I want to validate a startup idea",
  "Help me turn customer notes into insight",
  "What patterns are showing up in my latest calls?",
  "I have a problem but no product idea yet",
];

const FIRST_MESSAGE: Turn = {
  role: "assistant",
  text:
    "Welcome to Dalil Start. Tell me what you're trying to build, or the pain you want to solve. I'll help you sharpen the audience, the problem, and the wedge before you commit to a workspace.",
};

const ASSISTANT_FOLLOWUP =
  "Great — let's sharpen that. (The real guided LLM flow comes online once the AI pipeline is wired up.) Tell me: who specifically has this pain today, and how often does it show up?";

function StartContent() {
  const searchParams = useSearchParams();
  const [turns, setTurns] = useState<Turn[]>([FIRST_MESSAGE]);
  const [draft, setDraft] = useState("");
  const handledQueryRef = useRef(false);

  function append(userText: string) {
    if (!userText.trim()) return;
    setTurns((t) => [
      ...t,
      { role: "user", text: userText },
      { role: "assistant", text: ASSISTANT_FOLLOWUP },
    ]);
    setDraft("");
  }

  // Seed the conversation from the homepage hero search, if any.
  useEffect(() => {
    if (handledQueryRef.current) return;
    const q = searchParams.get("q");
    if (q && q.trim()) {
      handledQueryRef.current = true;
      append(q);
    }
  }, [searchParams]);

  return (
    <PageStub
      eyebrow="Dalil Start"
      title="What do you want to do today?"
      description="A guided conversation for stage-zero builders. Articulate the idea, narrow the audience, pressure-test the value, and save the approved concept."
      phase="Stage-zero chat"
    >
      <Card className="flex flex-col">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((p) => (
              <Badge
                key={p}
                variant="outline"
                className="cursor-pointer hover:bg-secondary"
                onClick={() => append(p)}
              >
                <Sparkles className="mr-1 h-3 w-3 text-teal-700" />
                {p}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/40 p-4">
            {turns.map((t, i) => (
              <div
                key={i}
                className={
                  t.role === "assistant"
                    ? "flex gap-3"
                    : "flex flex-row-reverse gap-3"
                }
              >
                <div
                  className={
                    t.role === "assistant"
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white"
                  }
                >
                  {t.role === "assistant" ? "D" : "You"}
                </div>
                <div
                  className={
                    t.role === "assistant"
                      ? "max-w-prose rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-sm shadow-sm"
                      : "max-w-prose rounded-2xl rounded-tr-sm bg-ink-900 px-4 py-3 text-sm text-ink-50"
                  }
                >
                  {t.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              append(draft);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your idea, problem, or question…"
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  append(draft);
                }
              }}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>
              Approved ideas auto-save to your Idea Vault. Convert any one to a
              full workspace when you're ready.
            </span>
            <Button variant="outline" size="sm">
              Save as idea
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageStub>
  );
}

export default function StartPage() {
  return (
    <Suspense>
      <StartContent />
    </Suspense>
  );
}
