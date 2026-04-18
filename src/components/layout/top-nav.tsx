"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Settings,
  User,
  LogOut,
  Plus,
  Menu,
  Bookmark,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/workspaces", label: "Workspaces" },
  { href: "/memory", label: "Memory" },
  { href: "/timeline", label: "Timeline" },
  { href: "/integrations", label: "Integrations" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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
            <Link href="/workspaces/new">
              <Plus className="h-4 w-4" />
              New workspace
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
                    href="/workspaces/new"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    New workspace
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

          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-1 flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-teal-700 text-xs text-white">
                  FD
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">Founder Demo</p>
                  <p className="text-xs text-muted-foreground">
                    founder@dalil.app
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <Link href="/settings/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                }
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
