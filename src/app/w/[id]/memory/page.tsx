import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const MEMORIES = [
  {
    title: "Call with Ayesha, UT Austin MSA",
    date: "Apr 16, 2026",
    segment: "Campus Muslim student",
    painPoints: ["Late-night reliability", "Delivery fees too high for students"],
    quote:
      "Honestly if it doesn't deliver after 10pm it doesn't solve my actual problem.",
    confidence: "High",
  },
  {
    title: "Interview with Br. Khalid, restaurant owner",
    date: "Apr 15, 2026",
    segment: "Halal restaurant operator",
    painPoints: ["Payout timing", "No dedicated halal delivery brand"],
    quote: "Every week I chase Uber Eats for money I'm already owed.",
    confidence: "High",
  },
  {
    title: "DM thread with Fatima (potential rider)",
    date: "Apr 14, 2026",
    segment: "Rider",
    painPoints: ["Uncertainty around halal boundaries", "Flexible hours"],
    quote: "Can I refuse deliveries from places that sell alcohol on-site?",
    confidence: "Medium",
  },
];

export default async function MemoryLibraryPage(
  props: PageProps<"/w/[id]/memory">,
) {
  await props.params;

  return (
    <PageStub
      eyebrow="Memory Library"
      title="Every confirmed customer signal, searchable."
      description="This is the canonical record — after you've reviewed what the AI pulled out. Filter by theme, segment, or quote."
      phase="Phase 2"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search memories, quotes, themes…" />
        </div>
        <Badge variant="outline">All segments</Badge>
        <Badge variant="outline">Last 30 days</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MEMORIES.map((m) => (
          <Card key={m.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-base leading-tight">
                  {m.title}
                </CardTitle>
                <Badge
                  variant={m.confidence === "High" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {m.confidence}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {m.date} · {m.segment}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <blockquote className="border-l-2 border-teal-500 pl-3 text-sm italic text-ink-700 dark:text-ink-200">
                "{m.quote}"
              </blockquote>
              <div className="flex flex-wrap gap-1.5">
                {m.painPoints.map((p) => (
                  <Badge key={p} variant="secondary" className="font-normal">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageStub>
  );
}
