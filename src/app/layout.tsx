import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dalil — Evidence for every next move.",
    template: "%s · Dalil",
  },
  description:
    "Dalil is an AI-native founder memory and decision system. Capture customer signals, reconcile understanding, recall similar issues, and log decisions with outcomes.",
  applicationName: "Dalil",
  keywords: [
    "Dalil",
    "founder memory",
    "customer signals",
    "decision ledger",
    "product discovery",
    "hack.msa",
  ],
  openGraph: {
    title: "Dalil — Evidence for every next move.",
    description:
      "AI-native founder memory: capture signals, reconcile understanding, recall what worked, decide with evidence.",
    url: "https://dalil.app",
    siteName: "Dalil",
    type: "website",
    images: [
      {
        url: "/dalil-logo.webp",
        width: 1024,
        height: 1024,
        alt: "Dalil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dalil — Evidence for every next move.",
    description:
      "AI-native founder memory: capture signals, decide with evidence.",
    images: ["/dalil-logo.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFBFD" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1320" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        inter.variable,
        sora.variable,
        jetbrains.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
