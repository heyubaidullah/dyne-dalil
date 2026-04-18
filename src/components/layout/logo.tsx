import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink-950 dark:text-ink-50">
          Dalil
        </span>
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm ring-1 ring-inset ring-white/10",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M6 4v16" stroke="currentColor" />
        <path
          d="M6 4h6a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H6"
          stroke="currentColor"
        />
        <circle cx="14" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
