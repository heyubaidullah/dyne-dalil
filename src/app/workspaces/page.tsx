import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";

const DEMO_WORKSPACES = [
  {
    id: "halal-delivery",
    name: "Halal Delivery 0→1",
    description:
      "Pilot halal-only food delivery marketplace — pricing, rider economics, campus demand.",
    signals: 14,
    decisions: 6,
    lastActive: "2 hours ago",
  },
  {
    id: "prayer-time-saas",
    name: "Prayer-Time SaaS",
    description:
      "B2B prayer scheduling for mosque admins and Muslim-run companies.",
    signals: 8,
    decisions: 3,
    lastActive: "yesterday",
  },
];

export default function WorkspacesPage() {
  return (
    <PageStub
      eyebrow="Workspaces"
      title="Every founder memory, scoped."
      description="A workspace is one product, one market, one set of customers. Pick one to dive in, or start a new one from scratch or from an approved idea."
    >
      <div className="mb-6 flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/ideas">Convert from Idea Vault</Link>
        </Button>
        <Button asChild>
          <Link href="/workspaces/new">
            <Plus className="mr-1 h-4 w-4" />
            New workspace
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_WORKSPACES.map((w) => (
          <Link key={w.id} href={`/w/${w.id}`} className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-ink-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-display text-xl">
                    {w.name}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{w.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{w.signals} signals</Badge>
                  <Badge variant="secondary">{w.decisions} decisions</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {w.lastActive}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageStub>
  );
}
