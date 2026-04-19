import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  GitBranch,
  TrendingUp,
  TrendingDown,
  Clock,
  CircleDashed,
} from "lucide-react";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listTimelineForWorkspace, type TimelineEntry } from "@/lib/queries/timeline";
import { formatDateLong } from "@/lib/format";

export const revalidate = 0;

export default async function TimelinePage(
  props: PageProps<"/w/[id]/timeline">,
) {
  const { id } = await props.params;
  const [workspace, entries] = await Promise.all([
    getWorkspace(id),
    listTimelineForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const timelineEntries = entries.filter((entry) => entry.kind !== "signal");

  return (
    <PageStub
      eyebrow={workspace.name}
      title="The visible chronology of learning."
      description="Decisions produce outcomes, outcomes reshape what you test next. This is where the loop becomes visible."
    >
      {timelineEntries.length === 0 ? (
        <EmptyTimeline />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ol className="relative space-y-8 border-l-2 border-border pl-6">
              {timelineEntries.map((e) => (
                <TimelineItem key={`${e.kind}-${e.id}`} entry={e} />
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </PageStub>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const { Icon, color, label } = iconFor(entry);
  return (
    <li className="relative">
      <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDateLong(entry.date)}
          </span>
        </div>
        <p className="font-display text-base font-medium leading-snug text-ink-950 dark:text-ink-50">
          {entry.title}
        </p>
        {entry.body && (
          <p className="text-sm text-muted-foreground">{entry.body}</p>
        )}
      </div>
    </li>
  );
}

function iconFor(entry: TimelineEntry) {
  if (entry.kind === "signal") {
    return { Icon: Inbox, color: "text-ink-600", label: "Signal" };
  }
  if (entry.kind === "decision") {
    return { Icon: GitBranch, color: "text-teal-700", label: "Decision" };
  }
  switch (entry.status) {
    case "improved":
      return { Icon: TrendingUp, color: "text-gold-600", label: "Outcome · Improved" };
    case "failed":
      return { Icon: TrendingDown, color: "text-red-600", label: "Outcome · Failed" };
    case "inconclusive":
      return { Icon: CircleDashed, color: "text-ink-500", label: "Outcome · Inconclusive" };
    default:
      return { Icon: Clock, color: "text-ink-500", label: "Outcome · Pending" };
  }
}

function EmptyTimeline() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
          <Clock className="h-5 w-5 text-teal-700" />
        </span>
        <h3 className="font-display text-lg font-semibold">
          Nothing on the timeline yet.
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          As you capture signals and log decisions, they land here in order.
          Mark an outcome to close the loop.
        </p>
      </CardContent>
    </Card>
  );
}
