import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Inbox, Quote } from "lucide-react";
import { listRecentActivity } from "@/lib/queries/recent";
import { listWorkspaceSummaries } from "@/lib/queries/workspaces";
import { formatDateLong } from "@/lib/format";

export const revalidate = 0;

export default async function GlobalMemoryPage() {
  const [recent, workspaces] = await Promise.all([
    listRecentActivity(200).catch(() => []),
    listWorkspaceSummaries().catch(() => []),
  ]);
  const signalMemories = recent.filter((r) => r.kind === "signal");

  return (
    <PageStub
      eyebrow="Memory"
      title="All confirmed memories, across every workspace."
      description="Canonical customer signals from every GTM workspace. Click any memory for the full source and its linked decisions."
    >
      {signalMemories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
              <Inbox className="h-5 w-5 text-teal-700" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No confirmed memories yet. Add feedback in any Dashboard and
              confirm the AI extraction to see it surface here.
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
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{signalMemories.length} memories</span>
            <span>·</span>
            <span>{workspaces.length} workspaces</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {signalMemories.map((m) => (
              <Link key={m.id} href={`/w/${m.workspace_id}/memory`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base leading-tight">
                        {m.title}
                      </CardTitle>
                      {m.workspace_name && (
                        <Badge variant="outline" className="shrink-0">
                          {m.workspace_name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(m.when)}
                      {m.segment ? ` · ${m.segment}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-ink-700 dark:text-ink-200">
                      {m.body}
                    </p>
                    {m.quote && (
                      <blockquote className="flex gap-2 border-l-2 border-teal-500 pl-3 text-sm italic text-ink-700 dark:text-ink-200">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{m.quote}</span>
                      </blockquote>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </PageStub>
  );
}
