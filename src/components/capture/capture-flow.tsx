"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  CheckCircle2,
  Telescope,
  RotateCcw,
  ArrowRight,
  Quote,
} from "lucide-react";
import { TagInput } from "./tag-input";
import { ingestSignalAction } from "@/app/actions/signals";
import { confirmAnalysisAction } from "@/app/actions/signals";
import type { Extraction } from "@/lib/ai/extract";

type Similar = {
  id: string;
  signal_id: string;
  confirmed_summary: string | null;
  similarity: number;
};

type Step = "ingest" | "extracting" | "review" | "confirmed";

export function CaptureFlow({ workspaceId }: { workspaceId: string }) {
  const [step, setStep] = useState<Step>("ingest");
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<string>("");
  const [rawText, setRawText] = useState("");

  const [signalId, setSignalId] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [founderNotes, setFounderNotes] = useState("");
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [pending, startTransition] = useTransition();

  function reset() {
    setStep("ingest");
    setTitle("");
    setSourceType("");
    setRawText("");
    setSignalId(null);
    setExtraction(null);
    setFounderNotes("");
    setSimilar([]);
  }

  function runExtraction() {
    if (rawText.trim().length < 20) {
      toast.error("Paste at least a sentence or two before extracting.");
      return;
    }
    setStep("extracting");
    startTransition(async () => {
      const res = await ingestSignalAction({
        workspace_id: workspaceId,
        title: title.trim(),
        source_type: sourceType,
        raw_text: rawText,
      });
      if (!res.ok) {
        toast.error(res.error);
        setStep("ingest");
        return;
      }
      setSignalId(res.signal_id);
      setExtraction(res.extraction);
      setStep("review");
    });
  }

  function confirmExtraction() {
    if (!extraction || !signalId) return;
    startTransition(async () => {
      const res = await confirmAnalysisAction({
        signal_id: signalId,
        workspace_id: workspaceId,
        confirmed_summary: extraction.summary,
        founder_notes: founderNotes,
        pain_points: extraction.pain_points,
        objections: extraction.objections,
        requests: extraction.requests,
        quotes: extraction.quotes,
        urgency: extraction.urgency,
        likely_segment: extraction.likely_segment,
        confidence: extraction.confidence,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSimilar(res.similar);
      setStep("confirmed");
      toast.success("Memory saved. Semantic recall indexed.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        {step === "ingest" && (
          <IngestCard
            title={title}
            onTitleChange={setTitle}
            sourceType={sourceType}
            onSourceChange={setSourceType}
            rawText={rawText}
            onRawChange={setRawText}
            pending={pending}
            onSubmit={runExtraction}
          />
        )}
        {step === "extracting" && <ExtractingCard />}
        {(step === "review" || step === "confirmed") && extraction && (
          <ReviewCard
            extraction={extraction}
            onChange={setExtraction}
            founderNotes={founderNotes}
            onNotesChange={setFounderNotes}
            pending={pending}
            confirmed={step === "confirmed"}
            onConfirm={confirmExtraction}
            onReset={reset}
          />
        )}
      </div>

      <aside className="lg:col-span-2">
        {step === "ingest" && <WhatHappensNext />}
        {step === "extracting" && <WhatHappensNext active={1} />}
        {step === "review" && <WhatHappensNext active={2} />}
        {step === "confirmed" && (
          <RecallPanel
            workspaceId={workspaceId}
            similar={similar}
            signalId={signalId}
          />
        )}
      </aside>
    </div>
  );
}

function IngestCard({
  title,
  onTitleChange,
  sourceType,
  onSourceChange,
  rawText,
  onRawChange,
  pending,
  onSubmit,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  sourceType: string;
  onSourceChange: (v: string) => void;
  rawText: string;
  onRawChange: (v: string) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">New signal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-xs text-muted-foreground">optional</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Call with Ayesha, UT Austin student"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source type</Label>
            <Select value={sourceType} onValueChange={(v) => onSourceChange(v ?? "")}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Pick a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Customer call</SelectItem>
                <SelectItem value="interview">User interview</SelectItem>
                <SelectItem value="notes">Raw notes</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="email">Email thread</SelectItem>
                <SelectItem value="dm">Slack / DM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="raw">Raw text</Label>
          <Textarea
            id="raw"
            rows={14}
            value={rawText}
            onChange={(e) => onRawChange(e.target.value)}
            placeholder="Paste the transcript, notes, or recap. Rough is fine — Dalil handles the structure."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {rawText.length} characters · extraction works best with 200+ characters of real customer language.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={onSubmit}
            disabled={pending || rawText.trim().length < 20}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Run AI extraction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExtractingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">
          Extracting with Claude…
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 rounded-md bg-secondary/60 p-3 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-teal-700" />
          Reading the signal, pulling pains, objections, and quotes into structured form.
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewCard({
  extraction,
  onChange,
  founderNotes,
  onNotesChange,
  pending,
  confirmed,
  onConfirm,
  onReset,
}: {
  extraction: Extraction;
  onChange: (next: Extraction) => void;
  founderNotes: string;
  onNotesChange: (v: string) => void;
  pending: boolean;
  confirmed: boolean;
  onConfirm: () => void;
  onReset: () => void;
}) {
  function patch<K extends keyof Extraction>(key: K, value: Extraction[K]) {
    onChange({ ...extraction, [key]: value });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 font-display text-lg">
          <span>AI understanding — review and confirm</span>
          {confirmed && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="summary">Confirmed summary</Label>
          <Textarea
            id="summary"
            value={extraction.summary}
            onChange={(e) => patch("summary", e.target.value)}
            rows={3}
            disabled={confirmed}
          />
          <p className="text-xs text-muted-foreground">
            This becomes the canonical memory. Edit anything the AI got wrong — your version wins.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Segment</Label>
            <Input
              value={extraction.likely_segment}
              onChange={(e) => patch("likely_segment", e.target.value)}
              disabled={confirmed}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={extraction.urgency}
                onValueChange={(v) =>
                  patch("urgency", (v ?? "medium") as Extraction["urgency"])
                }
                disabled={confirmed}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Confidence</Label>
              <Select
                value={extraction.confidence}
                onValueChange={(v) =>
                  patch("confidence", (v ?? "medium") as Extraction["confidence"])
                }
                disabled={confirmed}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TagInput
          label="Pain points"
          values={extraction.pain_points}
          onChange={(v) => patch("pain_points", v)}
          placeholder="Add a pain point"
        />
        <TagInput
          label="Objections"
          values={extraction.objections}
          onChange={(v) => patch("objections", v)}
          placeholder="Add an objection"
          tone="warning"
        />
        <TagInput
          label="Requests"
          values={extraction.requests}
          onChange={(v) => patch("requests", v)}
          placeholder="Add a request"
          tone="success"
        />
        <TagInput
          label="Quotes"
          values={extraction.quotes}
          onChange={(v) => patch("quotes", v)}
          placeholder='Paste an exact quote'
        />

        <div className="space-y-2">
          <Label htmlFor="notes">Founder notes (optional)</Label>
          <Textarea
            id="notes"
            rows={2}
            value={founderNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Anything the AI missed, nuance worth remembering, next step…"
            disabled={confirmed}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>
          {confirmed ? (
            <span className="flex items-center gap-1.5 text-sm text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
              Memory confirmed and indexed.
            </span>
          ) : (
            <Button
              onClick={onConfirm}
              disabled={pending}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm & save memory
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WhatHappensNext({ active = 0 }: { active?: number }) {
  const steps = [
    {
      title: "AI extracts structure",
      body: "Pain points, objections, requests, urgency, likely segment, quotes.",
    },
    {
      title: "You review and correct",
      body: "Edit anything the AI got wrong. Your version is the source of truth.",
    },
    {
      title: "Saved as canonical memory",
      body: "Embeddings get generated so future similar issues can surface this one.",
    },
    {
      title: "Recall surfaces past context",
      body: "Dalil checks: have we seen this before? What did we decide last time?",
    },
  ];
  return (
    <Card className="border-dashed bg-secondary/40">
      <CardHeader>
        <CardTitle className="font-display text-lg">What happens next</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <span
              className={
                i <= active
                  ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white"
                  : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
              }
            >
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecallPanel({
  workspaceId,
  similar,
  signalId,
}: {
  workspaceId: string;
  similar: Similar[];
  signalId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Telescope className="h-4 w-4 text-teal-700" />
          Similar past memories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {similar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This is the first memory of its kind in the workspace. Future signals will be able to recall this one.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              We&apos;ve seen something like this before. Click any memory to revisit the original signal and its linked decisions.
            </p>
            <div className="space-y-2">
              {similar.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-border p-3 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug">
                      <Quote className="mr-1 inline h-3 w-3 text-teal-500" />
                      {s.confirmed_summary ?? "(memory pending confirmation)"}
                    </p>
                    <Badge variant="outline" className="shrink-0 font-mono">
                      {(s.similarity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Button asChild className="gap-1.5">
            <Link
              href={`/w/${workspaceId}/decisions/new${
                signalId ? `?signal=${signalId}` : ""
              }`}
            >
              Log a decision from this
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/w/${workspaceId}/capture`}>Capture another signal</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
