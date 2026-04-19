import { createClient } from "@/lib/supabase/server";
import { TopNav, type NavUser } from "./top-nav";
import { Footer } from "./footer";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navUser: NavUser | null = user
    ? {
        email: user.email ?? "",
        name:
          (user.user_metadata as { name?: string } | null)?.name ??
          user.email?.split("@")[0] ??
          null,
        avatarUrl:
          (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ??
          null,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={navUser} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
