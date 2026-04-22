# Dalil

> **Evidence for every next move.**

Dalil is an AI-native founder workspace that turns scattered customer conversations into a trusted, searchable memory — and connects that memory directly to decisions and outcomes over time.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

---

## What is Dalil?

Founders and early operators constantly learn from customers — but that learning gets fragmented across notes, transcripts, DMs, and memory. Dalil solves this by giving teams one place to capture signals, confirm AI understanding, recall similar past situations, and log decisions with evidence.

**Three core capabilities:**

| Capability | What it does |
|---|---|
| **Consensus Capture** | AI extracts structure from raw notes or transcripts. The founder reviews, corrects, and confirms the final version as canonical memory. |
| **Similar-Issue Recall** | When a new signal arrives, Dalil surfaces semantically similar past memories and the decisions that followed, so history informs the next move. |
| **Decision Timeline** | Every decision is linked to evidence, an expected outcome, and a real outcome — creating a visible chronology of learning over time. |

---

## Screenshots

> Add screenshots here once you have a live deployment URL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 · App Router · Turbopack · TypeScript |
| Styling | Tailwind CSS v4 · shadcn/ui on Base UI |
| Database | Supabase Postgres + pgvector (semantic recall) |
| AI | Google Gemini 2.5 Flash (extraction & rollup) · text-embedding-004 (vectors) |
| Additional AI | OpenAI GPT-4.1 Mini · Anthropic Claude 3.5 Haiku (optional) |
| Payments | Stripe Checkout + Webhook |
| Auth | Supabase Auth with SSR cookie refresh |
| Deployment | Replit Autoscale (or any Node.js host) |

---

## Features

- **Stage-Zero Chat** — guided LLM conversation for founders still figuring out what to build; saves validated ideas to an Idea Vault
- **Signal Ingest** — paste notes, transcripts, or upload text; AI extracts pain points, objections, segment clues, urgency, and quotes
- **Consensus Capture** — compare AI understanding against your own; save the confirmed version as the canonical memory
- **Semantic Recall** — vector-similarity search surfaces related past signals and decisions when a new issue comes in
- **Decision Ledger** — log decisions, attach evidence signals, set expected outcomes
- **Timeline** — chronological view of signals → decisions → outcomes
- **Workspace Dashboard** — recurring themes, strongest objections, top segment, and suggested next tests rolled up by AI
- **Idea Vault** — save and revisit validated stage-zero ideas; convert to workspaces
- **Integrations page** — forward-looking connector surface (Gong, Zoom, Notion, Slack, Linear)
- **Settings & Billing** — profile, workspace preferences, Stripe-powered subscription

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the `pgvector` extension enabled
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)
- Optional: OpenAI, Anthropic, and Stripe keys for full feature coverage

### 1. Clone and install

```bash
git clone https://github.com/heyubaidullah/dyne-dalil.git
cd dyne-dalil
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values. See the [Environment Variables](#environment-variables) section below for details on each key.

### 3. Set up the database

**Option A — Supabase dashboard (quickest):**

1. Dashboard → **Database → Extensions** → search `vector` → enable.
2. Dashboard → **SQL Editor** → paste the full contents of `supabase/migrations/20260418140000_init.sql` → **Run**.
3. New query → paste `supabase/seed.sql` → **Run** (loads demo data).

**Option B — Supabase CLI:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
psql "$POOLER_URI" -f supabase/seed.sql
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and populate the following. Never commit `.env.local`.

### Required

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` key |

### AI Providers

| Variable | Purpose | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | Extraction, rollup, embeddings (primary AI engine) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | Streaming chat, idea extraction, embeddings | [platform.openai.com](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Optional Claude extraction path | [console.anthropic.com](https://console.anthropic.com) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side embedding writes | Supabase Dashboard → Project Settings → API → `service_role` key |

### Stripe (Payments)

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls |
| `STRIPE_PRICE_ID` | The recurring or one-time Price ID for the subscription |
| `STRIPE_WEBHOOK_SECRET` | Validates webhook signatures from Stripe CLI or production |

**To enable Stripe locally:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret shown by the CLI into `STRIPE_WEBHOOK_SECRET`.

### App

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your production URL |

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero chat, stats, how-it-works, recent memory |
| `/start` | Dalil Start — stage-zero guided conversation |
| `/workspaces` | Workspace list |
| `/workspaces/new` | Create a workspace |
| `/w/[id]` | Workspace dashboard — rollups, themes, next tests |
| `/w/[id]/capture` | Ingest a signal and confirm the AI extraction |
| `/w/[id]/memory` | Memory library with filters and quote snippets |
| `/w/[id]/decisions` | Decision ledger with evidence links |
| `/w/[id]/timeline` | Chronology of signals → decisions → outcomes |
| `/ideas` | Idea Vault — approved stage-zero ideas |
| `/integrations` | Connector surface (Gong, Zoom, Notion, Slack, Linear…) |
| `/settings` | Workspace and account preferences |
| `/settings/billing/success` | Post-checkout success page |
| `/settings/billing/cancel` | Post-checkout cancellation page |

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/stripe/checkout` | POST | Creates a Stripe Checkout Session |
| `/api/stripe/webhook` | POST | Verifies Stripe signatures and handles payment events |
| `/api/capture/extract` | POST | Runs AI extraction on a raw signal |
| `/api/workspace/[id]` | GET/PATCH | Workspace read and update |
| `/api/stage-zero-chat` | POST | Stage-zero guided conversation stream |
| `/api/idea-extract` | POST | Extracts a validated idea from a chat transcript |
| `/api/admin` | POST | Admin utilities |

---

## Project Structure

```
src/
├── app/                    Next.js App Router pages and API routes
│   ├── api/                Server-side API handlers
│   ├── w/[id]/             Per-workspace pages (capture, memory, decisions, timeline)
│   ├── workspaces/         Workspace list and creation
│   ├── ideas/              Idea Vault
│   ├── integrations/       Connector surface
│   └── settings/           Profile, preferences, billing
├── components/
│   ├── layout/             AppShell, TopNav, Logo
│   ├── home/               HeroChat
│   └── ui/                 shadcn/ui primitives
└── lib/
    ├── env.ts              Zod-validated, lazy env accessor
    ├── supabase/           Browser client, server client, types
    ├── ai/                 Gemini client, extract, rollup, embed helpers
    └── queries/            Data access — workspaces, signals, decisions, timeline, ideas
supabase/
├── migrations/             SQL schema (pgvector, RLS, match_* RPCs)
├── seed.sql                Demo seed data
└── config.toml
```

---

## Deployment

### Replit (recommended)

The project is pre-configured for Replit Autoscale.

- **Build command:** `npm run build`
- **Run command:** `npm start`

Replit automatically handles TLS, health checks, and scaling. Add all variables from `.env.example` as Replit Secrets before deploying.

### Any Node.js host (Vercel, Render, Railway, Fly.io…)

1. Set all environment variables from `.env.example` in your host's dashboard.
2. Build: `npm run build`
3. Start: `npm start` (or `next start -p $PORT -H 0.0.0.0`)

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`.
2. Make your changes, following the existing code style (TypeScript strict, Tailwind utilities, no inline styles).
3. Open a pull request with a clear description of the change and why it was made.
4. All PRs require at least one review before merging to `main`.

---

## License

Private. All rights reserved. © Dalil contributors.
