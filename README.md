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
- Mock X402-style protected endpoint
- API routes for invoice analysis, policy evaluation, payment attempt, vendor-risk report, and audit data
- Invoice intake UI with sample invoices, extracted fields, risk findings, and required paid-data callouts
- Interactive scenario runner for approved, escalated, and blocked agent payments
- Live transaction and audit log updates when an agent scenario completes
- AI finance memo route with Gemini support and deterministic fallback
- Dockerfile and Docker Compose configuration for Vultr/Coolify deployment
- Health endpoint at `/api/health`

## Environment

Copy `.env.example` to `.env.local` when you want live AI reasoning.

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
```

If no Gemini key is present, the app still works and returns deterministic finance memos from the policy decision.

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
```

## Deploy

Vercel is useful for quick previews, but the final Vultr award submission should run on a Vultr VM.

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

## API Smoke Tests

Protected vendor-risk endpoint returns a payment challenge:

```bash
curl -i http://localhost:3000/api/vendor-risk/report
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

## Next Implementation Steps

1. Persist invoices, transactions, policies, and audit events with Supabase or a Vultr-hosted Postgres database.
2. Replace the mock payment proof with the real X402 integration.
3. Add document upload support for PDF/image invoices.
4. Deploy the production container on Vultr and record the demo video.
