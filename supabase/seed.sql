-- Demo seed. Run after applying migrations/0001_init.sql.
-- Replace the owner uuid with your actual auth.users id before running.
--
-- Usage:
--   psql $DATABASE_URL -f supabase/seed.sql
--
-- Or paste into the Supabase SQL editor after editing :owner_id.

\set owner_id '00000000-0000-0000-0000-000000000000'

insert into workspaces (id, name, description, owner) values
  ('11111111-1111-1111-1111-111111111111', 'Halal Delivery 0→1', 'Pilot halal-only delivery marketplace.', :'owner_id'),
  ('22222222-2222-2222-2222-222222222222', 'Prayer-Time SaaS', 'B2B prayer scheduling for mosque admins.', :'owner_id')
on conflict (id) do nothing;

insert into signals (id, workspace_id, title, source_type, raw_text) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Call with Ayesha, UT Austin MSA',
   'call',
   'Ayesha: honestly if it doesn''t deliver after 10pm it doesn''t solve my actual problem. I study until 2am and the only halal option is cold pizza. Delivery fees are also rough — I''d rather walk 20 minutes than pay $8 to cover 2 miles.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'Interview with Br. Khalid, restaurant owner',
   'interview',
   'Br. Khalid: every week I chase Uber Eats for money I''m already owed. Payouts come whenever they come. I''d join a halal-only delivery app in a heartbeat if I got paid weekly and automatically.')
on conflict (id) do nothing;
