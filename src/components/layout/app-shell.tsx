import { TopNav } from "./top-nav";
import { Footer } from "./footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
