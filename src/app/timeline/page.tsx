import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function GlobalTimelinePage() {
  return (
    <PageStub
      eyebrow="Timeline"
      title="Chronology of learning, across workspaces."
      description="Global view of signals, decisions, and outcomes. Scope to a workspace to see the loop for one product or one market."
    >
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-10">
          <p className="text-muted-foreground">
            The timeline lives inside each workspace. Open one to see its
            signal → decision → outcome chronology.
          </p>
          <Button asChild>
            <Link href="/workspaces">
              Pick a workspace
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageStub>
  );
}
