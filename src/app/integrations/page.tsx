import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";

type IntegrationStatus = "connected" | "preview" | "coming_soon";

type Integration = {
  name: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  lastSync?: string;
  pullsPerWeek?: number;
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Dalil API",
    description: "Send signals and decisions to Dalil from any system.",
    category: "Developer",
    status: "preview",
    lastSync: "—",
    pullsPerWeek: 0,
  },
  {
    name: "Supabase",
    description:
      "Postgres, pgvector, and Row Level Security behind every memory.",
    category: "Data",
    status: "connected",
    lastSync: "streaming",
    pullsPerWeek: 1450,
  },
  {
    name: "Anthropic Claude",
    description:
      "Sonnet 4.6 powers extraction, workspace rollup, stage-zero chat, and the similar-issue ranker.",
    category: "AI",
    status: "connected",
    lastSync: "now",
    pullsPerWeek: 612,
  },
  {
    name: "Google Drive",
    description: "Index research docs, call summaries, and PRDs.",
    category: "Docs",
    status: "preview",
    lastSync: "3 days ago",
    pullsPerWeek: 8,
  },
  {
    name: "Notion",
    description: "Sync customer interview notes from your Notion workspace.",
    category: "Notes",
    status: "preview",
    lastSync: "yesterday",
    pullsPerWeek: 12,
  },
  {
    name: "Slack",
    description: "Forward customer DMs and channel threads as signals.",
    category: "Messaging",
    status: "coming_soon",
  },
  {
    name: "Gong",
    description: "Pull call recordings and transcripts directly into Dalil.",
    category: "Sales calls",
    status: "coming_soon",
  },
  {
    name: "Zoom",
    description: "Auto-ingest Zoom meeting recordings as raw signals.",
    category: "Meetings",
    status: "coming_soon",
  },
  {
    name: "Intercom",
    description:
      "Treat support tickets and chats as continuous customer signal.",
    category: "Support",
    status: "coming_soon",
  },
  {
    name: "Linear",
    description:
      "Link decisions to product tickets so outcome tracking closes the loop.",
    category: "Product",
    status: "coming_soon",
  },
  {
    name: "HubSpot",
    description: "Pull deal notes and lost-reason fields into your GTM memory.",
    category: "CRM",
    status: "coming_soon",
  },
  {
    name: "Zapier",
    description: "Any app into Dalil via a single webhook endpoint.",
    category: "Automation",
    status: "coming_soon",
  },
];

const BADGE_VARIANT: Record<
  IntegrationStatus,
  "default" | "secondary" | "outline"
> = {
  connected: "default",
  preview: "secondary",
  coming_soon: "outline",
};

const BADGE_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected",
  preview: "Preview",
  coming_soon: "Coming soon",
};

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter((i) => i.status === "connected");
  const preview = INTEGRATIONS.filter((i) => i.status === "preview");
  const comingSoon = INTEGRATIONS.filter((i) => i.status === "coming_soon");

  return (
    <PageStub
      eyebrow="Integrations"
      title="Meet your evidence where it already lives."
      description="Dalil's goal is not to replace your stack — it's to make your stack remember. Every integration feeds the same memory and decision ledger."
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile
          label="Connected"
          value={connected.length.toString()}
          hint="pipelines live"
          highlight
        />
        <MetricTile
          label="In preview"
          value={preview.length.toString()}
          hint="limited rollout"
        />
        <MetricTile
          label="Queued"
          value={comingSoon.length.toString()}
          hint="on the roadmap"
        />
        <MetricTile
          label="Signals this week"
          value={connected
            .reduce((acc, c) => acc + (c.pullsPerWeek ?? 0), 0)
            .toLocaleString()}
          hint="across all pipes"
        />
      </div>

      <Section title="Connected" items={connected} />
      <Separator className="my-10" />
      <Section title="In preview" items={preview} />
      <Separator className="my-10" />
      <Section title="On the roadmap" items={comingSoon} />
    </PageStub>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Integration[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title} ({items.length})
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <IntegrationCard key={i.name} item={i} />
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({ item }: { item: Integration }) {
  const isConnected = item.status === "connected";
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-1.5 font-display text-base">
              {isConnected && (
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
              )}
              {item.name}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.category}
            </p>
          </div>
          <Badge variant={BADGE_VARIANT[item.status]} className="shrink-0">
            {BADGE_LABEL[item.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{item.description}</p>

        {(item.lastSync || item.pullsPerWeek !== undefined) && (
          <div className="space-y-1 rounded-md bg-secondary/40 p-2.5 text-xs">
            {item.lastSync && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last sync</span>
                <span className="font-mono text-ink-950 dark:text-ink-50">
                  {item.lastSync}
                </span>
              </div>
            )}
            {item.pullsPerWeek !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pulls / week</span>
                <span className="font-mono text-ink-950 dark:text-ink-50">
                  {item.pullsPerWeek.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto">
          <Button
            variant={isConnected ? "outline" : "outline"}
            size="sm"
            disabled={item.status === "coming_soon"}
            className="w-full"
          >
            {isConnected
              ? "Configure"
              : item.status === "preview"
                ? "Join preview"
                : "Request access"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight ? "border-teal-300/70 bg-teal-50/40 dark:bg-teal-950/30" : undefined
      }
    >
      <CardContent className="pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink-950 dark:text-ink-50">
          {value}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
