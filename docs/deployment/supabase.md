# Supabase Persistence Setup

AgentPayOps works without a database by falling back to sample data. Add Supabase when you want agent runs, transactions, and audit events to persist across browser sessions and deployments.

## Create Tables

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql` from this repository.

## Environment Variables

Add these to Vercel and to your Vultr/Coolify environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Only server routes use `SUPABASE_SERVICE_ROLE_KEY`. Do not expose it in client components.

## What Persists

- Completed agent runs in `agent_runs`
- Payment attempts in `transactions`
- Finance reasoning events in `audit_events`

The dashboard reads `/api/audit`. If Supabase is configured and healthy, that route returns database records. If not, it returns the seeded demo records so the product remains usable.

## Verification

After setting env vars and redeploying:

```bash
curl https://your-domain.example/api/audit
```

Run an agent scenario in the UI, then refresh the page. The newest transaction and audit event should still be present.
