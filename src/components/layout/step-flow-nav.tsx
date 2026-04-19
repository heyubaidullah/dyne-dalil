import Link from "next/link";
import { LayoutDashboard, Library, GitBranch, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "dashboard" | "memory" | "decisions";

const STEPS: Array<{
  key: Step;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  hrefFor: (id: string) => string;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Stats, categories, and recurring themes",
    icon: LayoutDashboard,
    hrefFor: (id) => `/w/${id}`,
  },
  {
    key: "memory",
    label: "Memory Library",
    description: "Confirmed feedback, grouped by category",
    icon: Library,
    hrefFor: (id) => `/w/${id}/memory`,
  },
  {
    key: "decisions",
    label: "Decision Ledger",
    description: "Decisions linked to the evidence behind them",
    icon: GitBranch,
    hrefFor: (id) => `/w/${id}/decisions`,
  },
];

export function StepFlowNav({
  workspaceId,
  current,
}: {
  workspaceId: string;
  current: Step;
}) {
  return (
    <nav
      aria-label="Workflow navigation"
      className="mt-10 rounded-xl border border-border bg-card/60 p-3 sm:p-4"
    >
      <div className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Workflow
      </div>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {STEPS.map((step, i) => {
          const active = step.key === current;
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex flex-1 items-stretch">
              <Link
                href={step.hrefFor(workspaceId)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                  active
                    ? "bg-teal-50 ring-1 ring-teal-200/70 dark:bg-teal-950/40 dark:ring-teal-800/50"
                    : "hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active
                      ? "bg-teal-700 text-white dark:bg-teal-600"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-medium",
                      active
                        ? "text-ink-950 dark:text-ink-50"
                        : "text-ink-700 dark:text-ink-200",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {step.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </Link>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className="hidden h-5 w-5 shrink-0 self-center text-muted-foreground sm:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
