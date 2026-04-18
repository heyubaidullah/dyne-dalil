import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Inbox,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { listRecentActivity, type RecentEntry } from "@/lib/queries/recent";
import { formatDateLong } from "@/lib/format";

export const revalidate = 0;

export default async function GlobalTimelinePage() {
  const entries = await listRecentActivity(150).catch(() => []);

  return (
    <PageStub
      eyebrow="Timeline"
      title="Chronology of learning, across workspaces."
      description="Every signal, decision, and outcome across every GTM workspace, in time order. The whole loop, one scroll."
    >
      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              No activity yet. Capture signals or log decisions in a workspace
              to see them surface here.
            </p>
            <Button asChild>
              <Link href="/workspaces">
                Open a workspace
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div
            className="absolute left-3.75 top-2 bottom-2 w-px bg-border"
            aria-hidden
          />
          <ol className="space-y-4">
            {entries.map((e) => (
              <TimelineItem key={`${e.kind}-${e.id}`} entry={e} />
            ))}
          </ol>
        </div>
      )}
    </PageStub>
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
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-background ${tone}`}
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
    label: "Signal",
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
