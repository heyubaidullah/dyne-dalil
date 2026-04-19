import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static, _next/image, favicon, robots, sitemap
     * - image files (svg/png/jpg/jpeg/gif/webp/avif)
     * The Supabase auth cookie is still refreshed even on the public
     * landing page, which is what we want.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)).*)",
  ],
};
