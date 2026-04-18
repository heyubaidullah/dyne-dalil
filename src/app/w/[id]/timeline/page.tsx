import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  Lightbulb,
  GitBranch,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const ENTRIES = [
  {
    date: "Apr 17, 2026",
    kind: "outcome" as const,
    title: "Outcome: late-night delivery pilot → improved conversion 23%",
    body: "Retention held at 68% vs. 45% baseline. Decision validated.",
  },
  {
    date: "Apr 16, 2026",
    kind: "signal" as const,
    title: "Signal: 3 prospects cited 10pm cutoff unprompted",
    body: "Consistent thread: Muslim students study late and want halal late-night options.",
  },
  {
    date: "Apr 15, 2026",
    kind: "decision" as const,
    title: "Decision: extend delivery window to midnight weekends only",
    body: "Pilot launched with 4 restaurants, monitored rider supply.",
  },
  {
    date: "Apr 12, 2026",
    kind: "signal" as const,
    title: "Signal: Br. Khalid interview — payout timing is a #1 pain",
    body: "Pattern: 3 other restaurant interviews echoed this within the week.",
  },
  {
    date: "Apr 10, 2026",
    kind: "decision" as const,
    title: "Decision: launch halal-only, no mixed kitchens",
    body: "Trust wedge over catalog breadth. Evidence: 7 of 9 interviews.",
  },
];

const KIND_META = {
  signal: { icon: Inbox, color: "text-ink-600", label: "Signal" },
  decision: { icon: GitBranch, color: "text-teal-700", label: "Decision" },
  outcome: { icon: TrendingUp, color: "text-gold-600", label: "Outcome" },
  insight: { icon: Lightbulb, color: "text-gold-600", label: "Insight" },
  regression: { icon: TrendingDown, color: "text-red-600", label: "Regression" },
};

export default async function TimelinePage(
  props: PageProps<"/w/[id]/timeline">,
) {
  await props.params;

  return (
    <PageStub
      eyebrow="Timeline"
      title="The visible chronology of learning."
      description="Signals lead to decisions, decisions produce outcomes, outcomes reshape what you test next. This is where the loop becomes visible."
      phase="Phase 3"
    >
      <Card>
        <CardContent className="pt-6">
          <ol className="relative space-y-8 border-l-2 border-border pl-6">
            {ENTRIES.map((e, i) => {
              const meta = KIND_META[e.kind];
              const Icon = meta.icon;
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {e.date}
                      </span>
                    </div>
                    <p className="font-display text-base font-medium leading-snug text-ink-950 dark:text-ink-50">
                      {e.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{e.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </PageStub>
  );
}
