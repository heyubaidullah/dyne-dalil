import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  return (
    <PageStub
      eyebrow="Billing"
      title="Payment received."
      description="Stripe confirmed your checkout session. You can continue using Dalil and review billing settings any time."
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <CircleCheckBig className="h-4 w-4 text-teal-700" />
            Checkout complete
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 pt-0">
          <Button asChild>
            <Link href="/settings">Back to settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspaces">Go to dashboards</Link>
          </Button>
        </CardContent>
      </Card>
    </PageStub>
  );
}
