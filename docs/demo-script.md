# AgentPayOps Demo Script

Primary demo URL:

```text
https://agent-pay-ops.vercel.app/
```

Before the demo:

```bash
npm run demo:reset   # restores the clean seed ledger with TX-9002 awaiting human approval
```

## 5-Minute Client Walkthrough

1. **Open the dashboard.** State the problem: autonomous agents will buy data,
   tools, and compute — finance needs controls before agents may issue payments.
   Point at the header metrics (spend reviewed, blocked spend, savings,
   pending approvals — live from the database, not hardcoded).
2. **Invoice Intake.** Upload `demo-files/Invoice_Blocked_Vendor.txt` →
   Command Code extracts fields, rules block the vendor. Upload a clean
   invoice with pressure language ("new IBAN, don't call to verify, urgent")
   and show the **Jev document gate** tightening an approved recommendation
   to human review.
3. **X402 panel.** The vendor-risk endpoint returns `402 Payment Required`
   until policy allows the agent to pay — the machine-to-machine money path.
4. **Live Agent Run — "Fraud review passes policy (Jev gate)".** Every
   deterministic rule passes (allowlisted vendor, small amount, no duplicate),
   but the packet is a business-email-compromise: lookalike domain, changed
   wire instructions, manufactured urgency. Jev escalates at ~98% fraud
   probability in ~1 second for a fraction of a cent. This is the beat that
   sells the architecture.
5. **Human Approval Queue.** The escalated payment is sitting in the queue
   (plus TX-9002 from the seed). Add a note, press **Release payment** —
   the transaction flips to `released`, a human actor appears in the audit
   trail, and the header metrics update live. Rule: ML and agents can only
   tighten; only a human releases funds.
6. **Run the duplicate scenario twice.** The second run is blocked against
   the first — proof Supabase is the system of record.
7. **Payment Controls.** Edit the cloud approval threshold live (e.g. 10k →
   4k), re-run the €12.6k scenario — decision changes with no redeploy.
   Restore the threshold afterwards.
8. **Audit export.** Hit **CSV / JSON** on the decision trail: the full
   ledger, including who among the humans decided what. This is what
   compliance signs off on.
9. **Close with the stack:** deterministic policy floor → Jev (typesafe/jev)
   System One gates that only tighten → Command Code LLM memos
   (stealth/space-bunny-alpha chain) → X402-ready payment rails → Supabase
   audit ledger. Cost meter under every run shows real token spend.

## Verification URLs

```bash
curl https://agent-pay-ops.vercel.app/api/health
curl https://agent-pay-ops.vercel.app/api/audit
curl https://agent-pay-ops.vercel.app/api/policies
curl -i https://agent-pay-ops.vercel.app/api/vendor-risk/report
curl "https://agent-pay-ops.vercel.app/api/audit/export?format=csv"
```

## Demo File Expectations

```text
Invoice_Standard_Data.txt            -> approved
Invoice_HighValue_Compute.txt        -> escalated
Invoice_High_Limit_Cloud.txt.txt     -> escalated
Invoice_Blocked_Vendor.txt           -> blocked (rules)
Invoice_Duplicate_Enrichment.txt     -> blocked (duplicate)
any invoice + fraud language         -> Jev tightens to escalated
```

## Regression Gates

```bash
npm run evals       # deterministic policy: accuracy 1.000, falseApproveRate 0.000
npm run evals:jev   # Jev gate direction checks + degrade-to-null
```

## Submission Points

- GitHub repository includes setup, Docker deployment, Supabase schema, and Vultr notes.
- Vercel is the primary public demo URL; Vultr/Docker path documented in `docs/deployment/vultr.md`.
- Command Code generates finance reasoning and invoice vision extraction when configured.
- Jev (typesafe/jev) gates rule-approved payments/invoices and can only escalate.
- Humans release or cancel escalated payments through the approval queue; every decision lands in the audit ledger with actor type.
- Supabase persists runs, transactions, audit events, and editable policies.
- X402 is demo-safe by default and can be switched to real settlement with environment variables.
