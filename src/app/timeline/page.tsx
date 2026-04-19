import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { listRecentActivity } from "@/lib/queries/recent";
import { TimelineViews } from "@/components/timeline/timeline-views";

export const revalidate = 0;

export default async function GlobalTimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const initialView: "time" | "decisions" =
    sp.view === "decisions" ? "decisions" : "time";
  const entries = await listRecentActivity(250).catch(() => []);
  const timelineEntries = entries.filter((entry) => entry.kind !== "signal");

  return (
    <PageStub
      eyebrow="Timeline"
      title="Chronology of learning, across Dashboards."
      description="Every decision and outcome — in time order, or grouped by category."
    >
      {timelineEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              No timeline activity yet. Log a decision in a Dashboard
              to see it surface here.
            </p>
            <Button asChild>
              <Link href="/workspaces">
                Open a Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TimelineViews entries={timelineEntries} initialView={initialView} />
      )}
    </PageStub>
  );
}
