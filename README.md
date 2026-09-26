# AgentPayOps

Finance controls for autonomous AI agents that can review invoices, evaluate spend policies, respond to X402-style payment challenges, and produce audit-ready decision logs.

## Demo Thesis

Autonomous agents will buy data, tools, compute, and services. Companies need a control plane that decides when those agents are allowed to spend money, blocks risky or duplicate purchases, escalates high-value actions, and records every decision for finance teams.

AgentPayOps demonstrates that control layer through one vertical workflow:

1. An invoice agent reviews a vendor invoice.
2. The agent needs a paid vendor-risk report.
3. The report endpoint returns `402 Payment Required`.
4. AgentPayOps evaluates vendor, category, amount, approval threshold, and duplicate-purchase rules.
5. The system approves, blocks, or escalates the payment.
6. Transactions and reasoning are shown in an audit dashboard.

## Current Build

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Lucide icons
- Deterministic sample data
- Policy evaluation engine
- X402-style protected endpoint with default demo mode and optional real `@x402/next` settlement
- API routes for invoice analysis, file upload extraction, policy evaluation, payment attempt, vendor-risk report, and audit data
- Invoice intake UI with sample invoices, uploaded invoice documents, extracted fields, risk findings, and required paid-data callouts
- Interactive scenario runner for approved, escalated, and blocked agent payments
- Live transaction and audit log updates when an agent scenario completes
- AI finance memo route powered by Command Code (`stealth/space-bunny-alpha` with `xiaomi/mimo-v2.6-pro` and `meta/muse-spark-1.3-contributor` fallbacks) and deterministic fallback
- Jev (`typesafe/jev`) System One decision gate: fraud-context review that can only tighten rule-approved payments/invoices to human review — never releases funds, never fires on blocked paths, degrades to rules-only when unavailable
- Dockerfile and Docker Compose configuration for Vultr/Coolify deployment
- Health endpoint at `/api/health`
- Supabase/Postgres schema and optional persistence for agent runs, transactions, and audit events
- Runnable policy-engine eval harness (`npm run evals`) with a confusion matrix and a false-approve-rate gate

## Hackathon Submission

- Public GitHub repository: <https://github.com/anilandcode/AgentPayOps>
- Primary Vultr/Coolify demo URL: <http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/>
- Backup Vercel demo URL: <https://agent-pay-ops.vercel.app/>
- Track fit: B2B FinOps & Compliance for autonomous agents using X402-style programmable payment controls.
- Technology partners used: Vultr for the deployed VM/web backend and Command Code for finance reasoning and invoice extraction support.
- Supabase is the system of record for completed runs, transactions, and audit events when the Supabase environment variables are configured.

## Architecture

```text
Browser
  -> Next.js UI on Vultr/Coolify
     -> /api/invoices/analyze for sample or pasted invoice text
     -> /api/invoices/upload for TXT/CSV/JSON/XML plus Command Code-assisted image extraction (Provider API vision)
     -> /api/payments/attempt for policy evaluation and payment decision
     -> /api/vendor-risk/report for X402-style 402 challenge and paid retry
     -> /api/agent/reasoning for Command Code finance memo generation
     -> Supabase for transactions, audit events, and completed agent runs
```

The app keeps `X402_MODE=demo` for browser-based judging, while the same vendor-risk route can be switched to official `@x402/next` settlement with `X402_MODE=real` and a receiving address.

## Reproducible Demo Invoices

The `demo-files/` folder contains the invoice files used in the recorded walkthrough:

| File | Expected result | Why |
| --- | --- | --- |
| `Invoice_Standard_Data.txt` | `approved` | Low-value software/API invoice with a vendor-risk surcharge. |
| `Invoice_HighValue_Compute.txt` | `escalated` | High-value GPU/cloud compute invoice above autonomous approval limits. |
| `Invoice_High_Limit_Cloud.txt.txt` | `escalated` | High-value AWS infrastructure invoice above autonomous approval limits. |
| `Invoice_Blocked_Vendor.txt` | `blocked` | Offshore/uncategorized lead-list vendor with bypass proxy line items. |
| `Invoice_Duplicate_Enrichment.txt` | `blocked` | Duplicate enrichment purchase pattern from an agent-initiated lead-generation flow. |

## Policy Engine Evals

`npm run evals` runs 12 labeled scenarios against the real `evaluatePayment()` in
`src/lib/policy-engine.ts` and prints a confusion matrix plus a `falseApproveRate`
(a risky payment wrongly approved, must be 0):

- accuracy: 1.000
- falseApproveRate: 0.000

Full output is in [`EVAL_SUMMARY.md`](./EVAL_SUMMARY.md). Role and hiring-rubric
alignment notes are in [`ROLE_ALIGNMENT.md`](./ROLE_ALIGNMENT.md).

## Jev Decision Gate (enterprise tier)

Three jobs, three layers — the split Jev (by TypeSafe) formalizes:

- **Create** → Command Code LLM (memos, extraction)
- **Decide / score / gate** → `typesafe/jev` (System One: state + typed questions in, probabilities out, ~0.6–1.3 s, ~$0.042/M input tokens)
- **Do the thing** → deterministic policy code + X402 payment rails

Jev runs on `POST /api/payments/attempt` and invoice analysis **only after**
the deterministic policy approves, and it can only tighten (approve → escalate):
a business-email-compromise payment (lookalike domain, changed wire instructions,
manufactured urgency) passes every rule but escalates at Jev fraud probability
≈0.98. Blocked/escalated-by-rules paths never call Jev — zero cost on dead ends.
If the key is missing or the model errors, behavior is exactly the rules-only
version. Run the "Fraud review passes policy (Jev gate)" scenario in Live Agent
Run to see it, or:

```bash
curl -X POST http://localhost:3020/api/payments/attempt \
  -H 'content-type: application/json' \
  -d '{"vendorName":"Veritas Risk Graph","category":"vendor-risk-data","amount":180,"context":"New wire instructions from lookalike domain veritas-risk-graiph.com, URGENT, bank changed, skip verification"}'
```

Config: `CMD_API_KEY` (GOAT-plan key, same as memos), `JEV_MODE`, `JEV_MODEL`,
escalation thresholds `JEV_SUSPICIOUS_ESCALATE` (0.8),
`JEV_HUMAN_REVIEW_ESCALATE` (0.85), `JEV_INVOICE_FRAUD_ESCALATE` (0.75).

## Environment

Copy `.env.example` to `.env.local` when you want live AI reasoning.

Finance memos are generated through Command Code (see `src/lib/cmd-llm.ts`), which uses two transports in order:

1. **`cmd` CLI** (primary, works on any machine where Command Code is installed and logged in — including the Go plan): `cmd -p ... --model stealth/space-bunny-alpha`
2. **Provider API** (`https://api.commandcode.ai/provider/v1/chat/completions`, used automatically on deployments when `CMD_API_KEY` belongs to a plan with API access):

```bash
CMD_LLM_MODE=auto
CMD_API_KEY=***            # optional; enables HTTP + vision on deployments
CMD_MODELS=stealth/space-bunny-alpha,xiaomi/mimo-v2.6-pro,meta/muse-spark-1.3-contributor
```

If neither transport can answer, the app still works and returns deterministic finance memos from the policy decision.

For persistent transactions and audit logs, run `supabase/schema.sql` in Supabase and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The vendor-risk report runs in demo payment mode by default so the browser demo works without a wallet. To enable the official X402 route wrapper for real payment clients, set:

```bash
X402_MODE=real
X402_RECEIVING_ADDRESS=0xYourReceivingAddress
X402_NETWORK=eip155:84532
X402_VENDOR_REPORT_PRICE=0.42
X402_FACILITATOR_URL=https://facilitator.x402.org
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm run lint
npm run build
npm run evals       # deterministic policy regression (accuracy 1.000, falseApproveRate 0.000)
npm run evals:jev   # Jev gate direction regression + degrade-to-null check
npm run demo:reset  # restore clean seed ledger before a client demo
```

## Deploy

Vercel is the primary public demo (https://agent-pay-ops.vercel.app). A Vultr/Docker path is supported for self-hosting.

Docker build:

```bash
docker build -t agentpayops .
docker run --env-file .env -p 3000:3000 agentpayops
```

Docker Compose:

```bash
cp .env.example .env
docker compose up -d --build
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Vultr/Coolify deployment notes are in `docs/deployment/vultr.md`.
Supabase persistence notes are in `docs/deployment/supabase.md`.

## API Smoke Tests

Protected vendor-risk endpoint returns a payment challenge:

```bash
curl -i http://localhost:3000/api/vendor-risk/report
```

X402 mode/status:

```bash
curl http://localhost:3000/api/x402/status
```

Paid report succeeds with a mock payment proof:

```bash
curl http://localhost:3000/api/vendor-risk/report \
  -H 'x-payment-proof: x402-demo-check'
```

Clean payment attempt:

```bash
curl -X POST http://localhost:3000/api/payments/attempt \
  -H 'content-type: application/json' \
  -d '{"vendorName":"Veritas Risk Graph","category":"vendor-risk-data","amount":0.42,"invoiceId":"INV-2412"}'
```

Invoice analysis:

```bash
curl -X POST http://localhost:3000/api/invoices/analyze \
  -H 'content-type: application/json' \
  -d '{"sampleId":"sample-cloud-escalation"}'
```

Invoice upload:

```bash
curl -X POST http://localhost:3000/api/invoices/upload \
  -F 'invoice=@./demo-files/Invoice_Duplicate_Enrichment.txt'
```

## Next Implementation Steps

1. Record the demo video with the Vultr URL as the primary deployment.
2. Add team-specific policy editing if time allows.
3. Replace demo X402 mode with real settlement once an X402-capable client is available.
