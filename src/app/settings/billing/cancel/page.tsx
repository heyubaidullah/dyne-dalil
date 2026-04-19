import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <PageStub
      eyebrow="Billing"
      title="Checkout was canceled."
      description="No charge was made. You can try again whenever you are ready."
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <CircleAlert className="h-4 w-4 text-amber-600" />
            Payment not completed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 pt-0">
          <Button asChild>
            <Link href="/settings">Try checkout again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspaces">Return to app</Link>
          </Button>
        </CardContent>
      </Card>
    </PageStub>
  );
}
