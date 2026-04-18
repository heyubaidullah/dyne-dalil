"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PROMPTS = [
  "I want to validate a startup idea",
  "Help me turn customer notes into insight",
  "What patterns are showing up in my latest calls?",
];

export function HeroChat() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(text: string) {
    const q = text.trim();
    if (!q) {
      router.push("/start");
      return;
    }
    router.push(`/start?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
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
            onClick={() => submit(p)}
          >
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}
