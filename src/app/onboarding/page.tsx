import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const revalidate = 0;

type Search = { template?: string };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const useSuhba = (sp.template ?? "").toLowerCase() === "suhba";

  const initial = useSuhba
    ? {
        company_name: "SUHBA",
        product_name: "SUHBA all-weather jacket",
        audience_group:
          "Young Muslim consumers; Gen Z modest-fashion shoppers in the US and UK",
        product_category: "Apparel / modest fashion",
        main_goal: "Improve customer feedback tracking and product decisions",
        preferred_focus: "Product quality and fit",
        team_size: 5,
        company_notes:
          "Founding team of five. Launched V1 jacket three months ago; V2 cut planned for next quarter.",
      }
    : {
        company_name: "",
        product_name: "",
        audience_group: "",
        product_category: "",
        main_goal: "Improve customer feedback tracking and product decisions",
        preferred_focus: "",
        team_size: undefined,
        company_notes: "",
      };

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Badge variant="outline" className="mb-4 bg-card/80">
        <Sparkles className="mr-1 h-3 w-3 text-teal-700" />
        Onboarding · step 1 of 1
      </Badge>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">
        Set up your first Dashboard.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Tell Dalil AI about your company and product so it can categorize every
        piece of customer feedback correctly and surface the right recurring
        themes.
      </p>

      {!useSuhba && (
        <Card className="mt-6 border-dashed bg-teal-50/60 ring-1 ring-teal-200/60 dark:bg-teal-950/20">
          <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                Try the SUHBA demo
              </p>
              <p className="text-sm text-muted-foreground">
                Pre-fill the form with a modest-streetwear brand so you can
                walk the full flow without typing.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/onboarding?template=suhba">
                Prefill SUHBA
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Company profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OnboardingForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
