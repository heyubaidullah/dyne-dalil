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
import { StepFlowNav } from "@/components/layout/step-flow-nav";

export const revalidate = 0;

export default async function MemoryLibraryPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ id }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const categoryFilter = searchParams?.category?.trim();
  const [workspace, signals] = await Promise.all([
    getWorkspace(id),
    listSignalsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const filtered = categoryFilter
    ? signals.filter(
        (s) =>
          (s.category ?? "").trim().toLowerCase() ===
          categoryFilter.toLowerCase(),
      )
    : signals;

  const confirmed = filtered.filter((s) => s.analysis?.confirmed_at);
  const pending = filtered.filter((s) => !s.analysis?.confirmed_at);

  const allCategories = Array.from(
    new Set(
      signals
        .map((s) => s.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort();

  return (
    <PageStub
      eyebrow={`${workspace.name} · Memory Library`}
      title={
        categoryFilter
          ? `${categoryFilter} memories`
          : "Canonical memories, searchable and sourced."
      }
      description="Every confirmed piece of customer feedback — after you've reviewed the Dalil AI extraction. The source of truth for recall and decisions."
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        {allCategories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <Link href={`/w/${id}/memory`}>
              <Badge
                variant={categoryFilter ? "outline" : "default"}
                className="cursor-pointer"
              >
                All
              </Badge>
            </Link>
            {allCategories.map((c) => (
              <Link
                key={c}
                href={`/w/${id}/memory?category=${encodeURIComponent(c)}`}
              >
                <Badge
                  variant={
                    categoryFilter?.toLowerCase() === c.toLowerCase()
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                >
                  {c}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link href={`/w/${id}/capture`}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Feedback
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyMemory workspaceId={id} filtered={Boolean(categoryFilter)} />
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Pending review ({pending.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pending.map((s) => (
                  <MemoryCard key={s.id} workspaceId={id} signal={s} pending />
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

      <StepFlowNav workspaceId={id} current="memory" />
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
            {signal.title ?? "Untitled input"}
          </CardTitle>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {signal.category && (
              <Badge variant="outline" className="font-normal">
                {signal.category}
              </Badge>
            )}
            {signal.feedback_type && (
              <Badge
                variant="secondary"
                className="font-normal capitalize"
              >
                {signal.feedback_type}
              </Badge>
            )}
            {pending ? (
              <Badge variant="outline">Pending review</Badge>
            ) : (
              <Badge
                variant={confidence === "high" ? "default" : "secondary"}
                className="capitalize"
              >
                {confidence}
              </Badge>
            )}
          </div>
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
        {a?.positive_feedback && a.positive_feedback.length > 0 && (
          <FeedbackRow
            label="Positive feedback"
            tone="positive"
            items={a.positive_feedback}
          />
        )}
        {a?.negative_feedback && a.negative_feedback.length > 0 && (
          <FeedbackRow
            label="Negative feedback"
            tone="negative"
            items={a.negative_feedback}
          />
        )}
        {a?.pain_points && a.pain_points.length > 0 && (
          <FeedbackRow
            label="Pain points"
            tone="pain"
            items={a.pain_points}
          />
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

function FeedbackRow({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "positive" | "negative" | "pain";
  items: string[];
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100"
      : tone === "negative"
        ? "border-rose-300/70 bg-rose-50 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-100"
        : "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100";
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 4).map((p) => (
          <span
            key={p}
            className={`rounded-md border px-2 py-0.5 text-xs font-normal ${toneClass}`}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyMemory({
  workspaceId,
  filtered,
}: {
  workspaceId: string;
  filtered?: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
          <Inbox className="h-5 w-5 text-teal-700" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            {filtered ? "No memories in this category yet." : "No memories yet."}
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first piece of feedback and confirm the Dalil AI extraction.
            It will land here as canonical memory.
          </p>
        </div>
        <Button asChild>
          <Link href={`/w/${workspaceId}/capture`}>
            <Plus className="mr-1 h-4 w-4" />
            Add New Feedback
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
