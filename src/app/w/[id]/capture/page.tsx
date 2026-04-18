import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export default async function CapturePage(props: PageProps<"/w/[id]/capture">) {
  const { id } = await props.params;

  return (
    <PageStub
      eyebrow="Capture"
      title="From messy notes to confirmed memory."
      description="Paste a transcript, notes, or a rough recap. Dalil extracts structured fields — you confirm before it becomes canonical memory."
      phase="Phase 2"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-lg">New signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g. Call with Ayesha, UT Austin student" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source type</Label>
                <Select>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Pick a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Customer call</SelectItem>
                    <SelectItem value="interview">User interview</SelectItem>
                    <SelectItem value="notes">Raw notes</SelectItem>
                    <SelectItem value="transcript">Transcript</SelectItem>
                    <SelectItem value="email">Email thread</SelectItem>
                    <SelectItem value="slack">Slack / DM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raw">Raw text</Label>
              <Textarea
                id="raw"
                rows={14}
                placeholder="Paste the transcript or type what you remember. Dalil handles the structure."
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost">Save as draft</Button>
              <Button className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Run AI extraction
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Workspace: <span className="font-mono">{id}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-dashed bg-secondary/40">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              What happens next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Step n={1} title="AI extracts structure">
              Pain points, objections, requests, urgency, likely segment, quotes.
            </Step>
            <Step n={2} title="You review and correct">
              Edit anything the AI got wrong. Your version is the source of truth.
            </Step>
            <Step n={3} title="Saved as canonical memory">
              Embeddings get generated so future similar issues can surface this one.
            </Step>
            <Step n={4} title="Recall surfaces past context">
              Dalil checks: have we seen this before? What did we decide last time?
            </Step>
          </CardContent>
        </Card>
      </div>
    </PageStub>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
        {n}
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs">{children}</p>
      </div>
    </div>
  );
}
