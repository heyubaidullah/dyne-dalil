import "server-only";
import type { WorkspaceSummary, WorkspaceRow } from "@/lib/queries/workspaces";
import type { SignalWithAnalysis } from "@/lib/queries/signals";
import type { DecisionWithContext } from "@/lib/queries/decisions";
import type { TimelineEntry } from "@/lib/queries/timeline";
import type { IdeaRow } from "@/lib/queries/ideas";
import type { RecentEntry } from "@/lib/queries/recent";

/**
 * In-memory demo data that mirrors supabase/seed.sql exactly.
 *
 * Used as a fallback whenever Supabase is unreachable or the schema isn't
 * applied yet — so every page continues to render the Halal Delivery
 * narrative the demo depends on, even offline.
 */

const now = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const HALAL = "11111111-1111-1111-1111-111111111111";
const PRAYER = "22222222-2222-2222-2222-222222222222";

export const DEMO_WORKSPACES: WorkspaceSummary[] = [
  {
    id: HALAL,
    name: "Halal Delivery 0→1",
    description:
      "Pilot halal-only food delivery marketplace targeting US college campuses with large Muslim student populations.",
    created_at: now(10),
    signal_count: 5,
    decision_count: 4,
    last_activity: now(1),
  },
  {
    id: PRAYER,
    name: "Prayer-Time SaaS",
    description:
      "B2B prayer scheduling for mosque admins and Muslim-owned companies.",
    created_at: now(12),
    signal_count: 3,
    decision_count: 2,
    last_activity: now(2),
  },
];

const BASE_WS: Record<string, WorkspaceRow> = {
  [HALAL]: {
    id: HALAL,
    name: "Halal Delivery 0→1",
    description:
      "Pilot halal-only food delivery marketplace targeting US college campuses with large Muslim student populations.",
    created_at: now(10),
  },
  [PRAYER]: {
    id: PRAYER,
    name: "Prayer-Time SaaS",
    description:
      "B2B prayer scheduling for mosque admins and Muslim-owned companies.",
    created_at: now(12),
  },
};

export function demoWorkspace(id: string): WorkspaceRow | null {
  return BASE_WS[id] ?? null;
}

const SIGNALS_BY_WS: Record<string, SignalWithAnalysis[]> = {
  [HALAL]: [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
      workspace_id: HALAL,
      title: "Call with Ayesha, UT Austin MSA student",
      source_type: "call",
      raw_text:
        "Ayesha (UT Austin junior, MSA member): honestly, if it doesn't deliver after 10pm it doesn't solve my actual problem. I study until 2am and the only halal option is cold pizza. Delivery fees are also rough — I'd rather walk 20 minutes than pay $8 to cover 2 miles.",
      created_at: now(3),
      analysis: {
        id: "sa-01",
        signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
        ai_summary:
          "Student is blocked by late-night availability and high delivery fees.",
        founder_notes: null,
        confirmed_summary:
          "Late-night delivery cutoff (10pm) eliminates the product for night-studying students. Delivery fees >$6 are deal-breakers. Would pay 15% more if reliable after 10pm.",
        pain_points: [
          "Late-night reliability",
          "Delivery fees too high for students",
        ],
        objections: ["Not open past 10pm", "Fees >$6 too expensive"],
        requests: ["Late-night halal delivery", "Lower delivery fees"],
        urgency: "high",
        likely_segment: "Campus Muslim student",
        quotes: [
          "If it doesn't deliver after 10pm it doesn't solve my actual problem.",
          "I'd rather walk 20 minutes than pay $8 to cover 2 miles.",
        ],
        confidence: "high",
        created_at: now(3),
        confirmed_at: now(3),
      },
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
      workspace_id: HALAL,
      title: "Interview with Br. Khalid, restaurant owner",
      source_type: "interview",
      raw_text:
        "Khalid runs a halal grill near campus. Every week I chase Uber Eats for money I'm already owed. Also — customers keep asking if my chicken is actually halal, because Uber Eats lists us next to a burger place that sells alcohol.",
      created_at: now(4),
      analysis: {
        id: "sa-02",
        signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
        ai_summary:
          "Restaurant owner has payout-timing and credibility issues on existing platforms.",
        founder_notes: null,
        confirmed_summary:
          "Existing platforms have opaque, slow payouts. Halal credibility is muddled by being listed next to non-halal businesses. Willing to switch for weekly/automatic payouts and visible halal certifier badges.",
        pain_points: [
          "Payout timing opacity",
          "No dedicated halal brand",
          "Certifier invisibility",
        ],
        objections: [
          "Weekly opaque payouts",
          "Listed next to alcohol-selling restaurants",
        ],
        requests: [
          "Weekly automatic payouts",
          "Halal certifier badge on listing",
        ],
        urgency: "high",
        likely_segment: "Halal restaurant operator",
        quotes: [
          "Every week I chase Uber Eats for money I'm already owed.",
          "Customers keep asking if my chicken is actually halal.",
        ],
        confidence: "high",
        created_at: now(4),
        confirmed_at: now(4),
      },
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03",
      workspace_id: HALAL,
      title: "DM thread with Fatima, potential rider",
      source_type: "dm",
      raw_text:
        "Fatima is interested in riding part-time. Her questions: can I refuse deliveries from places that sell alcohol on-site? How flexible are hours?",
      created_at: now(5),
      analysis: {
        id: "sa-03",
        signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03",
        ai_summary:
          "Prospective rider has questions about halal boundaries and hour flexibility.",
        founder_notes: null,
        confirmed_summary:
          "Rider wants clarity on (a) ability to decline deliveries from places that sell alcohol, (b) flexible part-time hours, and (c) transparent payout structure.",
        pain_points: [
          "Uncertainty about halal boundaries",
          "Inflexible hours on other apps",
          "Opaque payout",
        ],
        objections: ["Can I refuse alcohol-adjacent deliveries?"],
        requests: [
          "Ability to decline alcohol-serving restaurants",
          "Flexible Thursday/Friday-only hours",
          "Transparent payouts",
        ],
        urgency: "medium",
        likely_segment: "Rider",
        quotes: [
          "Can I refuse deliveries from places that sell alcohol on-site?",
          "I don't want to work for opaque apps anymore.",
        ],
        confidence: "medium",
        created_at: now(5),
        confirmed_at: now(5),
      },
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
      workspace_id: HALAL,
      title: "Survey response batch (n=12) from MSA Slack",
      source_type: "notes",
      raw_text:
        "Recurring themes from 12 short survey responses: halal authenticity, late-night availability, delivery cost sensitivity.",
      created_at: now(6),
      analysis: {
        id: "sa-04",
        signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
        ai_summary:
          "Aggregated survey confirms three dominant student pain points.",
        founder_notes: null,
        confirmed_summary:
          "Three recurring themes from 12 MSA survey responses: (1) halal authenticity trust gap, (2) 9/12 skip dinner due to no halal after 10pm, (3) 8/12 consider fees >$6 deal-breakers.",
        pain_points: [
          "Halal authenticity trust",
          "Late-night unavailability",
          "Fee sensitivity",
        ],
        objections: ["Fees >$6 too high", "Cross-contamination fears"],
        requests: [
          "Certified halal-only catalog",
          "Late-night availability",
          "Low student-friendly fees",
        ],
        urgency: "high",
        likely_segment: "Campus Muslim student",
        quotes: [
          "9 of 12 said they skip dinner because nothing halal is open past 10pm.",
          "8 of 12 said fees > $6 are deal-breakers on a student budget.",
        ],
        confidence: "high",
        created_at: now(6),
        confirmed_at: now(6),
      },
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
      workspace_id: HALAL,
      title: "Call with Omar, second restaurant owner",
      source_type: "call",
      raw_text:
        "Omar runs a Turkish place. Weekly payout would beat biweekly — cashflow is the thing that kills small halal restaurants. Also wants his certifier (IFANCA) badged on the listing.",
      created_at: now(7),
      analysis: {
        id: "sa-05",
        signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
        ai_summary:
          "Second restaurant owner reinforces payout-timing and certifier visibility as priorities.",
        founder_notes: null,
        confirmed_summary:
          "Weekly payouts would drive immediate switching. Certifier (IFANCA) visibility on listings is a top credibility ask.",
        pain_points: [
          "Biweekly payouts hurt cashflow",
          "Certifier invisibility",
        ],
        objections: ["Biweekly payout timing"],
        requests: [
          "Weekly automatic payouts",
          "Certifier (IFANCA) badge on listing",
        ],
        urgency: "high",
        likely_segment: "Halal restaurant operator",
        quotes: [
          "Weekly payout would beat biweekly — cashflow is the thing that kills small halal restaurants.",
        ],
        confidence: "high",
        created_at: now(7),
        confirmed_at: now(7),
      },
    },
  ],
  [PRAYER]: [
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
      workspace_id: PRAYER,
      title: "Call with Imam Faisal, suburban masjid admin",
      source_type: "call",
      raw_text:
        "Imam Faisal runs a 900-member masjid near Dallas. Current prayer-time tool is an iframe someone embedded in 2014. He manually updates Fajr and Isha twice a week because Hanafi vs Shafi calc methods confuse members. Wants a shared calendar his volunteers can edit, push notifications for Jumu'ah changes, and a printable monthly sheet for the elders.",
      created_at: now(3),
      analysis: {
        id: "sa-p01",
        signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
        ai_summary:
          "Masjid admin needs a shared prayer-time tool with fiqh-aware calculation and push notifications.",
        founder_notes: null,
        confirmed_summary:
          "Masjid admin (~900 members) is blocked by a stale iframe tool, manually reconciles Hanafi vs Shafi calc methods, and wants a shared editable calendar, push for Jumu'ah changes, and a printable monthly sheet.",
        pain_points: [
          "Manual bi-weekly prayer-time updates",
          "Fiqh calculation method confusion",
          "No push notifications for schedule changes",
          "Elders want printable sheets",
        ],
        objections: [
          "Every tool assumes one madhhab",
          "Can't delegate to volunteers safely",
        ],
        requests: [
          "Shared editable calendar",
          "Fiqh-aware calculation methods",
          "Push notifications for Jumu'ah changes",
          "Printable monthly PDF",
        ],
        urgency: "high",
        likely_segment: "Masjid administrator",
        quotes: [
          "Every tool assumes one madhhab — my board is split and I'm the one caught in the middle.",
          "The elders still want something they can tape to the fridge.",
        ],
        confidence: "high",
        created_at: now(3),
        confirmed_at: now(3),
      },
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
      workspace_id: PRAYER,
      title: "Interview with Sr. Maryam, HR at a 60-person Muslim-owned firm",
      source_type: "interview",
      raw_text:
        "Sr. Maryam handles ops at a 60-person Muslim-owned firm in the Bay Area. Employees want a prayer-room booking tool, automatic Zuhr/Asr blockers on Google Calendar, and a weekly email summarizing iqamah times. They've tried three products — all consumer-focused, none handled SSO or the office's Hijri calendar preference.",
      created_at: now(5),
      analysis: {
        id: "sa-p02",
        signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
        ai_summary:
          "B2B buyer at a Muslim-owned SMB needs prayer-room booking, calendar blockers, and SSO.",
        founder_notes: null,
        confirmed_summary:
          "HR at a 60-person firm wants a prayer-room booking tool, automatic Zuhr/Asr Google Calendar blockers, a weekly iqamah email, SSO, and Hijri calendar display. Consumer tools failed all three asks.",
        pain_points: [
          "No SSO on consumer prayer apps",
          "No prayer-room booking",
          "No Google Calendar blocker automation",
          "Hijri calendar not shown in product",
        ],
        objections: [
          "Can't deploy consumer apps to 60 employees",
        ],
        requests: [
          "Prayer-room booking",
          "Auto Google Calendar blockers for Zuhr/Asr",
          "Weekly iqamah summary email",
          "SSO (Google Workspace / Okta)",
          "Hijri alongside Gregorian",
        ],
        urgency: "high",
        likely_segment: "Muslim-owned SMB operations",
        quotes: [
          "Three products, none of them even know what SSO is.",
          "Zuhr blockers on the shared calendar would kill the passive-aggressive scheduling.",
        ],
        confidence: "high",
        created_at: now(5),
        confirmed_at: now(5),
      },
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03",
      workspace_id: PRAYER,
      title: "DM thread with Br. Yusuf, volunteer youth coordinator",
      source_type: "dm",
      raw_text:
        "Br. Yusuf helps run halaqa scheduling for masjid youth program. Says WhatsApp groups are chaos — teens ignore reminders, parents want confirmation receipts, and nobody tracks which teens actually show up. Asked if Dalil would support recurring event series + attendance tracking.",
      created_at: now(7),
      analysis: {
        id: "sa-p03",
        signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03",
        ai_summary:
          "Volunteer coordinator wants recurring event series + attendance tracking on top of prayer scheduling.",
        founder_notes:
          "Adjacent use case — could be v2 but don't let it bloat the prayer-time MVP.",
        confirmed_summary:
          "Volunteer youth coordinator needs recurring halaqa scheduling with parent-facing confirmations and teen attendance tracking. Currently using WhatsApp groups with no visibility.",
        pain_points: [
          "WhatsApp groups don't track attendance",
          "Parents want confirmation receipts",
          "Reminders ignored by teens",
        ],
        objections: [],
        requests: [
          "Recurring event series",
          "Parent confirmation receipts",
          "Teen attendance tracking",
        ],
        urgency: "medium",
        likely_segment: "Masjid youth / halaqa coordinator",
        quotes: [
          "Parents want a receipt that Tuesday halaqa actually happened.",
        ],
        confidence: "medium",
        created_at: now(7),
        confirmed_at: now(7),
      },
    },
  ],
};

export function demoSignals(workspaceId: string): SignalWithAnalysis[] {
  return SIGNALS_BY_WS[workspaceId] ?? [];
}

const DECISIONS_BY_WS: Record<string, DecisionWithContext[]> = {
  [HALAL]: [
    {
      id: "dec-01",
      workspace_id: HALAL,
      title: "Launch with halal-only catalog, no mixed kitchens",
      category: "Positioning",
      rationale:
        "Four of five confirmed memories (surveys + direct calls) cite cross-contamination fears or certifier invisibility as a top concern. Trust wedge > catalog breadth.",
      expected_outcome:
        "Stronger trust signal and tighter brand. Expect conversion lift vs. mixed marketplaces.",
      created_at: now(6),
      evidence: [
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
          snippet: "Customers keep asking if my chicken is actually halal.",
          signal_title: "Interview with Br. Khalid, restaurant owner",
        },
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
          snippet: "9 of 12 said cross-contamination is a top-two concern.",
          signal_title: "Survey response batch (n=12) from MSA Slack",
        },
      ],
      outcome: {
        id: "out-02",
        decision_id: "dec-01",
        status: "pending",
        notes:
          "Halal-only catalog launched; measuring trust lift via post-order NPS.",
        updated_at: now(3),
      },
    },
    {
      id: "dec-02",
      workspace_id: HALAL,
      title: "Extend delivery window to midnight on weekends",
      category: "Operations",
      rationale:
        "Late-night cutoff came up in 3 of 5 memories — one direct quote said \"doesn't solve my actual problem\" without late-night. Weekend-first caps rider-supply risk.",
      expected_outcome:
        "Higher conversion among campus students; rider-supply holdouts on weekdays are acceptable pilot loss.",
      created_at: now(5),
      evidence: [
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01",
          snippet:
            "If it doesn't deliver after 10pm it doesn't solve my actual problem.",
          signal_title: "Call with Ayesha, UT Austin MSA student",
        },
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
          snippet:
            "9 of 12 said they skip dinner because nothing halal is open past 10pm.",
          signal_title: "Survey response batch (n=12) from MSA Slack",
        },
      ],
      outcome: {
        id: "out-01",
        decision_id: "dec-02",
        status: "improved",
        notes:
          "Late-night weekend pilot at UT Austin ran 3 weeks. Conversion +23% vs. baseline; retention held at 68% vs. 45%.",
        updated_at: now(1),
      },
    },
    {
      id: "dec-03",
      workspace_id: HALAL,
      title: "Weekly automatic payouts with transparent per-delivery breakdown",
      category: "Pricing",
      rationale:
        "Both restaurant-owner memories independently named opaque/slow payouts as the #1 reason to switch. Riders echoed payout-transparency.",
      expected_outcome:
        "Faster restaurant adoption and rider retention above industry baseline.",
      created_at: now(4),
      evidence: [
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02",
          snippet: "Every week I chase Uber Eats for money I'm already owed.",
          signal_title: "Interview with Br. Khalid, restaurant owner",
        },
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
          snippet: "Cashflow is the thing that kills small halal restaurants.",
          signal_title: "Call with Omar, second restaurant owner",
        },
      ],
      outcome: {
        id: "out-03",
        decision_id: "dec-03",
        status: "pending",
        notes:
          "Weekly payout rolled out to first 8 restaurants; measuring NPS and churn.",
        updated_at: now(2),
      },
    },
    {
      id: "dec-04",
      workspace_id: HALAL,
      title: "Display halal certifier badge on every restaurant card",
      category: "Positioning",
      rationale:
        "Certifier invisibility showed up in both restaurant interviews and the student survey's authenticity theme.",
      expected_outcome:
        "Reduction in customer DMs verifying halal status; higher trust at first impression.",
      created_at: now(2),
      evidence: [
        {
          signal_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
          snippet: "He wants his certifier (IFANCA) badged on the listing.",
          signal_title: "Call with Omar, second restaurant owner",
        },
      ],
      outcome: {
        id: "out-04",
        decision_id: "dec-04",
        status: "pending",
        notes: "Certifier badge goes live with next release.",
        updated_at: now(1),
      },
    },
  ],
  [PRAYER]: [
    {
      id: "dec-p01",
      workspace_id: PRAYER,
      title:
        "Ship fiqh-aware calc methods (Hanafi, Shafi, ISNA, MWL) from day one",
      category: "Product",
      rationale:
        "Imam Faisal's masjid (900 members, split board) can't adopt a one-madhhab tool. Sr. Maryam's firm also has mixed employee preferences. Without multi-fiqh from v1, we're a consumer-grade replacement at best.",
      expected_outcome:
        "Higher masjid activation rate; fewer support threads about 'which calc method'.",
      created_at: now(5),
      evidence: [
        {
          signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
          snippet:
            "Every tool assumes one madhhab — my board is split and I'm the one caught in the middle.",
          signal_title: "Call with Imam Faisal, suburban masjid admin",
        },
        {
          signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
          snippet: "Hijri alongside Gregorian — table stakes.",
          signal_title:
            "Interview with Sr. Maryam, HR at a 60-person Muslim-owned firm",
        },
      ],
      outcome: {
        id: "out-p01",
        decision_id: "dec-p01",
        status: "improved",
        notes:
          "Four masjids activated in week one after fiqh picker shipped. Support tickets about calc methods dropped to zero.",
        updated_at: now(2),
      },
    },
    {
      id: "dec-p02",
      workspace_id: PRAYER,
      title: "Lead with B2B (masjid + Muslim-owned SMB), not consumer",
      category: "Positioning",
      rationale:
        "Both confirmed buyer memories (Imam Faisal, Sr. Maryam) are willing to pay per-seat/per-org. Consumer prayer apps commoditize to $0. The pain — coordination — is collective, not individual.",
      expected_outcome:
        "Recurring revenue on two paid pilots within 60 days; tighter product surface.",
      created_at: now(6),
      evidence: [
        {
          signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
          snippet:
            "I'd pay per-seat if it meant my volunteers could update Fajr without breaking anything.",
          signal_title: "Call with Imam Faisal, suburban masjid admin",
        },
        {
          signal_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02",
          snippet: "Three products, none of them even know what SSO is.",
          signal_title:
            "Interview with Sr. Maryam, HR at a 60-person Muslim-owned firm",
        },
      ],
      outcome: {
        id: "out-p02",
        decision_id: "dec-p02",
        status: "pending",
        notes:
          "Two paid pilots contracted; measuring retention against consumer-app baseline.",
        updated_at: now(2),
      },
    },
  ],
};

export function demoDecisions(workspaceId: string): DecisionWithContext[] {
  return DECISIONS_BY_WS[workspaceId] ?? [];
}

export function demoTimeline(workspaceId: string): TimelineEntry[] {
  const signals = demoSignals(workspaceId);
  const decisions = demoDecisions(workspaceId);
  const entries: TimelineEntry[] = [];
  for (const s of signals) {
    entries.push({
      kind: "signal",
      id: s.id,
      date: s.created_at,
      title: s.title ?? "Untitled signal",
      body: s.analysis?.confirmed_summary ?? "",
    });
  }
  for (const d of decisions) {
    entries.push({
      kind: "decision",
      id: d.id,
      date: d.created_at,
      title: d.title,
      body: d.rationale ?? "",
      category: d.category,
    });
    if (d.outcome) {
      entries.push({
        kind: "outcome",
        id: d.outcome.id,
        date: d.outcome.updated_at,
        title: `${formatStatus(d.outcome.status)}: ${d.title}`,
        body: d.outcome.notes ?? "",
        status: d.outcome.status,
      });
    }
  }
  entries.sort((a, b) => (a.date < b.date ? 1 : -1));
  return entries;
}

export const DEMO_IDEAS: IdeaRow[] = [
  {
    id: "idea-01",
    approved_idea: "Halal Delivery 0→1",
    audience: "Muslim college students at large public universities",
    problem_statement:
      "Late-night halal delivery is effectively impossible after 10pm on most campuses, and restaurant payouts are slow and opaque.",
    converted_workspace_id: HALAL,
    created_at: now(10),
  },
  {
    id: "idea-02",
    approved_idea: "Zakat Automation for Founders",
    audience: "Muslim founders with variable annual income",
    problem_statement:
      "Calculating zakat over appreciating startup equity and receivables is stressful and manual.",
    converted_workspace_id: null,
    created_at: now(14),
  },
  {
    id: "idea-03",
    approved_idea: "Masjid CRM",
    audience: "Masjid board members and event coordinators",
    problem_statement:
      "Member data is scattered across WhatsApp groups, spreadsheets, and three different sign-up forms.",
    converted_workspace_id: null,
    created_at: now(16),
  },
];

export function demoGlobalStats() {
  const allSignals = Object.values(SIGNALS_BY_WS).flat();
  const allDecisions = Object.values(DECISIONS_BY_WS).flat();
  const withOutcomes = allDecisions.filter((d) => d.outcome);
  return {
    signals: allSignals.length,
    decisions: allDecisions.length,
    outcomes: withOutcomes.length,
    similar_recalls: allSignals.filter((s) => s.analysis?.confirmed_at).length,
  };
}

export function demoRecentActivity(limit = 6): RecentEntry[] {
  const entries: RecentEntry[] = [];
  for (const [wsId, signals] of Object.entries(SIGNALS_BY_WS)) {
    const wsName = BASE_WS[wsId]?.name ?? null;
    for (const s of signals) {
      entries.push({
        kind: "signal",
        id: s.id,
        workspace_id: wsId,
        workspace_name: wsName,
        title: s.title ?? "Untitled signal",
        body: s.analysis?.confirmed_summary ?? "",
        quote: s.analysis?.quotes?.[0] ?? null,
        segment: s.analysis?.likely_segment ?? null,
        when: s.created_at,
      });
    }
  }
  for (const [wsId, decisions] of Object.entries(DECISIONS_BY_WS)) {
    const wsName = BASE_WS[wsId]?.name ?? null;
    for (const d of decisions) {
      entries.push({
        kind: "decision",
        id: d.id,
        workspace_id: wsId,
        workspace_name: wsName,
        title: d.title,
        body: d.rationale ?? "",
        quote: null,
        segment: d.category,
        when: d.created_at,
      });
      if (d.outcome && d.outcome.status !== "pending") {
        entries.push({
          kind: "outcome",
          id: d.outcome.id,
          workspace_id: wsId,
          workspace_name: wsName,
          title: `${formatStatus(d.outcome.status)}: ${d.title}`,
          body: d.outcome.notes ?? "",
          quote: null,
          segment: wsName,
          when: d.outcome.updated_at,
          outcome_status: d.outcome.status,
        });
      }
    }
  }
  entries.sort((a, b) => (a.when < b.when ? 1 : -1));
  return entries.slice(0, limit);
}

function formatStatus(s: string): string {
  switch (s) {
    case "improved":
      return "Improved";
    case "failed":
      return "Failed";
    case "inconclusive":
      return "Inconclusive";
    default:
      return "Pending";
  }
}
