import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NewWorkspacePage() {
  return (
    <PageStub
      eyebrow="New workspace"
      title="Name your next 0→1 bet."
      description="A workspace is the home for one product or one market. Signals, decisions, and outcomes live here together."
      phase="Phase 1"
    >
      <Card className="max-w-2xl">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" placeholder="e.g. Halal Delivery 0→1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              One-line description
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                optional
              </span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What are you trying to learn? Who's the early target?"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button>Create workspace</Button>
          </div>
        </CardContent>
      </Card>
    </PageStub>
  );
}
