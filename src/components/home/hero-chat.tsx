"use client";

import { useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StartModal } from "@/components/home/start-modal";

const PROMPTS = [
  "I want to validate a startup idea",
  "Help me turn customer notes into insight",
  "What patterns are showing up in my latest calls?",
];

/**
 * Homepage hero chat trigger. The whole bar is clickable — tapping
 * anywhere opens the Dalil Start modal where the Dalil Assistant
 * conversation lives. Keyboard-accessible via Enter / Space.
 */
export function HeroChat() {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | undefined>(undefined);

  function launch(text?: string) {
    const q = text?.trim();
    setSeed(q && q.length > 0 ? q : undefined);
    setOpen(true);
  }

  return (
    <div className="mx-auto w-full">
      <button
        type="button"
        onClick={() => launch()}
        aria-label="Open Dalil Start"
        className="group relative flex w-full items-center rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-teal-400 hover:shadow-md focus-visible:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40"
      >
        <Sparkles className="ml-4 h-5 w-5 shrink-0 text-teal-700" />
        <span className="flex-1 px-3 py-4 text-base text-muted-foreground">
          What do you want to do today?
        </span>
        <span
          className="mr-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition-colors group-hover:bg-teal-600"
          aria-hidden
        >
          <ArrowUp className="h-4 w-4" />
        </span>
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {PROMPTS.map((p) => (
          <Badge
            key={p}
            variant="outline"
            className="cursor-pointer bg-card/60 backdrop-blur hover:bg-secondary"
            onClick={() => launch(p)}
          >
            {p}
          </Badge>
        ))}
      </div>

      <StartModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSeed(undefined);
        }}
        seedText={seed}
      />
    </div>
  );
}
