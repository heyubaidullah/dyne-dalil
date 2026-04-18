import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INTEGRATIONS = [
  {
    name: "Gong",
    description: "Pull call recordings and transcripts directly into Dalil.",
    category: "Sales calls",
    status: "Coming soon",
  },
  {
    name: "Zoom",
    description: "Auto-ingest Zoom meeting recordings as raw signals.",
    category: "Meetings",
    status: "Coming soon",
  },
  {
    name: "Notion",
    description: "Sync customer interview notes from your Notion workspace.",
    category: "Notes",
    status: "Coming soon",
  },
  {
    name: "Slack",
    description: "Forward customer DMs and channel threads as signals.",
    category: "Messaging",
    status: "Coming soon",
  },
  {
    name: "Intercom",
    description: "Treat support tickets and chats as continuous customer signal.",
    category: "Support",
    status: "Coming soon",
  },
  {
    name: "Linear",
    description:
      "Link decisions to product tickets so outcome tracking closes the loop.",
    category: "Product",
    status: "Coming soon",
  },
  {
    name: "HubSpot",
    description: "Pull deal notes and lost-reason fields into founder memory.",
    category: "CRM",
    status: "Coming soon",
  },
  {
    name: "Google Drive",
    description: "Index research docs, call summaries, and PRDs.",
    category: "Docs",
    status: "Coming soon",
  },
  {
    name: "Dalil API",
    description: "Send signals and decisions to Dalil from any system.",
    category: "Developer",
    status: "Preview",
  },
];

export default function IntegrationsPage() {
  return (
    <PageStub
      eyebrow="Integrations"
      title="Meet your evidence where it already lives."
      description="Dalil's goal is not to replace your stack — it's to make your stack remember. Every integration feeds the same memory and decision ledger."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display text-base">
                    {i.name}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {i.category}
                  </p>
                </div>
                <Badge
                  variant={i.status === "Preview" ? "default" : "outline"}
                  className="shrink-0"
                >
                  {i.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{i.description}</p>
              <Button variant="outline" size="sm" disabled={i.status !== "Preview"}>
                {i.status === "Preview" ? "Configure" : "Request access"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageStub>
  );
}
