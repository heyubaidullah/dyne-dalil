import Link from "next/link";
import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Plus } from "lucide-react";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listSignalsForWorkspace } from "@/lib/queries/signals";
import { formatDateLong } from "@/lib/format";

export const revalidate = 0;

export default async function MemoryLibraryPage(
  props: PageProps<"/w/[id]/memory">,
) {
  const { id } = await props.params;
  const [workspace, signals] = await Promise.all([
    getWorkspace(id),
    listSignalsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const confirmed = signals.filter((s) => s.analysis?.confirmed_at);
  const pending = signals.filter((s) => !s.analysis?.confirmed_at);

  return (
    <PageStub
      eyebrow={workspace.name}
      title="Canonical memories, searchable and sourced."
      description="Every confirmed customer signal — after you've reviewed the AI extraction. The source of truth for recall and rollups."
    >
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button asChild>
          <Link href={`/w/${id}/capture`}>
            <Plus className="mr-1 h-4 w-4" />
            New signal
          </Link>
        </Button>
      </div>

      {signals.length === 0 ? (
        <EmptyMemory workspaceId={id} />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Pending review ({pending.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => (
                  <MemoryCard
                    key={s.id}
                    workspaceId={id}
                    signal={s}
                    pending
                  />
                ))}
              </div>
            </section>
          )}

          {confirmed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Confirmed ({confirmed.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {confirmed.map((s) => (
                  <MemoryCard key={s.id} workspaceId={id} signal={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageStub>
  );
}

function MemoryCard({
  workspaceId,
  signal,
  pending = false,
}: {
  workspaceId: string;
  signal: Awaited<ReturnType<typeof listSignalsForWorkspace>>[number];
  pending?: boolean;
}) {
  const a = signal.analysis;
  const confidence = a?.confidence ?? "medium";
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-base leading-tight">
            {signal.title ?? "Untitled signal"}
          </CardTitle>
          {pending ? (
            <Badge variant="outline" className="shrink-0">
              Pending review
            </Badge>
          ) : (
            <Badge
              variant={confidence === "high" ? "default" : "secondary"}
              className="shrink-0 capitalize"
            >
              {confidence}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateLong(signal.created_at)}
          {a?.likely_segment ? ` · ${a.likely_segment}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {a?.confirmed_summary && (
          <p className="text-sm">{a.confirmed_summary}</p>
        )}
        {a?.quotes && a.quotes.length > 0 && (
          <blockquote className="border-l-2 border-teal-500 pl-3 text-sm italic text-ink-700 dark:text-ink-200">
            &ldquo;{a.quotes[0]}&rdquo;
          </blockquote>
        )}
        {a?.pain_points && a.pain_points.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {a.pain_points.slice(0, 4).map((p) => (
              <Badge key={p} variant="secondary" className="font-normal">
                {p}
              </Badge>
            ))}
          </div>
        )}
        {pending && (
          <div className="pt-1">
            <Button asChild size="sm" variant="outline">
              <Link href={`/w/${workspaceId}/capture`}>Review & confirm</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMemory({ workspaceId }: { workspaceId: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60">
          <Inbox className="h-5 w-5 text-teal-700" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            No memories yet.
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Capture your first customer signal and confirm the AI extraction.
            It will land here as canonical memory.
          </p>
        </div>
        <Button asChild>
          <Link href={`/w/${workspaceId}/capture`}>
            <Plus className="mr-1 h-4 w-4" />
            Capture a signal
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
