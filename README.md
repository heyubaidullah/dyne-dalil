# Dalil

> **Evidence for every next move.**

Final team plan for a full-stack AI-native founder memory and decision system
designed for a 24-hour build, a polished demo, and a strong shot at winning
on creativity, implementation, presentation, and learning.

## Product definition

Dalil is an AI-native founder workspace that captures customer signals,
reconciles AI and founder understanding into a trusted memory, recalls
similar issues from the past, and tracks decisions and outcomes over time.
It also includes a stage-zero assistant on the home page for builders who
are still figuring out what to build.

**Track fit.** A clean fit for Go To Market: a 0-to-1 product for founders,
PMs, marketers, and early GTM teams.

**Core wedge.** Consensus Capture + Similar-Issue Recall + Decision Timeline.

**Demo promise.** Show messy customer notes becoming usable evidence,
decisions, and a visible timeline of learning.

Version: team lock document · Product name: Dalil · Tagline: Evidence for every next move.

---

## 1. Executive summary

**What Dalil is.** A premium full-stack SaaS-style product that helps
founders and early operators stop losing what the market already told them.

**What makes Dalil different.** Instead of being only a note summarizer or
lightweight CRM, it combines trusted memory capture, semantic recall of
similar historical issues, and a timeline of decisions and outcomes.

**What we are actually building in 24 hours.** One crisp workflow that
starts with messy customer input and ends with a structured memory,
connected decision, and next-step insight.

> **Non-negotiable principle.** We are not trying to build every integration
> or every workflow. We are building one sharp, unforgettable before-and-after
> transformation and making it look like a top-tier SaaS product.

---

## 2. Problem, target audience, and why this matters

Early founders, PMs, marketers, and salespeople constantly speak to
customers, prospects, pilot users, and stakeholders. But the real learning
from those conversations gets fragmented across notes, call recaps, docs,
screenshots, DMs, and memory. That fragmentation causes expensive mistakes.

- Teams forget what customers actually said.
- They overreact to one loud prospect or one flashy request.
- They repeat the same pricing, messaging, or audience mistake again later.
- They cannot easily trace which decision was made from which evidence.
- They struggle to see whether the market is becoming clearer over time or
  just noisier.

**Primary users.** Startup founders, solo founders, pre-seed and seed CEOs,
founder-led sales teams, PMs, PMMs, early GTM hires, and anyone wearing
multiple hats during the 0-to-1 stage.

**Job to be done.** Help the team understand what the market is saying,
what they decided because of it, whether that decision worked, and what
they should test next.

---

## 3. Final product thesis and feature wedge

**One-line product statement.** Dalil is an AI-native founder memory and
guidance system that captures customer conversations, reconciles AI and
human understanding into a trusted source of truth, recalls similar issues
from the past, and turns that learning into better decisions.

Dalil stands on three product pillars that define the MVP and the story we
tell judges.

### 1. Consensus Capture
AI produces its understanding of a customer conversation. The founder can
correct, edit, and confirm it. The final version becomes the canonical
memory, not just a raw AI summary.

### 2. Similar-Issue Recall
When a new issue arrives, Dalil surfaces semantically similar past signals
and the decisions that followed them, so the team can see what happened
last time before making the next move.

### 3. Decision Timeline
Every major change becomes visible in time order: signal, decision,
expected outcome, real outcome, and what to test next. This makes learning
accumulative instead of chaotic.

**What Dalil is not.** Not a generic CRM, not a raw meeting transcription
app, not only a customer-research repository, and not a broad AI chatbot
with no structured memory model.

---

## 4. Stage-zero feature for builders at position 0

Dalil should not only help users who already have customer conversations.
It should also serve people who are still figuring out what to build. This
is crucial because the track is about taking products from 0 to 1, not
only from 0.5 to 1.

**Homepage hero interaction.** A prominent chat search bar sits at the top
of the home page with the prompt: "What do you want to do today?" This is
the doorway for stage-zero founders.

**How it works.** The user starts a guided LLM conversation inside Dalil.
The system helps them articulate an idea, narrow the audience, define the
pain point, pressure-test the value, and save the approved concept into an
Idea Vault. From there, the user can convert the approved idea into a
workspace.

- **Entry point.** Homepage chat bar.
- **Interaction pattern.** Open a dedicated page or modal, not an inline
  chat on the homepage.
- **Output.** Validated idea summary, audience, problem statement, and
  workspace creation action.
- **Storage.** Every approved idea gets saved so the user can revisit or
  convert it later.

Recommended feature name: **Dalil Start** or **Idea Vault**. Internally,
we call the workflow "Zero-to-One Chat."

---

## 5. Locked MVP scope for the hackathon

The MVP must solve one end-to-end workflow beautifully. Everything below is
locked so the team does not drift.

### Must build

- Workspace creation
- Signal ingest: paste notes / transcript / upload text
- AI extraction into structured fields
- Founder review and confirmation of AI understanding
- Semantic recall of similar past issues
- Decision Ledger with evidence links
- Timeline page
- Top-level dashboard rollup
- Homepage 0-to-1 chat entry point

### Should build

- Dark mode
- Search and filters
- Integrations page with mocked connectors
- Settings and profile shell
- Saved highlights / quotes
- Confidence and trend labels

### Stretch only

- Browser extension shell
- Live call capture simulation
- One mocked analytics connector
- Ask-your-memory assistant
- Voice note upload

> **Scope rule.** If a feature does not visibly improve the main
> before-and-after demo, it should not steal hours from the core workflow.

---

## 6. UI/UX plan for a premium SaaS feel

Dalil should look like a top-rated modern SaaS product on first glance. It
must feel calm, premium, actionable, and highly skimmable. The interface
should communicate clarity and confidence rather than clutter or novelty
for novelty's sake.

> **UI principle.** Every page should answer three questions fast: What
> matters right now? What can I do next? What changed since last time?

### Brand and theme

- **Positioning.** Premium founder OS.
- **Mood.** Calm, intelligent, evidence-based, trustworthy.
- **Tone.** Not salesy, not playful, not noisy.
- **Visual language.** Rounded cards, low-noise borders, subtle
  iconography, strong spacing.

### Typography and component feel

- **Headings.** Sora or Geist SemiBold.
- **Body / UI.** Inter Regular / Medium.
- **Monospace numbers or code.** JetBrains Mono.
- **Buttons.** Large, obvious, low-clutter, with one primary action per
  section.

### Design system

| Token | Hex | Usage |
|---|---|---|
| Primary Ink | `#0B1320` | Text, titles, high-contrast dark surfaces |
| Dalil Teal | `#0F766E` | Primary accent, CTA emphasis, selected tabs |
| Jade | `#14B8A6` | Highlights, charts, active status, success |
| Muted Gold | `#C9A13F` | Special highlights, brand warmth, premium accents |

### Page map and intended purpose

| Page | Purpose |
|---|---|
| **Home** | Hero, stage-zero chat bar, quick actions, core narrative, recent memories, CTA to create workspace. |
| **Workspace Dashboard** | Recurring themes, top objections, strongest segment, recent decisions, next tests. |
| **Capture** | Paste conversation notes or transcript, run AI analysis, compare AI understanding vs. founder understanding. |
| **Memory Library** | Canonical confirmed memories with tags, filters, quote snippets, and similar-issue relationships. |
| **Decision Ledger** | A structured list of decisions linked to evidence and expected outcomes. |
| **Timeline** | Visual chronology of signals, decisions, and outcomes over time. |
| **Integrations** | Beautiful future-facing page with mocked connectors and promised value. |
| **Idea Vault** | Saved approved ideas from the stage-zero chat flow. |

---

## 7. Homepage specification

The home page must feel complete, premium, and useful for both stage-zero
builders and active product teams. It is not just marketing; it is the
opening command center.

- **Top navigation.** Logo, Workspaces, Memory, Timeline, Integrations,
  Profile, Settings.
- **Hero headline.** A crisp statement around evidence and next moves.
- **Hero search / chat bar.** "What do you want to do today?"
- **Secondary CTAs.** Create workspace, Upload signal, Open Idea Vault.
- **Recent memory cards.** Quick snapshots of the latest themes or
  decisions.
- **Visual trust anchors.** Semantic recall, decisions logged, signals
  captured, outcomes tracked.

**Hero interaction details.** The "What do you want to do today?" bar
should open a dedicated chat page or large modal. Suggested starter prompts:

- "I want to validate a startup idea"
- "Help me turn customer notes into insight"
- "What patterns are showing up in my latest calls?"

---

## 8. Technical architecture and implementation plan

Dalil is a full-stack app. The architecture should be simple, reliable, and
fast to build. Avoid complexity that does not directly improve the demo.

### Frontend
Next.js + TypeScript + Tailwind + shadcn/ui. Desktop-first for the demo,
responsive enough for laptop and tablet viewing. Premium card-based app
shell, strong spacing, tabs, timeline components, and modal support.

### Backend
Next.js API routes or a lightweight FastAPI service for AI-heavy endpoints.
The key is speed and cleanliness: ingest, analyze, store, recall, and
timeline update should be explicit flows.

### Data and AI
Supabase Postgres for relational data. Store embeddings alongside signals
and decisions for semantic recall. Use Gemini, Claude, or OpenAI for
structured extraction and rollups.

### Architecture flow

```
Signal input
  → AI extraction
    → founder confirmation
      → canonical memory saved
        → embedding generated
          → semantic recall over past memories and decisions
            → workspace rollup and timeline update
```

### Recommended schema

- **Workspace.** `name`, `description`, `owner`, `created_at`.
- **Signal.** `workspace_id`, `raw_text`, `source_type`, `title`,
  `created_at`.
- **SignalAnalysis.** AI summary, founder notes, confirmed summary, pain
  points, objections, requests, urgency, likely segment, quotes, embedding.
- **Decision.** `workspace_id`, `title`, `category`, `rationale`,
  `expected_outcome`, `embedding`, `created_at`.
- **DecisionEvidence.** `decision_id`, `signal_id`, `snippet`.
- **Outcome.** `decision_id`, `status`, `notes`, `updated_at`.
- **Idea.** Chat transcript summary, approved idea, audience, problem
  statement, `convert_to_workspace` flag.

---

## 9. AI pipeline and semantic recall plan

The AI should not be freeform. Every important step uses structured outputs
and clear review points.

1. **Stage 1 — Extraction.** Convert raw notes or transcripts into JSON
   fields: summary, pain points, objections, requests, urgency, likely
   segment, quotes, confidence.
2. **Stage 2 — Consensus Capture.** Show the AI interpretation beside an
   editable founder understanding field. Save the final confirmed version
   as the canonical memory.
3. **Stage 3 — Embedding and recall.** Generate embeddings for each
   confirmed memory and each decision. For a new issue, embed the text and
   retrieve semantically similar past items.
4. **Stage 4 — Workspace rollup.** Aggregate multiple memories into
   recurring themes, strongest objections, most likely segment,
   contradictions, and suggested next tests.
5. **Stage 5 — Decision support.** When the user creates a decision,
   attach supporting evidence, possible counterevidence, and the expected
   outcome to monitor.
6. **Stage 6 — Timeline update.** Once an outcome is marked, refresh the
   chronology and update what the system suggests next.

> **Important implementation note.** We should use embeddings and semantic
> similarity, but not over-engineer the infrastructure. The goal is reliable
> recall, not a heavyweight architecture.

---

## 10. Team split and ownership

| Role | Owns |
|---|---|
| **Builder 1 — Frontend / product experience** | Landing page, dashboard, memory library, decision ledger UI, timeline visuals, and overall polish. |
| **Builder 2 — Backend / storage / APIs** | Schema, CRUD, save flows, workspace rollups, semantic recall plumbing, and integration of frontend with data. |
| **Builder 3 — AI / product logic** | Extraction prompts, structured schemas, founder-confirmation logic, rollup logic, and retrieval ranking. |
| **Assistant role (Claude Code)** | Product clarity, copy, UX wording, naming, architecture review, demo structure, and rapid debugging support. |

---

## 11. 24-hour build schedule

The goal is to be functionally demo-ready well before judging. Polish
happens after the core workflow is stable, not before.

| Phase | Deliverable |
|---|---|
| **Phase 0 — Lock** | Finalize name, tagline, stack, page map, ownership, prompt schemas, and the exact demo story. |
| **Phase 1 — Scaffold** | Set up repo, Supabase, base app shell, navbar, page routes, and schema. |
| **Phase 2 — Core capture** | Build signal ingest, extraction, confirmation, and save the canonical memory. |
| **Phase 3 — Recall and decisions** | Build semantic recall, decision creation, evidence links, and timeline objects. |
| **Phase 4 — Dashboard and polish** | Add rollups, top-level cards, timeline visuals, profile/settings shells, and integrations page. |
| **Phase 5 — Demo hardening** | Tighten copy, fix broken paths, clean outputs, seed believable data, rehearse the story. |
| **Phase 6 — Submission** | Devpost assets, screenshots, architecture summary, known limitations, learning section, and final rehearsal. |

---

## 12. Final demo story

> **Demo sentence to remember.** Dalil helps founders stop losing what the
> market already told them.

1. Start with the pain: customer learning is scattered and forgotten.
2. Open Dalil and show the polished home page with the stage-zero chat bar
   and quick actions.
3. Enter a few messy customer notes or transcript snippets.
4. Show AI extraction into pains, objections, and likely segment clues.
5. Show the founder correcting one part of the AI understanding and saving
   the final Consensus Memory.
6. Add a new issue and trigger Similar-Issue Recall: "We have seen
   something like this before."
7. Open the prior memory and the old decision that followed it.
8. Log a new decision and connect it to evidence.
9. Open the Timeline page to show progression over time.
10. Close with the promise: **evidence for every next move.**

---

## 13. Risks, boundaries, and anti-scope-creep rules

| Risk | Response |
|---|---|
| Judges think it is just a CRM | CRMs store contacts. Dalil stores learning, decisions, and outcomes. |
| Judges think it is only summarization | Summarization is just the entry point; the real value is consensus capture, recall, and timeline learning. |
| Too many integrations | Show beautifully mocked connectors, but do not let integration plumbing delay the core flow. |
| Weak UI polish | Protect the final 4 to 5 hours for cleanup, spacing, copy, and rehearsing the product story. |
| LLM inconsistency | Use structured JSON outputs and force a founder review step before final save. |

> **Absolute rule.** If a feature does not improve the core
> before-and-after transformation, it does not deserve core build time.

---

## 14. Locked decisions for the team

- **Product name.** Dalil
- **Tagline.** Evidence for every next move.
- **Primary wedge.** Consensus Capture + Similar-Issue Recall + Decision Timeline.
- **Homepage special feature.** Stage-zero chat bar with "What do you want
  to do today?"
- **Premium SaaS direction.** Calm, minimal, modern, evidence-based.
- **Historical context recall.** Uses semantic retrieval.
- **Integrations.** Shown visually, but do not consume the build.
- **Optimization.** One excellent demo workflow, not a broad product surface.

> **Final team alignment statement.** Dalil is the Muslim-friendly,
> evidence-driven founder memory system that helps builders move from
> uncertainty to informed action, from idea to workspace, and from
> scattered conversations to clear next moves.

---

# Engineering

## Stack

- **Framework.** Next.js 16 · TypeScript · App Router · Turbopack.
- **Styling.** Tailwind CSS v4 · shadcn/ui on Base UI.
- **Fonts.** Inter, Sora, JetBrains Mono via `next/font`.
- **Data.** Supabase Postgres + pgvector. RLS on every table. `match_*`
  RPCs for semantic recall.
- **AI.** Anthropic (extraction / rollups) + OpenAI (embeddings).
  Lazy-initialized so paths that don't need AI don't require the keys.
- **Env.** zod-validated via `src/lib/env.ts`.

## Quick start

```bash
cp .env.example .env.local
# fill in the Supabase + provider keys

npm install
npm run dev
```

App runs at http://localhost:3000.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Enable the `vector` extension (Database → Extensions → search `vector` → enable).
3. Run the initial migration:

   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
   ```

   Or paste the file into **Supabase dashboard → SQL editor → Run**.
4. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.
5. (Optional) Seed demo workspaces:
   - Edit `supabase/seed.sql` — replace `00000000-...` with your
     `auth.users.id`.
   - Run it.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero chat, stats, how-it-works, recent memory |
| `/start` | Dalil Start — stage-zero guided conversation |
| `/workspaces` | Workspace list |
| `/workspaces/new` | Create workspace |
| `/w/[id]` | Workspace dashboard — rollups, themes, next tests |
| `/w/[id]/capture` | Ingest a signal, confirm the AI extraction |
| `/w/[id]/memory` | Memory library with filters and quote snippets |
| `/w/[id]/decisions` | Decision ledger with evidence links |
| `/w/[id]/timeline` | Chronology of signals → decisions → outcomes |
| `/ideas` | Idea Vault — approved stage-zero ideas |
| `/integrations` | Mocked connectors (Gong, Zoom, Notion, Slack, Linear…) |
| `/settings`, `/settings/profile` | Workspace and account preferences |

## Directory map

```
src/
  app/                  App Router routes
  components/
    layout/             AppShell, TopNav, Logo, PageStub
    home/               HeroChat
    ui/                 shadcn primitives
  lib/
    env.ts              zod-validated, lazy env
    supabase/           client, server, types
    ai/                 anthropic, openai
supabase/
  migrations/0001_init.sql
  seed.sql
```

## Deploying to Replit

1. Push to GitHub.
2. [replit.com/import](https://replit.com/import) → GitHub → pick the repo.
3. Add every entry from `.env.example` as a **Secret** in Replit.
4. **Deployments** tab → **Autoscale**.
5. Build command: `npm run build`. Run command: `npm start`.
6. Deploy.

## License

Private. All rights reserved.
