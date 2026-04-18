import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Lightbulb,
  GitBranch,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export default async function WorkspaceDashboard(
  props: PageProps<"/w/[id]">,
) {
  const { id } = await props.params;
  const workspaceName = id
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");

  return (
    <PageStub
      eyebrow="Workspace"
      title={workspaceName}
      description="What the market is saying, what you decided because of it, and what to test next."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <RollupCard
          icon={<Inbox className="h-4 w-4" />}
          label="Signals captured"
          value="14"
          trend="+3 this week"
        />
        <RollupCard
          icon={<Lightbulb className="h-4 w-4" />}
          label="Confirmed memories"
          value="11"
          trend="79% confirmation rate"
        />
        <RollupCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Decisions logged"
          value="6"
          trend="2 pending outcomes"
        />
        <RollupCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Outcome win rate"
          value="67%"
          trend="4 of 6 tracked"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Recurring themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {THEMES.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.mentions} mentions across {t.signals} signals
                  </p>
                </div>
                <Badge variant={t.trend === "rising" ? "default" : "secondary"}>
                  {t.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Next tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {NEXT_TESTS.map((t, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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

const THEMES = [
  {
    label: "Late-night delivery reliability",
    mentions: 9,
    signals: 6,
    trend: "rising" as const,
  },
  {
    label: "Halal certification visibility",
    mentions: 7,
    signals: 5,
    trend: "stable" as const,
  },
  {
    label: "Rider payout transparency",
    mentions: 4,
    signals: 3,
    trend: "rising" as const,
  },
];

const NEXT_TESTS = [
  {
    title: "Ship a late-night-only landing variant",
    why: "Three prospects said they'd pay 15% more if delivery held after 10pm.",
  },
  {
    title: "Add certifier badges to every restaurant card",
    why: "Five customers mentioned doubt about halal authenticity by name.",
  },
];
