import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckoutButton } from "@/components/settings/checkout-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Binoculars,
  Bell,
  Shield,
  Database,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Download,
  Trash2,
  ArrowUpRight,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <PageStub
      eyebrow="Settings"
      title="Workspace defaults and AI preferences."
      description="Tune how extraction, recall, and rollups behave across every workspace. Changes apply to new captures — historical memories keep whatever pipeline produced them."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Dialog>
          <DialogTrigger className="group lg:col-span-3 rounded-xl border border-teal-900/20 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-5 text-left text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium tracking-wide">
                <Zap className="h-3.5 w-3.5" />
                Upgrade
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90">
                Unlock billing
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Upgrade to Dalil Pro
            </h2>
            <p className="mt-1 text-sm text-white/85 sm:text-base">
              Turn on hosted Stripe checkout to start accepting payments with a
              smooth, secure billing flow.
            </p>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade to Dalil Pro</DialogTitle>
              <DialogDescription>
                Continue to Stripe Checkout to activate billing. Your payment is
                processed on Stripe-hosted pages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* <p className="text-xs text-muted-foreground">
                Configure <code className="font-mono">STRIPE_SECRET_KEY</code>,{" "}
                <code className="font-mono">STRIPE_PRICE_ID</code>, and{" "}
                <code className="font-mono">STRIPE_WEBHOOK_SECRET</code> to go
                live.
              </p> */}
              <CheckoutButton />
            </div>
          </DialogContent>
        </Dialog>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Brain className="h-4 w-4 text-teal-700" />
                  AI pipeline
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shared across Capture, Rollup, Idea Extract, and Similar-Issue
                  Recall.
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 font-normal">
                Claude Sonnet 4.6 primary
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Extraction provider</Label>
                <Select defaultValue="claude">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Anthropic Claude</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="local">Local (llama.cpp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Extraction model</Label>
                <Select defaultValue="claude-sonnet-4-6">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-6">
                      claude-sonnet-4-6 (default)
                    </SelectItem>
                    <SelectItem value="claude-haiku-4-5-20251001">
                      claude-haiku-4-5 (fast)
                    </SelectItem>
                    <SelectItem value="claude-opus-4-7">
                      claude-opus-4-7 (deep)
                    </SelectItem>
                    <SelectItem value="gpt-4.1-mini">gpt-4.1-mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rollup model</Label>
                <Select defaultValue="claude-sonnet-4-6">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-6">
                      claude-sonnet-4-6
                    </SelectItem>
                    <SelectItem value="claude-haiku-4-5-20251001">
                      claude-haiku-4-5
                    </SelectItem>
                    <SelectItem value="gpt-4.1-mini">gpt-4.1-mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default temperature</Label>
                <Input defaultValue="0.20" inputMode="decimal" />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Similar-issue recall</Label>
                <Input
                  defaultValue="Claude ranker"
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  Anthropic has no embeddings API. Recall runs through Claude
                  at query time — no vector DB required.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Fallback provider</Label>
                <Select defaultValue="openai">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (if set)</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-700" />
                <span>Structured output enforcement</span>
              </div>
              <Badge variant="default">Always on</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Binoculars className="h-4 w-4 text-teal-700" />
              Similar-Issue Recall
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Match count</Label>
              <Input defaultValue="5" inputMode="numeric" />
              <p className="text-xs text-muted-foreground">
                How many past memories to surface per new signal.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum similarity</Label>
              <Input defaultValue="0.72" inputMode="decimal" />
              <p className="text-xs text-muted-foreground">
                Cosine similarity floor. Raise to cut noise.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Auto-recall on confirm</Label>
              <Select defaultValue="yes">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — run after save</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Sparkles className="h-4 w-4 text-teal-700" />
              Workspace defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default source type</Label>
              <Select defaultValue="call">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Customer call</SelectItem>
                  <SelectItem value="interview">User interview</SelectItem>
                  <SelectItem value="notes">Raw notes</SelectItem>
                  <SelectItem value="transcript">Transcript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Confidence threshold for auto-confirm</Label>
              <Select defaultValue="never">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">
                    Never — always review
                  </SelectItem>
                  <SelectItem value="high">Only when confidence=high</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dalil defaults to founder review. Consensus Capture is the
                wedge — don&apos;t skip it lightly.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Bell className="h-4 w-4 text-teal-700" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotifRow
              label="Weekly workspace rollup"
              hint="Monday 9am in your time zone."
              defaultValue="email"
            />
            <NotifRow
              label="Outcome reminders"
              hint="When a decision has been pending for 14+ days."
              defaultValue="inbox"
            />
            <NotifRow
              label="Stage-zero idea follow-up"
              hint="Nudge when an Idea Vault entry hasn't moved in 30 days."
              defaultValue="off"
            />
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <KeyRound className="h-4 w-4 text-teal-700" />
              API & keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <KeyRow label="Anthropic" masked="sk-ant-••••••jQ2jAAA" status="healthy" />
            <KeyRow label="OpenAI" masked="sk-proj-••••••iBdh SIA" status="optional" />
            <KeyRow label="Gemini" masked="not configured" status="optional" />
            <KeyRow
              label="Supabase service role"
              masked="eyJ••••••ek"
              status="healthy"
            />
            <p className="pt-1 text-xs text-muted-foreground">
              Keys live in <code className="font-mono">.env</code>. The
              settings page just reflects what&apos;s connected.
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Shield className="h-4 w-4 text-teal-700" />
              Privacy & access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace visibility</Label>
              <Select defaultValue="private">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private to my account</SelectItem>
                  <SelectItem value="invite">Invite teammates by email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Retention</Label>
              <Select defaultValue="unlimited">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Keep forever</SelectItem>
                  <SelectItem value="365">Delete after 12 months</SelectItem>
                  <SelectItem value="180">Delete after 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Database className="h-4 w-4 text-teal-700" />
              Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Export everything as JSON
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4" />
              Delete account & all memories
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageStub>
  );
}

function NotifRow({
  label,
  hint,
  defaultValue,
}: {
  label: string;
  hint: string;
  defaultValue: "email" | "inbox" | "off";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Select defaultValue={defaultValue}>
        <SelectTrigger className="h-8 w-28 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="inbox">In-app only</SelectItem>
          <SelectItem value="off">Off</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function KeyRow({
  label,
  masked,
  status,
}: {
  label: string;
  masked: string;
  status: "healthy" | "optional" | "missing";
}) {
  const variant =
    status === "healthy"
      ? "default"
      : status === "optional"
        ? "secondary"
        : "outline";
  const statusLabel =
    status === "healthy"
      ? "Connected"
      : status === "optional"
        ? "Optional"
        : "Missing";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {masked}
        </p>
      </div>
      <Badge variant={variant} className="shrink-0">
        {statusLabel}
      </Badge>
    </div>
  );
}
