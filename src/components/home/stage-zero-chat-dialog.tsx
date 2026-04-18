"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, Loader2, Sparkles, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type MessageRole = "user" | "assistant";

type ChatMessage = {
  role: MessageRole;
  content: string;
};

type SeedPrompt = {
  id: number;
  text: string;
};

type IdeaExtractResponse = {
  chat_transcript_summary: string;
  approved_idea: string;
  audience: string;
  problem_statement: string;
  convert_to_workspace_flag: boolean;
};

const STARTER_PROMPTS = [
  "I want to validate a startup idea",
  "I have a problem but no product idea yet",
  "Help me pressure-test my existing concept",
];

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Describe the startup idea in one sentence. If you only have a problem space, state it and who feels it most acutely.",
};

type StageZeroChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seedPrompt: SeedPrompt | null;
};

export function StageZeroChatDialog({
  open,
  onOpenChange,
  seedPrompt,
}: StageZeroChatDialogProps) {
  const router = useRouter();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const consumedSeedRef = useRef<number | null>(null);
  const sendUserMessageRef = useRef<(rawText: string) => Promise<void>>(
    async () => {},
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => {
    if (isStreaming || isSaving) return false;

    const assistantText = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant")
      ?.content.toLowerCase();

    return (
      /ready to save|idea vault/.test(assistantText ?? "") ||
      messages.filter((m) => m.role === "user").length >= 3
    );
  }, [isSaving, isStreaming, messages]);

  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages, open]);

  async function sendUserMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isStreaming) return;

    const baseMessages = messages;
    const userMessage: ChatMessage = { role: "user", content: text };
    const outgoingMessages = [...baseMessages, userMessage];

    setMessages([...outgoingMessages, { role: "assistant", content: "" }]);
    setDraft("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/stage-zero-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoingMessages }),
      });

      if (!response.ok || !response.body) {
        const body = await response.text();
        throw new Error(body || "Streaming response failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        assistantReply += decoder.decode(value, { stream: true });
        setMessages((current) => {
          if (current.length === 0) return current;
          return [
            ...current.slice(0, -1),
            {
              role: "assistant",
              content: assistantReply,
            },
          ];
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reach Stage-Zero chat";

      setMessages((current) => {
        if (current.length === 0) return current;
        return [
          ...current.slice(0, -1),
          {
            role: "assistant",
            content:
              "I hit a technical issue while continuing this chat. Retry your last message once, or check provider API keys.",
          },
        ];
      });
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  }

  useEffect(() => {
    sendUserMessageRef.current = sendUserMessage;
  }, [sendUserMessage]);

  useEffect(() => {
    if (!open || !seedPrompt) return;
    if (seedPrompt.id === consumedSeedRef.current) return;

    consumedSeedRef.current = seedPrompt.id;
    void sendUserMessageRef.current(seedPrompt.text);
  }, [open, seedPrompt]);

  async function handleSaveIdea() {
    if (isSaving || isStreaming || messages.length < 2) return;

    setIsSaving(true);
    try {
      const extractResponse = await fetch("/api/idea-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: messages }),
      });

      const extractJson = (await extractResponse.json()) as
        | { success: true; data: IdeaExtractResponse }
        | { success: false; error?: string; message?: string };

      if (!extractResponse.ok || !extractJson.success) {
        const reason =
          "error" in extractJson && extractJson.error
            ? extractJson.error
            : "Idea extraction failed";
        throw new Error(reason);
      }

      const extracted = extractJson.data;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("ideas").insert({
        owner: user?.id ?? null,
        chat_transcript_summary: extracted.chat_transcript_summary,
        transcript_summary: extracted.chat_transcript_summary,
        approved_idea: extracted.approved_idea,
        audience: extracted.audience,
        problem_statement: extracted.problem_statement,
        convert_to_workspace_flag: extracted.convert_to_workspace_flag,
      });

      if (error) {
        throw error;
      }

      toast.success("Saved to Idea Vault");
      onOpenChange(false);

      if (extracted.convert_to_workspace_flag) {
        router.push("/workspaces/new?source=idea-vault");
      } else {
        router.push("/ideas");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save the extracted idea";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(85vh,720px)] max-w-5xl gap-0 p-0" showCloseButton>
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            Stage-Zero validation
          </div>
          <DialogTitle className="font-display text-2xl leading-tight sm:text-3xl">
            What do you want to do today?
          </DialogTitle>
          <DialogDescription>
            Articulate the concept, narrow the audience, define the pain point,
            and pressure-test the value proposition before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col px-6 py-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                className="cursor-pointer bg-card/80 hover:bg-secondary"
                onClick={() => {
                  void sendUserMessage(prompt);
                }}
              >
                {prompt}
              </Badge>
            ))}
          </div>

          <ScrollArea className="flex-1 rounded-xl border border-border bg-secondary/35">
            <div ref={transcriptRef} className="max-h-[44vh] space-y-3 p-4">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={
                    msg.role === "assistant"
                      ? "flex gap-3"
                      : "flex flex-row-reverse gap-3"
                  }
                >
                  <div
                    className={
                      msg.role === "assistant"
                        ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white"
                        : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white"
                    }
                  >
                    {msg.role === "assistant" ? "D" : "You"}
                  </div>
                  <div
                    className={
                      msg.role === "assistant"
                        ? "max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-sm shadow-sm"
                        : "max-w-[80%] rounded-2xl rounded-tr-sm bg-ink-900 px-4 py-3 text-sm text-ink-50"
                    }
                  >
                    {msg.content || (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendUserMessage(draft);
            }}
            className="mt-4 flex items-end gap-2"
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Answer the current question..."
              rows={2}
              className="flex-1 resize-none"
              disabled={isStreaming || isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendUserMessage(draft);
                }
              }}
            />
            <Button
              type="submit"
              className="h-11 w-11 shrink-0"
              size="icon"
              disabled={isStreaming || isSaving || !draft.trim()}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Saving runs structured extraction and stores your validated idea in
              Idea Vault.
            </p>
            <Button
              onClick={() => {
                void handleSaveIdea();
              }}
              disabled={!canSave}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save to Idea Vault
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
