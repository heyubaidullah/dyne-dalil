import Link from "next/link";
import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, GitBranch } from "lucide-react";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listDecisionsForWorkspace } from "@/lib/queries/decisions";
import { OutcomeControl } from "@/components/decisions/outcome-control";
import { formatDateLong } from "@/lib/format";
import { StepFlowNav } from "@/components/layout/step-flow-nav";

export const revalidate = 0;

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  improved: "default",
  failed: "secondary",
  inconclusive: "secondary",
  pending: "outline",
};

export default async function DecisionLedgerPage(
  props: PageProps<"/w/[id]/decisions">,
) {
  const { id } = await props.params;
  const [workspace, decisions] = await Promise.all([
    getWorkspace(id),
    listDecisionsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  return (
    <PageStub
      eyebrow={`${workspace.name} · Decision Ledger`}
      title="Every decision, with its evidence."
      description="Decisions linked to the feedback that justified them. Mark the outcome when it lands — that's how the learning loop closes."
    >
      <div className="mb-4 flex items-center justify-end">
        <Button asChild className="gap-1.5">
          <Link href={`/w/${id}/decisions/new`}>
            <Plus className="h-4 w-4" />
            Log a Decision
          </Link>
        </Button>
      </div>

      {decisions.length === 0 ? (
        <EmptyDecisions workspaceId={id} />
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => {
            const status = d.outcome?.status ?? "pending";
            return (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {d.category && (
                        <Badge variant="outline" className="font-normal">
                          {d.category}
                        </Badge>
                      )}
                      <CardTitle className="font-display text-lg leading-tight">
                        {d.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Logged {formatDateLong(d.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANTS[status] ?? "outline"}
                      className="shrink-0 capitalize"
                    >
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {d.rationale && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Rationale
                      </p>
                      <p>{d.rationale}</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {d.expected_outcome && (
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Expected outcome
                        </p>
                        <p className="text-muted-foreground">
                          {d.expected_outcome}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Evidence
                      </p>
                      {d.evidence.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No linked feedback.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {d.evidence.map((e) => (
                            <div
                              key={`${d.id}-${e.signal_id}`}
                              className="flex items-start gap-1.5 text-sm text-teal-700"
                            >
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span className="leading-snug">
                                {e.signal_title ?? "Linked feedback"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <OutcomeControl
                      decisionId={d.id}
                      workspaceId={id}
                      currentStatus={status}
                      currentNotes={d.outcome?.notes ?? ""}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StepFlowNav workspaceId={id} current="decisions" />
    </PageStub>
  );
}

function EmptyDecisions({ workspaceId }: { workspaceId: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60">
          <GitBranch className="h-5 w-5 text-teal-700" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            No decisions yet.
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Once you&apos;ve captured a few memories, log the first GTM call
            you&apos;re making based on them. Evidence and expected outcome
            travel with it.
          </p>
        </div>
        <Button asChild>
          <Link href={`/w/${workspaceId}/decisions/new`}>
            <Plus className="mr-1 h-4 w-4" />
            Log your first decision
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
