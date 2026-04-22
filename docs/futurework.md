# Future Work & Roadmap

This document captures prioritized improvement suggestions for Dalil across product, engineering, AI/ML, and infrastructure dimensions. Items are grouped by theme and roughly ordered by impact relative to effort.

---

## 1. Authentication & Multi-Tenancy

**Current state:** Supabase Auth is wired but RLS policies are permissive for demo purposes.

**Improvements:**
- Tighten RLS policies so every table row is scoped to the authenticated user's organization.
- Add team/organization support: invite members, assign roles (Owner, Member, Viewer), share workspaces across a team.
- Support SSO via SAML 2.0 or OIDC for enterprise buyers (Supabase Auth supports this with custom providers).
- Add email-based magic link or Google OAuth as the default sign-in to reduce friction.

---

## 2. Real Integrations (Replace the Mocked Connector Page)

**Current state:** The Integrations page is a visual placeholder.

**Improvements:**
- **Gong / Chorus** — pull call transcripts directly via their APIs; auto-ingest as signals.
- **Zoom / Google Meet** — post-call webhook that triggers signal ingest automatically.
- **Notion** — two-way sync: push confirmed memories into a Notion database and pull Notion docs as signal sources.
- **Slack** — surface similar-issue recall results as Slack messages; allow `/dalil capture` slash command.
- **Linear / Jira** — link decisions to issues; auto-update outcome status when a ticket closes.
- **HubSpot / Salesforce** — pull CRM notes and deal stages as signals; surface Dalil insights inside the CRM sidebar.

Each integration should follow an OAuth flow and store tokens encrypted in Supabase.

---

## 3. AI Pipeline Improvements

### Embedding Model Upgrade
- Switch from `text-embedding-004` (768-dim) to `text-embedding-3-large` (3072-dim, OpenAI) for higher recall precision, or use Gemini's upcoming larger embedding model.
- Store both raw and confirmed text embeddings so recall can weight founder-confirmed understanding more heavily.

### Retrieval Quality
- Add re-ranking (Cohere Rerank or a cross-encoder) on top of pgvector cosine similarity to improve the top-k results shown in Similar-Issue Recall.
- Implement hybrid search: combine BM25 keyword matching with vector similarity for better recall on rare terms (proper nouns, product names, competitor mentions).

### Extraction Accuracy
- Add a confidence score to each extracted field; flag low-confidence extractions for mandatory founder review rather than optional review.
- Fine-tune extraction prompts with few-shot examples drawn from the user's own confirmed memories over time (personalized extraction).
- Support multilingual input — many founder conversations happen in Arabic, Spanish, French, or Hindi.

### Ask Your Memory (RAG Chat)
- Build a conversational interface over the workspace memory: "What objections have we heard most about pricing?" or "Show me all signals from enterprise prospects."
- Use streaming responses and cite the specific memory IDs that informed each answer.

---

## 4. Signal Ingest Expansion

**Current state:** Signals are ingested by pasting text.

**Improvements:**
- **File upload** — accept `.docx`, `.pdf`, `.txt`, and auto-extract text (mammoth is already a dependency for `.docx`).
- **Audio / video upload** — transcribe with OpenAI Whisper or Google Speech-to-Text before passing to the extraction pipeline.
- **URL ingest** — paste a Loom URL, a YouTube video, or a web page and Dalil fetches and processes the content.
- **Email forwarding** — give each workspace a unique inbound email address; forwarded emails become signals automatically.
- **Browser extension** — highlight text on any web page and send to Dalil as a signal in one click.

---

## 5. Analytics & Trend Visualization

**Current state:** Dashboard shows static AI rollup cards.

**Improvements:**
- Time-series charts showing signal volume, sentiment shift, and theme frequency over weeks/months.
- Segment breakdown: what are enterprise prospects saying vs. SMB prospects vs. individual users?
- Decision success rate: what percentage of decisions resulted in a positive outcome? Which signal categories predicted the best outcomes?
- Heat map of the most frequently mentioned pain points across all workspaces (for multi-workspace users).

---

## 6. Stripe & Billing Hardening

**Current state:** Stripe Checkout session creation and webhook handler exist.

**Improvements:**
- Persist subscription status to Supabase after the `checkout.session.completed` and `customer.subscription.*` webhook events; gate features based on plan tier.
- Add a customer portal link (`stripe.billingPortal.sessions.create`) so users can manage or cancel their subscription without contacting support.
- Implement usage-based billing for AI API calls (track token consumption per workspace, expose usage dashboard).
- Add a free tier with workspace/signal limits and a clear upgrade prompt when limits are hit.

---

## 7. Mobile & Responsive Experience

**Current state:** Desktop-first layout.

**Improvements:**
- Build a responsive mobile layout for the capture and memory pages — founders frequently want to log a conversation immediately after it ends, on their phone.
- Progressive Web App (PWA) manifest + service worker for offline-capable signal drafting that syncs when connectivity returns.
- Consider a React Native / Expo companion app for voice note capture in the field.

---

## 8. Testing & Code Quality

**Current state:** No automated test suite.

**Improvements:**
- Add unit tests for AI extraction helpers (`src/lib/ai/`) using `vitest` with mocked Gemini responses.
- Add integration tests for API routes using `msw` (Mock Service Worker) and a test Supabase instance.
- Add end-to-end tests with Playwright covering the core workflow: create workspace → ingest signal → confirm memory → create decision.
- Set up CI with GitHub Actions: lint, typecheck, unit tests, and a build smoke test on every pull request.
- Enforce TypeScript strict mode (`"strict": true`) across the entire codebase.

---

## 9. Performance & Scalability

**Current state:** All AI calls are synchronous; long extraction operations block the request.

**Improvements:**
- Move AI extraction to a background job queue (e.g., Inngest, Trigger.dev, or Supabase Edge Functions with a queue table) so the user sees an immediate "processing" state rather than a long spinner.
- Add Redis-based caching (Upstash) for workspace rollup results — rollups are expensive and don't need to recompute on every page load.
- Implement incremental static regeneration (ISR) or React Server Component streaming for the workspace dashboard.
- Add database indexes on the most queried columns (workspace_id, created_at, embedding) and monitor slow queries via Supabase's built-in query analysis.

---

## 10. Observability & Error Handling

**Current state:** Errors are thrown but not tracked.

**Improvements:**
- Integrate Sentry for error tracking (frontend + API routes + edge middleware).
- Add structured logging with a tool like Axiom or Logtail; log AI extraction inputs/outputs (with PII scrubbing) for debugging and prompt improvement.
- Add a health check API route (`/api/health`) that verifies Supabase connectivity and returns a structured status object — required for production uptime monitoring.
- Set up uptime monitoring (Better Uptime, Checkly) to alert on outages.

---

## 11. Security Hardening

**Current state:** Env validation is solid; RLS is permissive.

**Improvements:**
- Enable strict RLS policies in Supabase once multi-tenancy is implemented.
- Add rate limiting to AI-heavy API routes (`/api/capture/extract`, `/api/stage-zero-chat`) using an edge middleware counter in Redis or Upstash.
- Implement CSRF protection on all POST API routes (Next.js handles same-origin by default, but explicit tokens are better for API clients).
- Run a dependency audit and add `npm audit` to CI so vulnerable packages are flagged before merge.
- Add a Content Security Policy header via Next.js middleware.

---

## 12. Onboarding & Activation

**Current state:** No guided onboarding flow.

**Improvements:**
- Add a first-run wizard: choose workspace type → load demo seed data → walk through the core workflow interactively.
- Add empty-state illustrations and clear calls to action on every page so new users always know what to do next.
- Email drip sequence triggered on sign-up (via Resend or Postmark): day 1 — capture your first signal; day 3 — see Similar-Issue Recall in action; day 7 — log your first decision.
- Add an in-app product tour (Shepherd.js or Intro.js) for the workspace dashboard.

---

## Priority Order (Suggested)

| Priority | Area | Why |
|---|---|---|
| 1 | Auth / RLS tightening | Required before any real users |
| 2 | Ask Your Memory (RAG chat) | Highest perceived value demo feature |
| 3 | Background job queue for AI | Fixes the biggest UX pain point (slow extraction) |
| 4 | File & audio upload | Expands ingest surface with minimal AI pipeline change |
| 5 | Stripe billing hardening | Required to generate revenue |
| 6 | Sentry + logging | Required for production confidence |
| 7 | Testing (unit + E2E) | Required for sustainable velocity |
| 8 | Gong / Zoom integration | Biggest enterprise wedge |
| 9 | Mobile responsive | Expands daily use cases |
| 10 | Analytics charts | Increases stickiness and retention |
