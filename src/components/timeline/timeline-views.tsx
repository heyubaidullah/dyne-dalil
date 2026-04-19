"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GitBranch,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { formatDateLong } from "@/lib/format";
import type { RecentEntry } from "@/lib/queries/recent";
import { cn } from "@/lib/utils";

type View = "time" | "decisions";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function TimelineViews({
  entries,
  initialView = "time",
}: {
  entries: RecentEntry[];
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Timeline view"
        className="mb-6 inline-flex gap-1 rounded-lg bg-secondary/60 p-1"
      >
        <TabButton
          active={view === "time"}
          onClick={() => setView("time")}
          label="View by Time"
        />
        <TabButton
          active={view === "decisions"}
          onClick={() => setView("decisions")}
          label="View by Decisions"
        />
      </div>

      {view === "time" ? (
        <ViewByTime entries={entries} />
      ) : (
        <ViewByDecisions entries={entries} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-card text-ink-950 shadow-sm ring-1 ring-border dark:text-ink-50"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ViewByTime({ entries }: { entries: RecentEntry[] }) {
  // Group by Year > Month.
  const grouped = useMemo(() => {
    const byYear = new Map<number, Map<number, RecentEntry[]>>();
    for (const e of entries) {
      const d = new Date(e.when);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!byYear.has(y)) byYear.set(y, new Map());
      const yearMap = byYear.get(y)!;
      if (!yearMap.has(m)) yearMap.set(m, []);
      yearMap.get(m)!.push(e);
    }
    // Sort: years desc, months desc within year.
    const years = Array.from(byYear.entries())
      .map(
        ([y, months]) =>
          [
            y,
            Array.from(months.entries()).sort((a, b) => b[0] - a[0]),
          ] as const,
      )
      .sort((a, b) => b[0] - a[0]);
    return years;
  }, [entries]);

  // Default: current year expanded, older years collapsed.
  const defaultOpen = useMemo(() => {
    const now = new Date().getFullYear();
    const set = new Set<number>();
    if (grouped.length > 0) set.add(grouped[0][0]);
    set.add(now);
    return set;
  }, [grouped]);
  const [openYears, setOpenYears] = useState<Set<number>>(defaultOpen);

  function toggleYear(y: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {grouped.map(([year, months]) => {
        const open = openYears.has(year);
        const totalEntries = months.reduce((acc, [, es]) => acc + es.length, 0);
        return (
          <section key={year}>
            <button
              type="button"
              onClick={() => toggleYear(year)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-2 border-b border-border py-2 text-left transition-colors hover:border-teal-400"
            >
              <span className="flex items-center gap-2">
                {open ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <h2 className="font-display text-2xl font-semibold text-ink-950 dark:text-ink-50">
                  {year}
                </h2>
              </span>
              <span className="text-xs text-muted-foreground">
                {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
              </span>
            </button>
            {open && (
              <div className="mt-4 space-y-6">
                {months.map(([month, monthEntries]) => (
                  <div key={`${year}-${month}`}>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {MONTH_NAMES[month]} · {monthEntries.length}
                    </h3>
                    <ol className="space-y-3">
                      {monthEntries.map((e) => (
                        <TimelineItem
                          key={`${e.kind}-${e.id}`}
                          entry={e}
                        />
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ViewByDecisions({ entries }: { entries: RecentEntry[] }) {
  // Group entries by category (fallback: workspace name). Alphabetical.
  const grouped = useMemo(() => {
    const byCategory = new Map<string, RecentEntry[]>();
    for (const e of entries) {
      const key = e.category?.trim() || e.workspace_name?.trim() || "Uncategorized";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(e);
    }
    return Array.from(byCategory.entries())
      .map(
        ([name, items]) =>
          [
            name,
            items.sort((a, b) => (a.when < b.when ? 1 : -1)),
          ] as const,
      )
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [entries]);

  return (
    <div className="space-y-6">
      {grouped.map(([category, items]) => {
        const decisionCount = items.filter((i) => i.kind === "decision").length;
        return (
          <section key={category}>
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <h2 className="font-display text-xl font-semibold text-ink-950 dark:text-ink-50">
                {category}
              </h2>
              <span className="text-xs text-muted-foreground">
                {items.length} entries · {decisionCount} decisions
              </span>
            </div>
            <ol className="space-y-3">
              {items.map((e) => (
                <TimelineItem key={`${e.kind}-${e.id}`} entry={e} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function TimelineItem({ entry }: { entry: RecentEntry }) {
  const { icon, tone, label } = STYLES[entry.kind](entry);
  const href =
    entry.kind === "signal"
      ? `/w/${entry.workspace_id}/memory`
      : entry.kind === "decision"
        ? `/w/${entry.workspace_id}/decisions`
        : `/w/${entry.workspace_id}/timeline`;

  return (
    <li className="relative flex gap-4">
      <span
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-background",
          tone,
        )}
      >
        {icon}
      </span>
      <Link href={href} className="flex-1">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{label}</Badge>
              {entry.workspace_name && (
                <span className="font-medium text-ink-700 dark:text-ink-200">
                  {entry.workspace_name}
                </span>
              )}
              {entry.category && (
                <>
                  <span>·</span>
                  <span>{entry.category}</span>
                </>
              )}
              <span>·</span>
              <span>{formatDateLong(entry.when)}</span>
            </div>
            <p className="mt-2 font-display text-base font-semibold leading-snug text-ink-950 dark:text-ink-50">
              {entry.title}
            </p>
            {entry.body && (
              <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
            )}
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}

const STYLES: Record<
  RecentEntry["kind"],
  (e: RecentEntry) => { icon: React.ReactNode; tone: string; label: string }
> = {
  signal: () => ({
    icon: <Inbox className="h-4 w-4 text-teal-700" />,
    tone: "bg-teal-50",
    label: "Input",
  }),
  decision: () => ({
    icon: <GitBranch className="h-4 w-4 text-ink-900 dark:text-ink-50" />,
    tone: "bg-secondary",
    label: "Decision",
  }),
  outcome: (e) => {
    const status = e.outcome_status ?? "pending";
    if (status === "improved")
      return {
        icon: <TrendingUp className="h-4 w-4 text-emerald-700" />,
        tone: "bg-emerald-50",
        label: "Outcome · improved",
      };
    if (status === "failed")
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        tone: "bg-red-50",
        label: "Outcome · failed",
      };
    if (status === "inconclusive")
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-amber-600" />,
        tone: "bg-amber-50",
        label: "Outcome · inconclusive",
      };
    return {
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      tone: "bg-muted",
      label: "Outcome · pending",
    };
  },
};
