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
  Clock,
  ArrowRight,
  Quote,
} from "lucide-react";
import { globalStats } from "@/lib/queries/workspaces";
import { listRecentActivity } from "@/lib/queries/recent";
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
    listRecentActivity(4).catch(() => []),
  ]);
  return (
    <>
      <section className="relative dalil-gradient-hero">
        <div className="dalil-grid-bg absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-14 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 md:pt-28">
          <LogoMark size={72} priority className="mb-5 sm:mb-6" />
          <Badge
            variant="outline"
            className="mb-5 gap-1.5 bg-card/80 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-700" />
            Dalil · AI-native founder memory
          </Badge>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl md:text-5xl lg:text-6xl">
            Stop losing what the market already told you.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:mt-5 sm:text-base md:text-lg">
            Dalil captures customer conversations, reconciles AI and founder
            understanding into a trusted source of truth, recalls similar
            issues from the past, and links every decision to the evidence
            behind it.
          </p>

          <div className="mt-8 w-full max-w-2xl sm:mt-10">
            <HeroChat />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm sm:mt-6">
            <Button
              asChild
              variant="outline"
              className="bg-card/60 backdrop-blur"
            >
              <Link href="/workspaces/new">Create workspace</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-card/60 backdrop-blur"
            >
              <Link href="/workspaces">Upload signal</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-card/60 backdrop-blur"
            >
              <Link href="/ideas">Open Idea Vault</Link>
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
            Three primitives that make founder learning compound: capture
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
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-medium text-teal-700">Recent memory</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50">
              What the market said this week.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Snapshot of confirmed memories and decisions from your active
              workspaces. Click through to any card for the full evidence trail.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/workspaces">
                Open a workspace
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:col-span-3 md:grid-cols-2">
            {recent.length === 0 ? (
              <Card className="md:col-span-2 border-dashed">
                <CardContent className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Create a workspace and capture your first
                    signal to see recent memory here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recent.map((r) => (
                <Link
                  key={`${r.kind}-${r.id}`}
                  href={`/w/${r.workspace_id}/${r.kind === "signal" ? "memory" : r.kind === "decision" ? "decisions" : "timeline"}`}
                >
                  <MemoryCard
                    kind={r.kind}
                    title={r.title}
                    segment={r.workspace_name ?? r.segment ?? "workspace"}
                    when={formatDistanceToNow(r.when)}
                    quote={r.quote ?? r.body}
                  />
                </Link>
              ))
            )}
          </div>
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
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-200/60">
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

type MemoryKind = "signal" | "decision" | "outcome";

const KIND_STYLES: Record<
  MemoryKind,
  { badge: "default" | "secondary" | "outline"; label: string }
> = {
  signal: { badge: "outline", label: "Signal" },
  decision: { badge: "default", label: "Decision" },
  outcome: { badge: "secondary", label: "Outcome" },
};

function MemoryCard({
  kind,
  title,
  segment,
  when,
  quote,
}: {
  kind: MemoryKind;
  title: string;
  segment: string;
  when: string;
  quote: string;
}) {
  const style = KIND_STYLES[kind];
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={style.badge}>{style.label}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {when}
          </span>
        </div>
        <h4 className="font-display text-base font-semibold leading-snug text-ink-950 dark:text-ink-50">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground">{segment}</p>
        <div className="mt-auto flex gap-2 border-l-2 border-teal-500 pl-3 text-sm italic text-ink-700 dark:text-ink-200">
          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
          <span>{quote}</span>
        </div>
      </CardContent>
    </Card>
  );
}
