# AgentPayOps

AgentPayOps is a seven-page finance controls demo for autonomous purchasing. Visitors can review sample invoices, edit extracted fields, run policy and optional AI review, make human decisions on escalations, and inspect one shared audit trail. All payments in the workspace are **simulated**.

## Workspace

| Route | Purpose |
| --- | --- |
| `/` | Overview metrics and recorded decision mix |
| `/invoices` | Sample or uploaded invoice intake; editable fields carry to a run |
| `/runs` | Server-controlled scenarios, provider states, measured latency, run history |
| `/approvals` | Human review of escalated demo payments |
| `/policies` | Editable controls with version conflict detection |
| `/audit` | Transactions and audit events, search, filters, full CSV/JSON export |
| `/architecture` | System explanation and the same run controller |
| `/presenter` | Protected reset for the isolated demo dataset |

Start at `/runs`: clean purchase → rules escalation → Jev fraud review → human decision → audit. The duplicate and blocked-vendor cases are available independently. If Jev is unavailable, a rule-approved payment remains rules-only; the UI reports Jev as unavailable. Command Code memos fall back to a labelled deterministic memo. A successful run stores authoritative server output and audit records together. No browser-supplied decision can be persisted through the legacy `/api/agent-runs` endpoint.

## Data and deployment

The new workspace reads and writes only `demo_v2_*` Supabase tables. Apply [`supabase/demo-v2.sql`](supabase/demo-v2.sql) to the Supabase project used by the **preview**. It creates isolated policy, run, transaction, and audit tables and atomic functions for completed runs, human decisions, and presenter reset. The existing public ledger tables are untouched. Run the migration before deploying the preview. Use a 20+ character `PRESENTER_RESET_SECRET` in Preview only; the presenter session is an HTTP-only cookie for 30 minutes. Provider and Supabase service keys stay server-side.

Required shared-data environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PRESENTER_RESET_SECRET
```

Optional provider variables: `CMD_API_KEY`, `CMD_MODELS`, `CMD_LLM_MODE`, `JEV_MODE`, `JEV_MODEL`. AI absence is reported explicitly. The app shows labelled sample data locally when Supabase is not configured; mutations require a working demo database. A configured database error returns an unavailable state rather than silently showing sample records.

Uploads accept TXT, CSV, JSON, XML, JPEG, PNG, and WebP up to 6 MB. PDFs and failed extraction receive explicit errors. Raw uploaded files are processed in memory and are not stored. Use sample documents on the shared public preview.

## Local verification

```bash
npm ci
npm run lint
npm run build
npm run evals
npm run evals:jev
npx @google/design.md lint DESIGN.md
```

Local policy evaluations establish only deterministic rule behavior. They do not prove Jev, Command Code, database, or X402 provider availability. The vendor-risk endpoint can return a demo 402 challenge; the workspace shows simulated payment references only. Real settlement is outside this demo path.

Design guidance: [`DESIGN.md`](DESIGN.md), [`docs/design/UX-SPEC.md`](docs/design/UX-SPEC.md), and [`docs/design/references/INDEX.md`](docs/design/references/INDEX.md). Demo narration is in [`docs/demo-script.md`](docs/demo-script.md). Preview setup is in [`docs/deployment/supabase.md`](docs/deployment/supabase.md).
