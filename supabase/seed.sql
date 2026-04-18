-- Dalil · demo seed
-- Auto-applied on `supabase db reset`. Manual apply:
--   psql "$DATABASE_URL" -f supabase/seed.sql

-- Idempotency: re-runs without duplication.
begin;

-- ---------- Workspaces ----------
insert into workspaces (id, name, description)
values
  ('11111111-1111-1111-1111-111111111111',
   'Halal Delivery 0→1',
   'Pilot halal-only food delivery marketplace targeting US college campuses with large Muslim student populations.')
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description;

insert into workspaces (id, name, description)
values
  ('22222222-2222-2222-2222-222222222222',
   'Prayer-Time SaaS',
   'B2B prayer scheduling for mosque admins and Muslim-owned companies.')
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description;

-- ---------- Signals + analyses for Halal Delivery ----------
insert into signals (id, workspace_id, title, source_type, raw_text, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
   '11111111-1111-1111-1111-111111111111',
   'Call with Ayesha, UT Austin MSA student',
   'call',
   'Ayesha (UT Austin junior, MSA member): honestly, if it doesn''t deliver after 10pm it doesn''t solve my actual problem. I study until 2am and the only halal option is cold pizza. Delivery fees are also rough — I''d rather walk 20 minutes than pay $8 to cover 2 miles. Would I pay more for late-night? Yeah, probably 15 percent more if it actually arrived hot.',
   now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
   '11111111-1111-1111-1111-111111111111',
   'Interview with Br. Khalid, restaurant owner',
   'interview',
   'Khalid runs a halal grill near campus. Every week I chase Uber Eats for money I''m already owed. Payouts come whenever they come. Also — customers keep asking if my chicken is actually halal, because Uber Eats lists us next to a burger place that sells alcohol. I''d join a halal-only delivery app in a heartbeat if I got paid weekly and automatically, and if they showed my certifier badge on the listing.',
   now() - interval '4 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
   '11111111-1111-1111-1111-111111111111',
   'DM thread with Fatima, potential rider',
   'dm',
   'Fatima is interested in riding part-time. Her questions: can I refuse deliveries from places that sell alcohol on-site? How flexible are hours — can I do just Thursday/Friday nights? What''s the payout structure? I don''t want to work for opaque apps anymore.',
   now() - interval '5 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
   '11111111-1111-1111-1111-111111111111',
   'Survey response batch (n=12) from MSA Slack',
   'notes',
   'Recurring themes from 12 short survey responses across two MSAs: (1) trust around halal authenticity — most mention cross-contamination fears or ''is the meat actually from a halal butcher''; (2) late-night availability — 9 of 12 said they skip dinner because nothing halal is open past 10pm; (3) delivery cost sensitivity — 8 of 12 said fees > $6 are deal-breakers on a student budget.',
   now() - interval '6 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
   '11111111-1111-1111-1111-111111111111',
   'Call with Omar, second restaurant owner',
   'call',
   'Omar runs a Turkish place. Weekly payout would beat biweekly — cashflow is the thing that kills small halal restaurants. He would switch delivery providers for that alone. Also raised certification: he wants his certifier (IFANCA) badged on the listing so customers stop DMing him to verify.',
   now() - interval '7 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections,
   requests, urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
   'Student is blocked by late-night availability and high delivery fees.',
   'Late-night delivery cutoff (10pm) eliminates the product for night-studying students. Delivery fees >$6 are deal-breakers. Would pay 15% more if reliable after 10pm.',
   array['Late-night reliability','Delivery fees too high for students'],
   array['Not open past 10pm','Fees >$6 too expensive'],
   array['Late-night halal delivery','Lower delivery fees'],
   'high', 'Campus Muslim student',
   array['If it doesn''t deliver after 10pm it doesn''t solve my actual problem.','I''d rather walk 20 minutes than pay $8 to cover 2 miles.'],
   'high', now() - interval '3 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
   'Restaurant owner has payout-timing and credibility issues on existing platforms.',
   'Existing platforms have opaque, slow payouts. Halal credibility is muddled by being listed next to non-halal businesses. Willing to switch for weekly/automatic payouts and visible halal certifier badges.',
   array['Payout timing opacity','No dedicated halal brand','Certifier invisibility'],
   array['Weekly opaque payouts','Listed next to alcohol-selling restaurants'],
   array['Weekly automatic payouts','Halal certifier badge on listing'],
   'high', 'Halal restaurant operator',
   array['Every week I chase Uber Eats for money I''m already owed.','Customers keep asking if my chicken is actually halal.'],
   'high', now() - interval '4 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
   'Prospective rider has questions about halal boundaries and hour flexibility.',
   'Rider wants clarity on (a) ability to decline deliveries from places that sell alcohol, (b) flexible part-time hours, and (c) transparent payout structure.',
   array['Uncertainty about halal boundaries','Inflexible hours on other apps','Opaque payout'],
   array['Can I refuse alcohol-adjacent deliveries?'],
   array['Ability to decline alcohol-serving restaurants','Flexible Thursday/Friday-only hours','Transparent payouts'],
   'medium', 'Rider',
   array['Can I refuse deliveries from places that sell alcohol on-site?','I don''t want to work for opaque apps anymore.'],
   'medium', now() - interval '5 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
   'Aggregated survey confirms three dominant student pain points.',
   'Three recurring themes from 12 MSA survey responses: (1) halal authenticity trust gap, (2) 9/12 skip dinner due to no halal after 10pm, (3) 8/12 consider fees >$6 deal-breakers.',
   array['Halal authenticity trust','Late-night unavailability','Fee sensitivity'],
   array['Fees >$6 too high','Cross-contamination fears'],
   array['Certified halal-only catalog','Late-night availability','Low student-friendly fees'],
   'high', 'Campus Muslim student',
   array['9 of 12 said they skip dinner because nothing halal is open past 10pm.','8 of 12 said fees > $6 are deal-breakers on a student budget.'],
   'high', now() - interval '6 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05',
   'Second restaurant owner reinforces payout-timing and certifier visibility as priorities.',
   'Weekly payouts would drive immediate switching. Certifier (IFANCA) visibility on listings is a top credibility ask.',
   array['Biweekly payouts hurt cashflow','Certifier invisibility'],
   array['Biweekly payout timing'],
   array['Weekly automatic payouts','Certifier (IFANCA) badge on listing'],
   'high', 'Halal restaurant operator',
   array['Weekly payout would beat biweekly — cashflow is the thing that kills small halal restaurants.'],
   'high', now() - interval '7 days')
on conflict (signal_id) do nothing;

-- ---------- Decisions for Halal Delivery ----------
insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at)
values
  ('dec00001-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Launch with halal-only catalog, no mixed kitchens',
   'Positioning',
   'Four of five confirmed memories (surveys + direct calls) cite cross-contamination fears or certifier invisibility as a top concern. Trust wedge > catalog breadth.',
   'Stronger trust signal and tighter brand. Expect conversion lift vs. mixed marketplaces.',
   now() - interval '6 days'),
  ('dec00001-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   'Extend delivery window to midnight on weekends',
   'Operations',
   'Late-night cutoff came up in 3 of 5 memories — one direct quote said "doesn''t solve my actual problem" without late-night. Weekend-first caps rider-supply risk.',
   'Higher conversion among campus students; rider-supply holdouts on weekdays are acceptable pilot loss.',
   now() - interval '5 days'),
  ('dec00001-0000-0000-0000-000000000003',
   '11111111-1111-1111-1111-111111111111',
   'Weekly automatic payouts with transparent per-delivery breakdown',
   'Pricing',
   'Both restaurant-owner memories independently named opaque/slow payouts as the #1 reason to switch. Riders echoed payout-transparency.',
   'Faster restaurant adoption and rider retention above industry baseline.',
   now() - interval '4 days'),
  ('dec00001-0000-0000-0000-000000000004',
   '11111111-1111-1111-1111-111111111111',
   'Display halal certifier badge on every restaurant card',
   'Positioning',
   'Certifier invisibility showed up in both restaurant interviews and the student survey''s authenticity theme.',
   'Reduction in customer DMs verifying halal status; higher trust at first impression.',
   now() - interval '2 days')
on conflict (id) do nothing;

-- ---------- Evidence links ----------
insert into decision_evidence (decision_id, signal_id, snippet) values
  ('dec00001-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02','Customers keep asking if my chicken is actually halal.'),
  ('dec00001-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04','9 of 12 said cross-contamination is a top-two concern.'),
  ('dec00001-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05','Weekly payout would beat biweekly; certifier badge is a top ask.'),
  ('dec00001-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01','If it doesn''t deliver after 10pm it doesn''t solve my actual problem.'),
  ('dec00001-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04','9 of 12 said they skip dinner because nothing halal is open past 10pm.'),
  ('dec00001-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02','Every week I chase Uber Eats for money I''m already owed.'),
  ('dec00001-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03','I don''t want to work for opaque apps anymore.'),
  ('dec00001-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05','Cashflow is the thing that kills small halal restaurants.'),
  ('dec00001-0000-0000-0000-000000000004','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02','Uber Eats lists us next to a burger place that sells alcohol.'),
  ('dec00001-0000-0000-0000-000000000004','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05','He wants his certifier (IFANCA) badged on the listing.')
on conflict (decision_id, signal_id) do nothing;

-- ---------- Outcomes ----------
insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('out00001-0000-0000-0000-000000000001',
   'dec00001-0000-0000-0000-000000000002',
   'improved',
   'Late-night weekend pilot at UT Austin ran 3 weeks. Conversion +23% vs. baseline; retention held at 68% vs. 45%. Rider supply held on Fri/Sat — Thursday was marginal.',
   now() - interval '1 day'),
  ('out00001-0000-0000-0000-000000000002',
   'dec00001-0000-0000-0000-000000000001',
   'pending',
   'Halal-only catalog launched; measuring trust lift via post-order NPS and certifier-question DM volume.',
   now() - interval '3 days'),
  ('out00001-0000-0000-0000-000000000003',
   'dec00001-0000-0000-0000-000000000003',
   'pending',
   'Weekly payout rolled out to first 8 restaurants; measuring NPS and churn against the month prior.',
   now() - interval '2 days'),
  ('out00001-0000-0000-0000-000000000004',
   'dec00001-0000-0000-0000-000000000004',
   'pending',
   'Certifier badge goes live with next release.',
   now() - interval '1 day')
on conflict (id) do nothing;

-- ---------- A couple of Ideas in the Idea Vault ----------
insert into ideas (id, approved_idea, audience, problem_statement, converted_workspace_id)
values
  ('ide00001-0000-0000-0000-000000000001',
   'Halal Delivery 0→1',
   'Muslim college students at large public universities',
   'Late-night halal delivery is effectively impossible after 10pm on most campuses, and restaurant payouts are slow and opaque.',
   '11111111-1111-1111-1111-111111111111'),
  ('ide00001-0000-0000-0000-000000000002',
   'Zakat Automation for Founders',
   'Muslim founders with variable annual income',
   'Calculating zakat over appreciating startup equity and receivables is stressful and manual.',
   null),
  ('ide00001-0000-0000-0000-000000000003',
   'Masjid CRM',
   'Masjid board members and event coordinators',
   'Member data is scattered across WhatsApp groups, spreadsheets, and three different sign-up forms.',
   null)
on conflict (id) do nothing;

commit;
