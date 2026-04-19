"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  signInAction,
  signInAsDemoAction,
  sendMagicLinkAction,
} from "@/app/actions/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth/constants";

export function LoginForm({
  initialError,
  next,
}: {
  initialError?: string;
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [demoPending, startDemo] = useTransition();
  const [magicPending, startMagic] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signInAction({ email, password });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Signed in.");
      router.push(next && next.startsWith("/") ? next : "/workspaces");
      router.refresh();
    });
  }

  function signInAsDemo() {
    setError(null);
    startDemo(async () => {
      const res = await signInAsDemoAction();
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Signed in as demo user.");
      router.push(next && next.startsWith("/") ? next : "/workspaces");
      router.refresh();
    });
  }

  function sendMagicLink() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email to receive a magic link.");
      toast.error("Enter your email first.");
      return;
    }
    startMagic(async () => {
      const res = await sendMagicLinkAction({
        email: trimmed,
        nextPath: next,
      });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setMagicSentTo(trimmed);
      toast.success(`Magic link sent to ${trimmed}.`);
    });
  }

  const disabled = pending || demoPending || magicPending;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@company.com"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={disabled}
          />
        </div>
        <Button type="submit" className="w-full gap-1.5" disabled={disabled}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign in
        </Button>
      </form>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" aria-hidden />
        <span className="relative bg-card px-3">or</span>
      </div>

      {magicSentTo ? (
        <div className="flex items-start gap-2 rounded-md border border-teal-300/60 bg-teal-50/60 p-3 text-xs text-ink-950 dark:border-teal-700/60 dark:bg-teal-950/40 dark:text-ink-50">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
          <span>
            Magic link sent to <strong className="font-medium">{magicSentTo}</strong>.
            Open it from the same browser to finish signing in.
          </span>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={disabled}
          onClick={sendMagicLink}
        >
          {magicPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send me a magic link
        </Button>
      )}

      <div className="rounded-lg border border-dashed border-teal-300/70 bg-teal-50/60 p-3 text-xs dark:border-teal-700/60 dark:bg-teal-950/40">
        <p className="mb-2 flex items-center gap-1.5 font-medium text-ink-950 dark:text-ink-50">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          For judges / rapid testing
        </p>
        <p className="mb-2 text-muted-foreground">
          One-click into a pre-populated demo account, no signup required.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full gap-1.5 bg-card"
          disabled={disabled}
          onClick={signInAsDemo}
        >
          {demoPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Continue as demo user
        </Button>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          {DEMO_EMAIL} · {DEMO_PASSWORD}
        </p>
      </div>
    </div>
  );
}

