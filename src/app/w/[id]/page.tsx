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
  Plus,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Layers,
} from "lucide-react";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listSignalsForWorkspace } from "@/lib/queries/signals";
import { listDecisionsForWorkspace } from "@/lib/queries/decisions";
import {
  rollupWorkspace,
  type Rollup,
} from "@/lib/ai/workspace-rollup";
import { StepFlowNav } from "@/components/layout/step-flow-nav";

export const revalidate = 0;

export default async function DashboardPage(
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
  const improvedCount = decisions.filter(
    (d) => d.outcome?.status === "improved",
  ).length;
  const trackedCount = decisions.filter((d) => d.outcome).length;
  const outcomeRate =
    trackedCount === 0 ? null : Math.round((improvedCount / trackedCount) * 100);

  // Bucket inputs by AI-assigned category so the dashboard can render one
  // card per category (zipper / cloth quality / stitching in the SUHBA demo).
  type CategoryBucket = {
    name: string;
    inputs: number;
    memories: number;
    decisions: number;
  };
  const byCategory = new Map<string, CategoryBucket>();
  for (const s of signals) {
    const key = s.category?.trim();
    if (!key) continue;
    const bucket =
      byCategory.get(key) ?? {
        name: key,
        inputs: 0,
        memories: 0,
        decisions: 0,
      };
    bucket.inputs += 1;
    if (s.analysis?.confirmed_at) bucket.memories += 1;
    byCategory.set(key, bucket);
  }
  for (const d of decisions) {
    const key = d.category?.trim();
    if (!key) continue;
    const bucket = byCategory.get(key);
    if (bucket) bucket.decisions += 1;
  }
  const categories = Array.from(byCategory.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const companyChips: string[] = [];
  if (workspace.audience_group) companyChips.push(workspace.audience_group);
  if (workspace.product_category) companyChips.push(workspace.product_category);
  if (workspace.main_goal) companyChips.push(workspace.main_goal);

  return (
    <PageStub
      eyebrow="Dashboard"
      title={workspace.name}
      description={
        workspace.description ??
        "What the market is saying, what you decided because of it, and what to test next."
      }
    >
      {companyChips.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {companyChips.map((c) => (
            <Badge
              key={c}
              variant="outline"
              className="bg-card/80 font-normal"
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild size="lg">
          <Link href={`/w/${id}/capture`}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Feedback
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`/w/${id}/decisions/new`}>
            <GitBranch className="mr-1 h-4 w-4" />
            Log a Decision
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <RollupCard
          icon={<Inbox className="h-4 w-4" />}
          label="Inputs captured"
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
          trend={decisionCount === 0 ? "none yet" : `${trackedCount} tracked`}
        />
        <RollupCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Outcome win rate"
          value={outcomeRate === null ? "—" : `${outcomeRate}%`}
          trend={
            trackedCount === 0
              ? "no outcomes tracked yet"
              : `${improvedCount} of ${trackedCount} improved`
          }
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-950 dark:text-ink-50">
              Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Dalil AI groups incoming feedback into reusable categories. Each
              category gets its own memory library and decision ledger.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
                <Layers className="h-5 w-5 text-teal-700" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                No categories yet. Add your first piece of feedback and Dalil
                AI will auto-categorize it here.
              </p>
              <Button asChild size="sm">
                <Link href={`/w/${id}/capture`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add New Feedback
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/w/${id}/memory?category=${encodeURIComponent(c.name)}`}
              >
                <Card className="group h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                        {c.name}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                      <div className="rounded-md bg-secondary/60 py-2">
                        <p className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                          {c.inputs}
                        </p>
                        <p>Inputs</p>
                      </div>
                      <div className="rounded-md bg-secondary/60 py-2">
                        <p className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                          {c.memories}
                        </p>
                        <p>Memories</p>
                      </div>
                      <div className="rounded-md bg-secondary/60 py-2">
                        <p className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                          {c.decisions}
                        </p>
                        <p>Decisions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<RollupSkeleton />}>
          <RollupPanels
            workspaceId={id}
            memories={confirmedMemories.map((a) => ({
              confirmed_summary: a.confirmed_summary ?? a.ai_summary ?? "",
              likely_segment: a.likely_segment,
              pain_points: a.pain_points,
              objections:
                a.negative_feedback && a.negative_feedback.length > 0
                  ? a.negative_feedback
                  : a.objections,
              requests: a.requests,
              quotes: a.quotes,
            }))}
          />
        </Suspense>
      </div>

      <StepFlowNav workspaceId={id} current="dashboard" />
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
    confirmed_summary: string | null;
    likely_segment: string | null;
    pain_points: string[] | null;
    objections: string[] | null;
    requests: string[] | null;
    quotes: string[] | null;
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
              Confirm a few memories and Dalil AI will surface recurring themes,
              top negative feedback, the strongest customer segment, and what to
              test next.
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
            {rollup?.most_likely_segment && (
              <Badge variant="outline" className="shrink-0 font-normal">
                Top audience · {rollup.most_likely_segment}
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
            rollup?.recurring_themes.map((theme) => (
              <div
                key={theme}
                className="rounded-md border border-border p-3 text-sm"
              >
                {theme}
              </div>
            ))
          )}

          {rollup?.strongest_objections && rollup.strongest_objections.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Top negative feedback
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollup.strongest_objections.map((o) => (
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
          {!rollup?.suggested_next_tests ||
          rollup.suggested_next_tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Capture more memories or log a few decisions and Dalil AI will
              propose the sharpest next experiment.
            </p>
          ) : (
            rollup.suggested_next_tests.map((t, i) => (
              <div key={i} className="rounded-md border border-border p-3 text-sm">
                {t}
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
