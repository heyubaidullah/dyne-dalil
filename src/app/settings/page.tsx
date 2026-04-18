import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <PageStub
      eyebrow="Settings"
      title="Workspace defaults and AI preferences."
      description="Tune extraction style, embedding model, and default recall depth. All tenant-scoped."
      phase="Phase 4"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Extraction model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which LLM handles raw signal → structured memory extraction.
            </p>
            <Button variant="outline">Claude 4.7 Sonnet (default)</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Embeddings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Controls semantic recall quality. Rebuilds regenerate vectors for
              every memory and decision.
            </p>
            <div className="space-y-2">
              <Label htmlFor="emb">Model</Label>
              <Input id="emb" defaultValue="text-embedding-3-small" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageStub>
  );
}
