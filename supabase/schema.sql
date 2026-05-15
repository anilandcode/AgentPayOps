create extension if not exists pgcrypto;

create table if not exists public.invoices (
  id text primary key,
  vendor_name text not null,
  amount numeric(14, 2) not null,
  currency text not null check (currency in ('EUR', 'USD')),
  due_date date,
  category text not null,
  status text not null check (status in ('approved', 'blocked', 'escalated', 'pending')),
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  recommendation text not null,
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.policies (
  id text primary key,
  name text not null,
  category text not null,
  max_amount numeric(14, 2) not null,
  approval_required_above numeric(14, 2) not null,
  allowed_vendors jsonb not null default '[]'::jsonb,
  blocked_vendors jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  invoice_id text not null,
  agent_name text not null,
  vendor_name text not null,
  amount numeric(14, 2) not null,
  category text not null,
  status text not null check (status in ('approved', 'blocked', 'escalated', 'pending')),
  policy_decision text not null,
  reason text not null,
  x402_reference text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id text primary key,
  actor_type text not null check (actor_type in ('agent', 'policy', 'human', 'payment')),
  actor_name text not null,
  action text not null,
  target text not null,
  decision text not null check (decision in ('approved', 'blocked', 'escalated', 'pending')),
  reasoning text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  scenario_id text not null,
  invoice_id text not null,
  decision text not null check (decision in ('approved', 'blocked', 'escalated', 'pending')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_created_at_idx
  on public.transactions (created_at desc);

create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);

create index if not exists agent_runs_created_at_idx
  on public.agent_runs (created_at desc);
