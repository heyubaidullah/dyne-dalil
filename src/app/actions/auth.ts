"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  type AuthResult,
} from "@/lib/auth/constants";

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signUpAction(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name?.trim() || undefined;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || undefined;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: appUrl ? `${appUrl}/auth/callback` : undefined,
    },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * One-click demo sign-in. Tries to sign in as the preset demo user; if the
 * user doesn't exist yet (first run), signs them up, then signs in.
 * Mirrors the `demo@dalil.app` / `dalildemo2026` creds below so testers
 * can also type them manually if they prefer.
 */
export async function signInAsDemoAction(): Promise<AuthResult> {
  const supabase = await createClient();

  const first = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (!first.error) {
    revalidatePath("/", "layout");
    return { ok: true };
  }

  // Credentials probably didn't exist yet — create the demo user, then retry.
  if (first.error.message.toLowerCase().includes("invalid login credentials")) {
    const signUp = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      options: { data: { name: "Founder Demo" } },
    });
    if (signUp.error) {
      return { ok: false, error: signUp.error.message };
    }
    const retry = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (retry.error) {
      return { ok: false, error: retry.error.message };
    }
    revalidatePath("/", "layout");
    return { ok: true };
  }

  return { ok: false, error: first.error.message };
}

export async function signInWithGoogleAction(
  nextPath?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const callback = `${appUrl.replace(/\/$/, "")}/auth/callback${
    nextPath && nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : ""
  }`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      error:
        error?.message ??
        "Could not start Google sign-in. Enable the Google provider in Supabase Auth settings.",
    };
  }
  return { ok: true, url: data.url };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
