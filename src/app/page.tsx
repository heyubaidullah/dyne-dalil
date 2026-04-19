import Link from "next/link";
import { HeroChat } from "@/components/home/hero-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  CheckCircle2,
  GitBranch,
  LineChart,
  Sparkles,
  Telescope,
  ArrowRight,
  PlusCircle,
  MessageSquarePlus,
  Vault,
} from "lucide-react";
import { globalStats } from "@/lib/queries/workspaces";
import { listRecentActivity, type RecentEntry } from "@/lib/queries/recent";
import { formatDistanceToNow } from "@/lib/format";
import { LogoMark } from "@/components/layout/logo";

export const revalidate = 60;

export default async function HomePage() {
  const [stats, recent] = await Promise.all([
    globalStats().catch(() => ({
      signals: 0,
      decisions: 0,
      outcomes: 0,
      similar_recalls: 0,
    })),
    listRecentActivity(8).catch(() => []),
  ]);
  return (
    <>
      <section className="relative dalil-gradient-hero">
        <div className="dalil-grid-bg absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-5 pb-12 text-center sm:px-6 sm:pt-6 sm:pb-16 md:pt-8">
          <LogoMark size={72} priority className="mb-5 sm:mb-6" />
          <Badge
            variant="outline"
            className="mb-5 gap-1.5 bg-card/80 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            Dalil · AI-native GTM memory for products, teams and companies
          </Badge>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl md:text-5xl lg:text-6xl">
            Stop losing what the market already told you.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:mt-5 sm:text-base md:text-lg">
            Dalil captures customer conversations, business feedback,
            reconciles Dalil AI and team understanding into a trusted
            source of truth, recalls similar issues from the past, and
            links every decision to the evidence behind it.
          </p>

          <div className="mt-8 w-full max-w-2xl sm:mt-10">
            <HeroChat />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm sm:mt-6">
            <Button
              asChild
              size="lg"
              className="gap-1.5 bg-teal-700 text-white shadow-lg shadow-teal-900/20 hover:bg-teal-600"
            >
              <Link href="/onboarding">
                <PlusCircle className="h-4 w-4" />
                Create Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-1.5 border-teal-300/80 bg-card/95 shadow-sm hover:bg-teal-50"
            >
              <Link href="/workspaces">
                <MessageSquarePlus className="h-4 w-4" />
                Add feedback
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-1.5 border-teal-300/80 bg-card/95 shadow-sm hover:bg-teal-50"
            >
              <Link href="/ideas">
                <Vault className="h-4 w-4" />
                Open Idea Vault
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          <Stat
            icon={<Inbox className="h-4 w-4" />}
            label="Signals captured"
            value={stats.signals.toString()}
          />
          <Stat
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Decisions logged"
            value={stats.decisions.toString()}
          />
          <Stat
            icon={<Telescope className="h-4 w-4" />}
            label="Memories indexed"
            value={stats.similar_recalls.toString()}
          />
          <Stat
            icon={<LineChart className="h-4 w-4" />}
            label="Outcomes tracked"
            value={stats.outcomes.toString()}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-teal-700">
            How Dalil works
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">
            Built for the 0→1 stage, not the 0.5→1 stage.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three primitives that make team learning compound: capture
            what the market said, surface what happened last time, and link
            every decision to the evidence behind it.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PillarCard
            icon={<Sparkles className="h-5 w-5 text-teal-700" />}
            title="Consensus Capture"
            body="The AI proposes its reading of a call or note. You correct, confirm, and the final version becomes the canonical memory — never a raw summary."
          />
          <PillarCard
            icon={<Telescope className="h-5 w-5 text-teal-700" />}
            title="Similar-Issue Recall"
            body="When a new signal lands, Dalil surfaces semantically similar past issues and the decisions that followed — so you don't re-solve a problem you already answered."
          />
          <PillarCard
            icon={<GitBranch className="h-5 w-5 text-teal-700" />}
            title="Decision Timeline"
            body="Every decision is logged with its evidence and expected outcome. When the real outcome lands, the learning loop closes — and what to test next gets clearer."
          />
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-teal-700">
                Recent memory
              </p>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-3xl">
                Recent Memories
              </h3>
            </div>
            <Link
              href="/memory"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 transition-colors hover:text-teal-600 dark:text-teal-400"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No activity yet. Create a Dashboard and add your first piece
                  of feedback to see recent memory here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              {(() => {
                // Prefer a decision for the featured "AI Insight" card;
                // otherwise fall back to whatever is 4th. The remaining
                // three slots fill the top row + bottom-left.
                const featured =
                  recent.find((r) => r.kind === "decision") ?? recent[3] ?? recent[0];
                const regulars = recent
                  .filter((r) => !(r.kind === featured.kind && r.id === featured.id))
                  .slice(0, 3);

                // Bento spans: row 1 = 3/3, row 2 = 2/4 (featured on right).
                const spans = [
                  "sm:col-span-3",
                  "sm:col-span-3",
                  "sm:col-span-2",
                ];

                return (
                  <>
                    {regulars.map((r, i) => (
                      <div
                        key={`${r.kind}-${r.id}`}
                        className={spans[i] ?? "sm:col-span-3"}
                      >
                        <MemoryCard entry={r} />
                      </div>
                    ))}
                    <div className="sm:col-span-4">
                      <AiInsightCard entry={featured} />
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
        <h3 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">
          Evidence for every next move.
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Build with the calm that comes from knowing your last call, last
          decision, and last outcome are all still working for you.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button asChild size="lg">
            <Link href="/start">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Start with an idea
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/workspaces">Open a workspace</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-display text-2xl font-semibold text-ink-950 dark:text-ink-50 sm:text-3xl">
        {value}
      </span>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
          {icon}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-ink-50">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

type KindPill = {
  label: string;
  className: string;
};

function pillsFor(entry: RecentEntry): KindPill[] {
  const pills: KindPill[] = [];
  if (entry.kind === "decision") {
    pills.push({
      label: "Decision",
      className:
        "bg-rose-100 text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900/60",
    });
  } else if (entry.kind === "outcome") {
    const status = entry.outcome_status ?? "pending";
    if (status === "improved") {
      pills.push({
        label: "Outcome · improved",
        className:
          "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900/60",
      });
    } else if (status === "failed") {
      pills.push({
        label: "Outcome · failed",
        className:
          "bg-red-100 text-red-700 ring-1 ring-red-200/70 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/60",
      });
    } else {
      pills.push({
        label: "Outcome",
        className:
          "bg-amber-100 text-amber-800 ring-1 ring-amber-200/70 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/60",
      });
    }
  } else {
    pills.push({
      label: "Feedback",
      className:
        "bg-teal-100 text-teal-800 ring-1 ring-teal-200/70 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900/60",
    });
  }

  if (entry.category) {
    pills.push({
      label: entry.category,
      className:
        "bg-ink-100 text-ink-800 ring-1 ring-ink-200/70 dark:bg-ink-800 dark:text-ink-100 dark:ring-ink-700",
    });
  }

  return pills.slice(0, 2);
}

function hrefFor(entry: RecentEntry): string {
  if (entry.kind === "signal") return `/w/${entry.workspace_id}/memory`;
  if (entry.kind === "decision") return `/w/${entry.workspace_id}/decisions`;
  return `/w/${entry.workspace_id}/timeline`;
}

function MemoryCard({ entry }: { entry: RecentEntry }) {
  const pills = pillsFor(entry);
  const body = entry.quote ?? entry.body;
  return (
    <Link href={hrefFor(entry)} className="group block h-full">
      <Card className="dalil-lift flex h-full min-h-[190px] flex-col">
        <CardContent className="flex h-full flex-col gap-3 pt-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {pills.map((p) => (
                <span
                  key={p.label}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${p.className}`}
                >
                  {p.label}
                </span>
              ))}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(entry.when)}
            </span>
          </div>

          <h4 className="font-display text-base font-semibold leading-snug text-ink-950 line-clamp-2 dark:text-ink-50">
            {entry.title}
          </h4>

          {body && (
            <p className="text-sm text-ink-700 line-clamp-3 dark:text-ink-200">
              {body}
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] font-semibold text-white dark:bg-teal-600">
              {initialsFromWorkspace(entry.workspace_name)}
            </span>
            <span className="truncate">
              From{" "}
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {entry.workspace_name ?? "a Dashboard"}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function AiInsightCard({ entry }: { entry: RecentEntry }) {
  return (
    <Link href={hrefFor(entry)} className="group block h-full">
      <div className="dalil-lift relative flex h-full min-h-[190px] flex-col justify-center gap-4 overflow-hidden rounded-xl bg-teal-900 p-6 text-teal-50 ring-1 ring-teal-800 dark:bg-teal-950 dark:ring-teal-900">
        <span
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-700/30 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-8 top-6 text-teal-300/30"
          aria-hidden
        >
          <Sparkles className="h-8 w-8" />
        </span>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-teal-800/60 px-2.5 py-0.5 text-[11px] font-medium text-teal-100 ring-1 ring-teal-700">
              <Sparkles className="h-3 w-3" />
              AI Insight
            </span>
            <h4 className="font-display text-lg font-semibold leading-snug text-white line-clamp-2">
              {entry.title}
            </h4>
            {entry.body && (
              <p className="mt-2 max-w-xl text-sm text-teal-100/85 line-clamp-2">
                {entry.body}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-900 shadow-sm transition-transform group-hover:translate-x-0.5">
            Review Synthesis
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function initialsFromWorkspace(name: string | null): string {
  if (!name) return "D";
  const parts = name
    .replace(/[·—–\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
