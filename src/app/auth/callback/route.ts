import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link callback. Supabase redirects back here with a `code`
 * query param after a successful provider handshake; we exchange it for a
 * session cookie, then bounce to ?next= (or /workspaces by default).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/workspaces";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next.startsWith("/") ? next : "/workspaces";
      return NextResponse.redirect(`${origin}${destination}`);
    }
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL("/login?error=Missing+auth+code", origin));
}
