import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox,
  Lightbulb,
  GitBranch,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listSignalsForWorkspace } from "@/lib/queries/signals";
import { listDecisionsForWorkspace } from "@/lib/queries/decisions";
import { rollupWorkspace, type Rollup } from "@/lib/ai/rollup";

export const revalidate = 0;

export default async function WorkspaceDashboard(
  props: PageProps<"/w/[id]">,
) {
  const { id } = await props.params;
  const [workspace, signals, decisions] = await Promise.all([
    getWorkspace(id),
    listSignalsForWorkspace(id),
    listDecisionsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const confirmedMemories = signals
    .map((s) => s.analysis)
    .filter((a): a is NonNullable<typeof a> => Boolean(a?.confirmed_at));

  const totalSignals = signals.length;
  const confirmed = confirmedMemories.length;
  const pending = totalSignals - confirmed;
  const confirmationRate =
    totalSignals === 0
      ? 0
      : Math.round((confirmed / totalSignals) * 100);
  const decisionCount = decisions.length;
  const withOutcomes = decisions.filter(
    (d) => d.outcome && d.outcome.status !== "pending",
  ).length;
  const improvedCount = decisions.filter(
    (d) => d.outcome?.status === "improved",
  ).length;
  const trackedCount = decisions.filter((d) => d.outcome).length;
  const outcomeRate =
    trackedCount === 0 ? null : Math.round((improvedCount / trackedCount) * 100);

  return (
    <PageStub
      eyebrow="Workspace"
      title={workspace.name}
      description={
        workspace.description ??
        "What the market is saying, what you decided because of it, and what to test next."
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <RollupCard
          icon={<Inbox className="h-4 w-4" />}
          label="Signals captured"
          value={totalSignals.toString()}
          trend={pending > 0 ? `${pending} pending review` : "all confirmed"}
        />
        <RollupCard
          icon={<Lightbulb className="h-4 w-4" />}
          label="Confirmed memories"
          value={confirmed.toString()}
          trend={`${confirmationRate}% confirmation rate`}
        />
        <RollupCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Decisions logged"
          value={decisionCount.toString()}
          trend={
            decisionCount === 0
              ? "none yet"
              : `${decisionCount - withOutcomes} pending outcomes`
          }
        />
        <RollupCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Outcome win rate"
          value={outcomeRate === null ? "—" : `${outcomeRate}%`}
          trend={
            trackedCount === 0
              ? "no outcomes tracked yet"
              : `${improvedCount} of ${trackedCount} tracked`
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<RollupSkeleton />}>
          <RollupPanels
            workspaceId={id}
            memories={confirmedMemories.map((a) => ({
              summary: a.confirmed_summary ?? a.ai_summary ?? "",
              segment: a.likely_segment,
              pain_points: a.pain_points,
              objections: a.objections,
              quotes: a.quotes,
              created_at: a.created_at,
            }))}
          />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/w/${id}/capture`}>
            Capture new signal
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/w/${id}/memory`}>Memory library</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/w/${id}/decisions`}>Decision ledger</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/w/${id}/timeline`}>Timeline</Link>
        </Button>
      </div>
    </PageStub>
  );
}

function RollupCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold text-ink-950 dark:text-ink-50">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
      </CardContent>
    </Card>
  );
}

async function RollupPanels({
  workspaceId,
  memories,
}: {
  workspaceId: string;
  memories: Array<{
    summary: string;
    segment: string | null;
    pain_points: string[] | null;
    objections: string[] | null;
    quotes: string[] | null;
    created_at: string;
  }>;
}) {
  if (memories.length === 0) {
    return (
      <>
        <Card className="lg:col-span-2 border-dashed bg-secondary/40">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Recurring themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Confirm a few memories and Dalil will surface recurring themes,
              top objections, strongest segment, and what to test next.
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed bg-secondary/40">
          <CardHeader>
            <CardTitle className="font-display text-lg">Next tests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Suggested experiments appear here once there&apos;s enough signal.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  let rollup: Rollup | null = null;
  let rollupError: string | null = null;
  try {
    rollup = await rollupWorkspace(memories);
  } catch (e) {
    rollupError =
      e instanceof Error
        ? e.message
        : "Could not compute rollup. Try again in a moment.";
  }

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-display text-lg">
              Recurring themes
            </CardTitle>
            {rollup?.strongest_segment && (
              <Badge variant="outline" className="shrink-0 font-normal">
                Top segment · {rollup.strongest_segment}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rollupError && (
            <div className="flex items-start gap-2 rounded-md border border-dashed border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{rollupError}</span>
            </div>
          )}
          {rollup && rollup.recurring_themes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not enough data for themes yet.
            </p>
          ) : (
            rollup?.recurring_themes.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.mentions} mention{t.mentions === 1 ? "" : "s"} across{" "}
                    {t.signals} signal{t.signals === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge
                  variant={t.trend === "rising" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {t.trend}
                </Badge>
              </div>
            ))
          )}

          {rollup?.top_objections && rollup.top_objections.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Top objections
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollup.top_objections.map((o) => (
                  <Badge key={o} variant="outline" className="font-normal">
                    {o}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {rollup?.contradictions && rollup.contradictions.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contradictions
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {rollup.contradictions.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="h-4 w-4 text-teal-700" />
            Next tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!rollup?.next_tests || rollup.next_tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Capture more memories or log a few decisions and Dalil will
              propose the sharpest next experiment.
            </p>
          ) : (
            rollup.next_tests.map((t, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.why}</p>
              </div>
            ))
          )}
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/w/${workspaceId}/decisions/new`}>Log a decision</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

function RollupSkeleton() {
  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Recurring themes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Next tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-border p-3 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
