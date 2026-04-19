"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, AlertCircle, Gem, FlaskConical } from "lucide-react";
import { StartModal } from "@/components/home/start-modal";

const STARTER_PROMPTS = [
  "I want to validate a startup idea",
  "Help me turn customer notes into insight",
  "What patterns are showing up in my latest calls?",
  "I have a problem but no product idea yet",
];

const AXES = [
  {
    label: "The idea, in one sentence",
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  {
    label: "The narrowest honest audience",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  {
    label: "A specific pain point",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  {
    label: "Pressure-tested value",
    icon: <Gem className="h-3.5 w-3.5" />,
  },
  {
    label: "What to test first",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
  },
];

function StartContent() {
  const searchParams = useSearchParams();
  const initialSeed = searchParams.get("q")?.trim() || undefined;
  const [open, setOpen] = useState(true);
  const [seedText, setSeedText] = useState<string | undefined>(initialSeed);

  function launch(prompt?: string) {
    setSeedText(prompt);
    setOpen(true);
  }

  return (
    <>
      <PageStub
        eyebrow="Dalil Start"
        title="What do you want to do today?"
        description="A guided conversation for stage-zero builders. Articulate the idea, narrow the audience, pressure-test the value, and save the approved concept to your Idea Vault."
        phase="Stage-zero chat"
      >
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => launch(p)}
                >
                  <Sparkles className="mr-1 h-3 w-3 text-teal-700" />
                  {p}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {AXES.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                    {a.icon}
                  </span>
                  <span className="leading-tight">{a.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Approved ideas auto-save to your Idea Vault. Convert any one to
                a full workspace when you&apos;re ready.
              </p>
              <Button onClick={() => launch()} className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                Open guided chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageStub>
      <StartModal open={open} onOpenChange={setOpen} seedText={seedText} />
    </>
  );
}

export default function StartPage() {
  return (
    <Suspense>
      <StartContent />
    </Suspense>
  );
}
