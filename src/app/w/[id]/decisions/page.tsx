import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

const DECISIONS = [
  {
    title: "Cap delivery radius at 3 miles for pilot launch",
    category: "Operations",
    rationale:
      "Rider retention in wider pilots dropped 40% when average delivery exceeded 20 minutes.",
    evidence: 4,
    expected: "Higher rider retention, shorter delivery times",
    outcome: "Improved" as const,
  },
  {
    title: "Launch with halal-only selection, no mixed kitchens",
    category: "Positioning",
    rationale:
      "Seven of nine customer interviews explicitly worried about cross-contamination.",
    evidence: 7,
    expected: "Stronger trust signal, tighter catalog",
    outcome: "Pending" as const,
  },
  {
    title: "Price rider payouts at 75% of delivery fee",
    category: "Pricing",
    rationale:
      "Rider interviews surfaced payout opacity as the #1 objection vs. Uber/DoorDash.",
    evidence: 3,
    expected: "Better rider supply, higher NPS from rider side",
    outcome: "Inconclusive" as const,
  },
];

const OUTCOME_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  Improved: "default",
  Pending: "outline",
  Inconclusive: "secondary",
  Failed: "secondary",
};

export default async function DecisionLedgerPage(
  props: PageProps<"/w/[id]/decisions">,
) {
  await props.params;

  return (
    <PageStub
      eyebrow="Decision Ledger"
      title="Every decision, with its evidence."
      description="Decisions linked to the signals that justified them. When outcomes land, the learning loop closes here."
      phase="Phase 3"
    >
      <div className="mb-4 flex items-center justify-end">
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Log a decision
        </Button>
      </div>

      <div className="space-y-4">
        {DECISIONS.map((d) => (
          <Card key={d.title}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Badge variant="outline" className="font-normal">
                    {d.category}
                  </Badge>
                  <CardTitle className="font-display text-lg">
                    {d.title}
                  </CardTitle>
                </div>
                <Badge variant={OUTCOME_VARIANTS[d.outcome]}>{d.outcome}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rationale
                </p>
                <p>{d.rationale}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Expected outcome
                  </p>
                  <p className="text-muted-foreground">{d.expected}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Evidence
                  </p>
                  <div className="flex items-center gap-1.5 text-teal-700 hover:text-teal-600 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">
                      {d.evidence} linked memories
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageStub>
  );
}
