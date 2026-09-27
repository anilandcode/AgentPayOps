-- Run this migration in the preview Supabase project before enabling the new workspace.
-- All four tables are isolated from the existing public ledger. Only the server's
-- service role can read/write them; no browser client receives the service key.
create extension if not exists pgcrypto;
create table if not exists public.demo_v2_policies (
 id text primary key, name text not null, category text not null,
 max_amount numeric(14,2) not null check(max_amount >= 0),
 approval_required_above numeric(14,2) not null check(approval_required_above >= 0 and approval_required_above <= max_amount),
 allowed_vendors jsonb not null default '[]', blocked_vendors jsonb not null default '[]',
 enabled boolean not null default true, version integer not null default 1,
 updated_at timestamptz not null default now());
create table if not exists public.demo_v2_transactions (
 id text primary key, invoice_id text not null, agent_name text not null,
 vendor_name text not null, amount numeric(14,2) not null check(amount > 0),
 category text not null, status text not null check(status in ('approved','blocked','escalated','pending','released')),
 policy_decision text not null, reason text not null, x402_reference text not null,
 decided_by text, released_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.demo_v2_audit_events (
 id text primary key, actor_type text not null check(actor_type in ('agent','policy','human','payment')),
 actor_name text not null, action text not null, target text not null,
 decision text not null check(decision in ('approved','blocked','escalated','pending','released')),
 reasoning text not null, created_at timestamptz not null default now());
create table if not exists public.demo_v2_agent_runs (
 id uuid primary key, scenario_id text not null, invoice_id text not null,
 status text not null check(status in ('running','completed','failed')),
 decision text check(decision in ('approved','blocked','escalated','pending','released')),
 payload jsonb, created_at timestamptz not null default now(), completed_at timestamptz);
create index if not exists demo_v2_transactions_created_idx on public.demo_v2_transactions(created_at desc);
-- A simultaneous run or human decision cannot create a second simulated payment
-- for the same invoice/vendor/amount, even when both requests passed an earlier read.
create unique index if not exists demo_v2_paid_invoice_unique on public.demo_v2_transactions(lower(invoice_id),lower(vendor_name),amount) where status in ('approved','released');
create index if not exists demo_v2_audit_created_idx on public.demo_v2_audit_events(created_at desc);
create index if not exists demo_v2_runs_created_idx on public.demo_v2_agent_runs(created_at desc);
alter table public.demo_v2_policies enable row level security;
alter table public.demo_v2_transactions enable row level security;
alter table public.demo_v2_audit_events enable row level security;
alter table public.demo_v2_agent_runs enable row level security;
insert into public.demo_v2_policies(id,name,category,max_amount,approval_required_above,allowed_vendors,blocked_vendors) values
 ('POL-001','Paid data under 500 EUR','vendor-risk-data',500,250,'["Northstar Data Labs","Veritas Risk Graph"]','[]'),
 ('POL-002','Cloud spend requires finance approval above 10k','cloud-credits',15000,10000,'["Vultr","Metro Cloud Brokers"]','[]'),
 ('POL-003','Block duplicate lead enrichment','lead-enrichment',1000,400,'["Clearbit Sample","PeopleGraph Demo"]','["Apex Enrichment API"]')
on conflict(id) do nothing;
create or replace function public.demo_v2_complete_run(p_id uuid,p_decision text,p_payload jsonb,p_transaction jsonb,p_audit jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(890221);
 update demo_v2_agent_runs set status='completed',decision=p_decision,payload=p_payload,completed_at=now() where id=p_id and status='running';
 if not found then raise exception 'Run is no longer active'; end if;
 insert into demo_v2_transactions select * from jsonb_populate_record(null::demo_v2_transactions,p_transaction);
 insert into demo_v2_audit_events select * from jsonb_populate_record(null::demo_v2_audit_events,p_audit);
end $$;
create or replace function public.demo_v2_decide_payment(p_id text,p_decision text,p_actor text,p_note text)
returns void language plpgsql security definer set search_path=public as $$
declare v_at timestamptz:=now(); v_reason text;
begin
 perform pg_advisory_xact_lock(890221);
 if p_decision not in ('released','cancelled') then raise exception 'Invalid human decision'; end if;
 v_reason:=case when p_decision='released' then 'Human finance approval granted' else 'Human finance approval denied' end || case when coalesce(p_note,'')<>'' then ': '||p_note else '.' end;
 update demo_v2_transactions set status=case when p_decision='released' then 'released' else 'blocked' end,
 reason=v_reason,decided_by=p_actor,released_at=case when p_decision='released' then v_at else null end,
 x402_reference=case when p_decision='released' then 'simulated-human-'||substr(gen_random_uuid()::text,1,8) else 'payment-cancelled-by-human' end
 where id=p_id and status='escalated';
 if not found then raise exception 'Transaction is no longer awaiting human approval'; end if;
 insert into demo_v2_audit_events(id,actor_type,actor_name,action,target,decision,reasoning,created_at)
 values('HUMAN-'||substr(gen_random_uuid()::text,1,8),'human',p_actor,
 case when p_decision='released' then 'Approved simulated payment' else 'Rejected simulated payment' end,p_id,
 case when p_decision='released' then 'released' else 'blocked' end,v_reason,v_at);
end $$;
create or replace function public.demo_v2_reset()
returns void language plpgsql security definer set search_path=public as $$
begin
 if not pg_try_advisory_xact_lock(890221) then raise exception 'A run or decision is active'; end if;
 if exists(select 1 from demo_v2_agent_runs where status='running' and created_at > now()-interval '3 minutes') then raise exception 'An active run prevents reset'; end if;
 truncate demo_v2_agent_runs,demo_v2_transactions,demo_v2_audit_events;
 update demo_v2_policies p set name=s.name,category=s.category,max_amount=s.max_amount,
 approval_required_above=s.approval_required_above,allowed_vendors=s.allowed_vendors,
 blocked_vendors=s.blocked_vendors,enabled=true,version=p.version+1,updated_at=now()
 from (values
 ('POL-001','Paid data under 500 EUR','vendor-risk-data',500::numeric,250::numeric,'["Northstar Data Labs","Veritas Risk Graph"]'::jsonb,'[]'::jsonb),
 ('POL-002','Cloud spend requires finance approval above 10k','cloud-credits',15000::numeric,10000::numeric,'["Vultr","Metro Cloud Brokers"]'::jsonb,'[]'::jsonb),
 ('POL-003','Block duplicate lead enrichment','lead-enrichment',1000::numeric,400::numeric,'["Clearbit Sample","PeopleGraph Demo"]'::jsonb,'["Apex Enrichment API"]'::jsonb)
 ) as s(id,name,category,max_amount,approval_required_above,allowed_vendors,blocked_vendors) where p.id=s.id;
end $$;
revoke all on function public.demo_v2_complete_run(uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.demo_v2_decide_payment(text,text,text,text) from public,anon,authenticated;
revoke all on function public.demo_v2_reset() from public,anon,authenticated;
grant execute on function public.demo_v2_complete_run(uuid,text,jsonb,jsonb,jsonb) to service_role;
grant execute on function public.demo_v2_decide_payment(text,text,text,text) to service_role;
grant execute on function public.demo_v2_reset() to service_role;
