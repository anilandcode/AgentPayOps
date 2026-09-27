# Shared preview database

The glass workspace uses isolated `demo_v2_*` tables. The old `transactions`, `audit_events`, `agent_runs`, and `policies` tables belong to the previous public demo and are not read or changed by the new workspace.

1. Use a Supabase project accessible to the preview. Run [`../../supabase/demo-v2.sql`](../../supabase/demo-v2.sql) in its SQL editor. The migration creates the tables, seeds three policies, enables RLS, and grants atomic functions only to the service role.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Vercel **Preview**. Do not expose the service role key to browser code. Set `PRESENTER_RESET_SECRET` to a random 20+ character value in Preview only.
3. Deploy to a Vercel preview URL. `/api/audit` must return `source: "supabase"`. Run one scenario and verify a run, transaction, and audit event are visible. Make one human decision; confirm the transaction and audit entry change together. Test a second session and the presenter reset.
4. Keep the current production URL unchanged until the preview passes live checks and receives release approval.

The SQL functions serialize writes and prevent a second decision on an already reviewed item. A recent running row blocks reset. Policy edits require the caller's current `version`; stale edits return a conflict. No in-memory mutation is presented as shared persistence.
