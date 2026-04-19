import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth cookie on every request and gates access to
 * the workspace surfaces. Safe to call from middleware.
 *
 * Public (no auth required):
 *   /, /login, /signup, /auth/*, /api/auth/*, Next.js internals, static assets.
 * Everything else requires a session; unauthenticated hits get 302'd to /login
 * with a ?next= param so we can return users to their target after sign-in.
 */
const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/login",
  "/signup",
]);

const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/_next/",
  "/favicon",
  "/apple-icon",
  "/icon",
];

function isPublic(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // If there's no session and the route is protected, kick to /login.
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // If the user is already signed in and hits /login or /signup, send them in.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") ? next : "/workspaces";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
