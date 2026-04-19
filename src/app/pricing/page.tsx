import Link from "next/link";
import {
  BadgeDollarSign,
  Check,
  Mail,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "@/components/settings/checkout-button";

type Tier = {
  id: "pilot" | "starter" | "growth";
  name: string;
  price: string;
  cadence?: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  cta: React.ReactNode;
  footnote?: string;
};

const TIERS: Tier[] = [
  {
    id: "pilot",
    name: "Pilot",
    price: "Free",
    tagline:
      "Try the loop on a single brand. Basic capture, lightweight memory.",
    features: [
      "1 brand",
      "Basic upload",
      "Limited Memory Library and Decision Ledger",
      "Dalil AI extraction on qualitative feedback",
    ],
    cta: (
      <Button asChild variant="outline" className="w-full">
        <Link href="/signup">Start for free</Link>
      </Button>
    ),
    footnote: "No credit card required.",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$39",
    cadence: "/ month",
    tagline: "The full learning loop for a single product or brand.",
    features: [
      "1 brand",
      "Core Memory Library",
      "Decision Ledger with evidence links",
      "Timeline (by time and by decisions)",
      "Recurring themes on the Log-a-Decision flow",
      "Qualitative + quantitative feedback",
    ],
    highlighted: true,
    cta: (
      <CheckoutButton
        label="Start 14-day trial"
        plan="starter"
        className="w-full gap-2"
      />
    ),
    footnote: "14-day free trial. Cancel anytime.",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    cadence: "/ month",
    tagline:
      "For growing teams that want deeper recall, more history, and integrations.",
    features: [
      "More seats for your team",
      "Integrations (Slack, Notion, Shopify, Gong)",
      "Stronger similar-issue recall",
      "Extended history and reporting",
      "Weekly GTM brief email",
      "Priority Dalil AI model routing",
    ],
    cta: (
      <CheckoutButton
        label="Start 14-day trial"
        plan="growth"
        variant="outline"
        className="w-full gap-2"
      />
    ),
    footnote: "14-day free trial. Cancel anytime.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-4 gap-1.5 bg-card/80">
          <BadgeDollarSign className="h-3.5 w-3.5 text-teal-700" />
          Pricing
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">
          Simple, honest pricing.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Start on the pilot, graduate as your product grows. Every plan uses
          the same Dalil AI extraction, the same Memory Library, and the same
          Decision Ledger — more history, seats, and integrations unlock
          at each tier.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative h-full",
              tier.highlighted ? "md:scale-[1.03]" : "",
            )}
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                <Badge className="gap-1 whitespace-nowrap bg-teal-700 text-white shadow-md dark:bg-teal-600">
                  <Sparkles className="h-3 w-3" />
                  Most popular
                </Badge>
              </div>
            )}
            <Card
              className={cn(
                "flex h-full flex-col overflow-visible",
                tier.highlighted
                  ? "border-teal-400 shadow-lg shadow-teal-900/10 ring-1 ring-teal-300/60 dark:border-teal-600 dark:ring-teal-700/60"
                  : "",
              )}
            >
            <CardHeader className="space-y-1 pt-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="font-display text-lg">
                  {tier.name}
                </CardTitle>
                {tier.highlighted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">
                    <ShieldCheck className="h-3 w-3" />
                    Starter
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{tier.tagline}</p>
              <div className="flex items-baseline gap-1 pt-2">
                <span
                  className={cn(
                    "font-display text-4xl font-semibold",
                    tier.highlighted
                      ? "text-teal-700 dark:text-teal-400"
                      : "text-ink-950 dark:text-ink-50",
                  )}
                >
                  {tier.price}
                </span>
                {tier.cadence && (
                  <span className="text-sm text-muted-foreground">
                    {tier.cadence}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              <ul className="flex-1 space-y-2.5 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        tier.highlighted
                          ? "bg-teal-700 text-white dark:bg-teal-600"
                          : "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-ink-700 dark:text-ink-200">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                {tier.cta}
                {tier.footnote && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    {tier.footnote}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        ))}
      </div>

      <Card className="mt-10 border-dashed bg-secondary/40">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="space-y-1">
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-950 dark:text-ink-50 sm:justify-start">
              <Mail className="h-4 w-4 text-teal-700" />
              For custom requirements, talk to us.
            </p>
            <p className="text-sm text-muted-foreground">
              Enterprise integrations, custom categories, on-prem, SSO,
              dedicated support — email{" "}
              <a
                href="mailto:dalil@dynelabs.org"
                className="font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                dalil@dynelabs.org
              </a>
              .
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-1.5">
            <a href="mailto:dalil@dynelabs.org">
              <Mail className="h-4 w-4" />
              Email us
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <FaqCard
          title="Is there a free trial?"
          body="Starter and Growth both include a 14-day free trial. You can cancel before the trial ends without being charged."
        />
        <FaqCard
          title="How does Dalil AI work?"
          body="Every plan uses Claude Sonnet 4.6 for extraction, rollup, and similar-issue recall. Growth unlocks deeper context and priority routing."
        />
        <FaqCard
          title="Can I switch plans?"
          body="Yes. Upgrade or downgrade anytime from Settings → Billing. Prorated at the next cycle."
        />
      </div>
    </div>
  );
}

function FaqCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="font-display text-sm font-semibold text-ink-950 dark:text-ink-50">
          {title}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
