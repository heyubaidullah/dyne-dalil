"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  User,
  LogOut,
  LogIn,
  Plus,
  Menu,
  Bookmark,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export type NavUser = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

const NAV_LINKS = [
  { href: "/workspaces", label: "Dashboards" },
  { href: "/memory", label: "Memory Library" },
  { href: "/timeline", label: "Timeline" },
  { href: "/integrations", label: "Integrations" },
];

export function TopNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  function cycleTheme() {
    // light -> dark -> system -> light
    const current = theme ?? "system";
    if (current === "light") setTheme("dark");
    else if (current === "dark") setTheme("system");
    else setTheme("light");
  }

  const themeIcon = !mounted ? (
    <Monitor className="mr-2 h-4 w-4" />
  ) : theme === "system" ? (
    <Monitor className="mr-2 h-4 w-4" />
  ) : resolvedTheme === "dark" ? (
    <Moon className="mr-2 h-4 w-4" />
  ) : (
    <Sun className="mr-2 h-4 w-4" />
  );

  const themeLabel = !mounted
    ? "Theme"
    : theme === "system"
      ? "Theme · System"
      : resolvedTheme === "dark"
        ? "Dark mode · on"
        : "Dark mode · off";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            aria-label="Dalil home"
            className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo variant="adaptive" size={32} priority />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-secondary text-ink-950 dark:text-ink-50"
                    : "text-muted-foreground hover:bg-secondary hover:text-ink-950 dark:hover:text-ink-50",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/ideas">Idea Vault</Link>
          </Button>
          <Button asChild size="sm" className="hidden gap-1.5 sm:inline-flex">
            <Link href="/onboarding">
              <Plus className="h-4 w-4" />
              New Dashboard
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,90vw)] p-0">
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle className="flex items-center gap-2 font-display text-base">
                  <Logo variant="mark" size={24} />
                  Navigate
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-secondary text-ink-950 dark:text-ink-50"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="space-y-2 border-t border-border p-4">
                <Button asChild className="w-full gap-1.5">
                  <Link
                    href="/onboarding"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    New Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full gap-1.5">
                  <Link href="/ideas" onClick={() => setMobileOpen(false)}>
                    <Bookmark className="h-4 w-4" />
                    Idea Vault
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-1 flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-teal-700 text-xs text-white dark:bg-teal-600">
                    {initialsOf(user)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">
                    {user.name ?? user.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      // Keep the menu open while we flip the theme, so the
                      // user can see the change without reopening.
                      e.preventDefault();
                      cycleTheme();
                    }}
                  >
                    {themeIcon}
                    {themeLabel}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={signingOut}
                  onClick={async (e) => {
                    e.preventDefault();
                    setSigningOut(true);
                    try {
                      await signOutAction();
                    } catch {
                      setSigningOut(false);
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="ml-1 gap-1.5">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function initialsOf(user: NavUser): string {
  const source = user.name?.trim() || user.email;
  if (!source) return "D";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
