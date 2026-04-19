import Link from "next/link";
import { formatDistanceToNow } from "@/lib/format";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Inbox } from "lucide-react";
import { listWorkspaceSummaries } from "@/lib/queries/workspaces";
import { schemaStatus } from "@/lib/queries/health";
import { SchemaBanner } from "@/components/layout/schema-banner";

export const revalidate = 0;

export default async function WorkspacesPage() {
  const [workspaces, status] = await Promise.all([
    listWorkspaceSummaries(),
    schemaStatus(),
  ]);

  return (
    <>
      {!status.ready && <SchemaBanner message={status.error} />}
      <PageStub
      eyebrow="Dashboards"
      title="Every company memory, scoped."
      description="A Dashboard is one product, one market, one set of customers. Pick one to dive in, or create a new one from scratch."
    >
      <div className="mb-6 flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/ideas">Convert from Idea Vault</Link>
        </Button>
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="mr-1 h-4 w-4" />
            New Dashboard
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workspaces.map((w) => (
            <Link
              key={w.id}
              href={`/w/${w.id}`}
              className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="dalil-lift h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-display text-xl leading-tight">
                      {w.name}
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {w.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {w.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {w.signal_count} input{w.signal_count === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="secondary">
                      {w.decision_count} decision
                      {w.decision_count === 1 ? "" : "s"}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {w.last_activity
                        ? formatDistanceToNow(w.last_activity)
                        : "just created"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageStub>
    </>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60">
          <Inbox className="h-5 w-5 text-teal-700" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            No Dashboards yet.
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Walk the short onboarding to create your first Dashboard, then
            add feedback from a call, note, DM, or review.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/onboarding">
              <Plus className="mr-1 h-4 w-4" />
              Start onboarding
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/start">Start from an idea</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
