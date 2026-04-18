import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";

const IDEAS = [
  {
    id: "halal-delivery",
    name: "Halal Delivery 0→1",
    audience: "Muslim college students at large public universities",
    problem:
      "Late-night halal delivery is effectively impossible after 10pm on most campuses.",
    status: "Converted",
  },
  {
    id: "zakat-automation",
    name: "Zakat Automation for Founders",
    audience: "Muslim founders with variable annual income",
    problem:
      "Calculating zakat over appreciating startup equity and receivables is stressful and manual.",
    status: "Validated",
  },
  {
    id: "masjid-crm",
    name: "Masjid CRM",
    audience: "Masjid board members and event coordinators",
    problem:
      "Member data is scattered across WhatsApp groups, spreadsheets, and three different sign-up forms.",
    status: "Exploring",
  },
];

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  Converted: "default",
  Validated: "secondary",
  Exploring: "outline",
};

export default function IdeaVaultPage() {
  return (
    <PageStub
      eyebrow="Idea Vault"
      title="Every stage-zero idea, saved and sharpened."
      description="Ideas approved through the homepage 'What do you want to do today?' chat. Convert one to a workspace when you're ready to start capturing evidence."
    >
      <div className="mb-4 flex items-center justify-end">
        <Button asChild className="gap-1.5">
          <Link href="/start">
            <Sparkles className="h-4 w-4" />
            Start a new idea
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {IDEAS.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-lg">
                  {idea.name}
                </CardTitle>
                <Badge variant={STATUS_VARIANTS[idea.status]}>
                  {idea.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Audience
                </p>
                <p>{idea.audience}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Problem
                </p>
                <p className="text-muted-foreground">{idea.problem}</p>
              </div>
              <div className="flex justify-end pt-1">
                {idea.status === "Converted" ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/w/${idea.id}`}>
                      Open workspace
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">
                    Convert to workspace
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageStub>
  );
}
