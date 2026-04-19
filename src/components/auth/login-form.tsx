"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Loader2,
  LogIn,
  Sparkles,
} from "lucide-react";
import {
  signInAction,
  signInAsDemoAction,
  signInWithGoogleAction,
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
  const [pending, startTransition] = useTransition();
  const [demoPending, startDemo] = useTransition();
  const [googlePending, startGoogle] = useTransition();

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

  function signInWithGoogle() {
    setError(null);
    startGoogle(async () => {
      const res = await signInWithGoogleAction(next);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      window.location.href = res.url;
    });
  }

  const disabled = pending || demoPending || googlePending;

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

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={disabled}
        onClick={signInWithGoogle}
      >
        {googlePending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="h-4 w-4" />
        )}
        Continue with Google
      </Button>

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

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...props}>
      <path
        fill="#EA4335"
        d="M12 11v3.2h5.4c-.2 1.3-1.7 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.7 2.5 2.5 6.7 2.5 12S6.7 21.5 12 21.5c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.2H12z"
      />
    </svg>
  );
}
