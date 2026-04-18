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
 * Homepage hero chat bar. Per the team plan, clicking into this opens a
 * dedicated large modal (Dalil Start), not an inline chat — the modal
 * hosts a guided Gemini conversation that sharpens idea, audience, pain
 * point, and wedge before saving to the Idea Vault.
 */
export function HeroChat() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | undefined>(undefined);

  function launch(text?: string) {
    const q = (text ?? value).trim();
    setSeed(q.length > 0 ? q : undefined);
    setValue("");
    setOpen(true);
  }

  return (
    <div className="mx-auto w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          launch();
        }}
        className="group relative flex items-center rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-teal-400"
      >
        <Sparkles className="ml-4 h-5 w-5 shrink-0 text-teal-700" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you want to do today?"
          className="flex-1 bg-transparent px-3 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="What do you want to do today?"
        />
        <button
          type="submit"
          className="mr-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm transition-colors hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label="Start guided conversation"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
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
