# AgentPayOps Demo Script

Use the Vultr URL as the primary demo URL:

```text
http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/
```

## 90-Second Walkthrough

1. Open the dashboard and state the problem: autonomous agents will buy data, tools, and compute, but finance needs spend controls before agents can issue payments.
2. In Invoice Intake, select or upload an invoice and run analysis. Point out extracted vendor, amount, category, risk score, and required paid-data purchase.
3. In the X402 Payment Simulation panel, explain that the vendor-risk endpoint returns `402 Payment Required` until the agent is allowed to pay.
4. Run the approved vendor-risk scenario. Show the policy check, payment reference, vendor-risk report, Gemini memo, and new audit entry.
5. Run the high-value cloud invoice scenario. Show that it escalates instead of paying automatically.
6. Run the duplicate enrichment scenario. Show that persistence catches the duplicate or blocked-vendor pattern and stops the payment.
7. Open the audit/transaction area and state that Supabase is the system of record for agent decisions, payment references, and reasoning.
8. Close with deployment: the app is a production-style web agent deployed on Vultr, backed by Supabase, Gemini, and X402-ready payment controls.

## Verification URLs

```bash
curl http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/api/health
curl http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/api/audit
curl http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/api/x402/status
curl -i http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/api/vendor-risk/report
```

## Submission Points

- GitHub repository includes setup, Docker deployment, Supabase schema, and Vultr notes.
- Vultr hosts the primary public demo URL.
- Gemini generates finance reasoning when configured.
- Supabase persists completed runs, transactions, and audit events.
- X402 is demo-safe by default and can be switched to real settlement with environment variables.
