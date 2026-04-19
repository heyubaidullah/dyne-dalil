"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
 * One-click demo sign-in. Works even when Supabase has "Confirm email" on:
 * we use the service role to admin-create the user with email_confirm=true
 * (skipping the confirmation mail entirely), then sign in normally.
 *
 * The flow:
 *   1. Try to sign in as demo user with the user-level client.
 *   2. If that fails, use the service-role admin API to either CREATE the
 *      user (email_confirm=true) or force-confirm an existing unconfirmed
 *      user, then retry the sign-in.
 */
export async function signInAsDemoAction(): Promise<AuthResult> {
  const supabase = await createClient();

  // Fast path: demo user already exists + is confirmed.
  const first = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (!first.error) {
    revalidatePath("/", "layout");
    return { ok: true };
  }

  // Slow path: provision (or fix) the demo user via the service role.
  const admin = createServiceClient();

  // Find the user; the admin listUsers endpoint doesn't support filtering,
  // so we page through a small window. For the demo user this is always
  // either "not found" or in the first page.
  let demoUserId: string | null = null;
  try {
    const list = await admin.auth.admin.listUsers({ perPage: 200 });
    const match = list.data?.users?.find(
      (u) => u.email?.toLowerCase() === DEMO_EMAIL,
    );
    if (match) demoUserId = match.id;
  } catch (e) {
    return {
      ok: false,
      error:
        "Could not reach Supabase admin API. Is SUPABASE_SERVICE_ROLE_KEY set? " +
        (e instanceof Error ? e.message : String(e)),
    };
  }

  if (!demoUserId) {
    // First-run: create the demo user pre-confirmed.
    const created = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Founder Demo", is_demo: true },
    });
    if (created.error || !created.data?.user) {
      return {
        ok: false,
        error:
          created.error?.message ??
          "Could not create the demo user via the admin API.",
      };
    }
    demoUserId = created.data.user.id;
  } else {
    // Existing demo user — force-confirm + reset password to the known
    // value so we never drift if Supabase ever rotates something.
    const updated = await admin.auth.admin.updateUserById(demoUserId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Founder Demo", is_demo: true },
    });
    if (updated.error) {
      return {
        ok: false,
        error: `Could not update demo user: ${updated.error.message}`,
      };
    }
  }

  const retry = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (retry.error) {
    return {
      ok: false,
      error: `Demo sign-in failed after provisioning: ${retry.error.message}`,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Send a one-click magic link to the given email. No passwords, no third-party
 * provider config. Supabase emails a tokenized link that bounces back through
 * /auth/callback and creates a session.
 */
export async function sendMagicLinkAction(input: {
  email: string;
  nextPath?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: "Enter the email you want to sign in with." };
  }

  const supabase = await createClient();
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const nextPath = input.nextPath;
  const callback = `${appUrl.replace(/\/$/, "")}/auth/callback${
    nextPath && nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : ""
  }`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callback,
      shouldCreateUser: true,
    },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
