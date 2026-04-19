import Link from "next/link";
import { Logo } from "./logo";

const MENU_LINKS = [
  { href: "/workspaces", label: "Dashboards" },
  { href: "/memory", label: "Memory Library" },
  { href: "/timeline", label: "Timeline" },
  { href: "/integrations", label: "Integrations" },
  { href: "/ideas", label: "Idea Vault" },
  { href: "/settings", label: "Settings" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Logo variant="mark" size={28} />
              <span className="font-display text-base font-semibold text-ink-950 dark:text-ink-50">
                Dalil
              </span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              AI-native GTM memory for products, teams and companies.
              Capture feedback, surface recurring themes, and log
              evidence-backed decisions.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Menu
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {MENU_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-700 transition-colors hover:text-teal-700 dark:text-ink-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contact
              </p>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <a
                    href="mailto:hello@dynelabs.co"
                    className="text-ink-700 transition-colors hover:text-teal-700 dark:text-ink-200"
                  >
                    dalil@dynelabs.org
                  </a>
                </li>
                <li>
                  <a
                    href="https://dynelabs.org"
                    className="text-ink-700 transition-colors hover:text-teal-700 dark:text-ink-200"
                  >
                    www.dynelabs.org
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Spread the word
              </p>
              <a
                href="https://twitter.com/intent/tweet?text=Check%20out%20Dyne%20Labs%20%E2%80%94%20%40dynelabs"
                className="text-sm text-ink-700 transition-colors hover:text-teal-700 dark:text-ink-200"
                target="_blank"
                rel="noreferrer"
              >
                Share Dalil with others →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Dalil — Developed by Sakib, Sakib &amp; Ubaid at <a
            href="https://dynelabs.org"
              className="text-ink-700 transition-colors hover:text-teal-700 dark:text-ink-200"
              >Dyne Labs
            </a> ©{" "}
            {year}
          </p>
          <p className="opacity-80">
            Built for hack.msa 2026 · Go To Market track
          </p>
        </div>
      </div>
    </footer>
  );
}
