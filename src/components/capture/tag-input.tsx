"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  tone = "default",
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  tone?: "default" | "warning" | "success";
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add(value: string) {
    const clean = value.trim();
    if (!clean) return;
    if (values.some((v) => v.toLowerCase() === clean.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, clean]);
    setDraft("");
    inputRef.current?.focus();
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
          tone === "warning" &&
            "focus-within:ring-gold-300/40 dark:focus-within:ring-gold-700/50",
          tone === "success" &&
            "focus-within:ring-teal-300/40 dark:focus-within:ring-teal-700/50",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v, i) => (
          <Badge
            key={`${v}-${i}`}
            variant={
              tone === "warning" ? "outline" : tone === "success" ? "default" : "secondary"
            }
            className="gap-1 py-0.5"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              className="rounded-full hover:bg-foreground/10"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              remove(values.length - 1);
            }
          }}
          placeholder={values.length === 0 ? placeholder : "Add…"}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none"
        />
        {draft.trim().length > 0 && (
          <button
            type="button"
            onClick={() => add(draft)}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Add tag"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
