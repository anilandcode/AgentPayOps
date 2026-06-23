# ROLE_ALIGNMENT — AgentPayOps

The control plane for agentic spending: as AI agents start paying for things autonomously
(x402), AgentPayOps reviews each payment against policy and routes **approve / escalate / block**
— with an audit trail and a human in the loop. It never moves money on its own.

## Forward Deployed AI Engineer ★ (Palantir, Scale AI, OpenAI, Salesforce)
- Business-critical, messy operational problem (autonomous spend governance) with **production
  auditability** and a **policy engine measured by evals** — `npm run evals` reports a confusion
  matrix + **falseApproveRate** (a risky payment wrongly approved) that must read 0.
- Guardrail posture: the agent decides and routes; humans approve. Money never moves autonomously
  past the threshold.

## AI Solutions Architect (OpenAI, Deloitte, AWS)
- Policy-as-data (`policies` with category caps, allow/deny vendors, approval thresholds),
  x402 payment integration, and an audit log — governance architecture, not a prompt.

## AI Product Engineer (Productboard, Databricks)
- Full-stack Next.js + Supabase + Gemini, with a pure, testable decision core (`evaluatePayment`).

## Proof
- `npm run evals` → `EVAL_SUMMARY.md` (accuracy + falseApproveRate over labeled scenarios,
  driving the real `src/lib/policy-engine.ts`). Mirrors the Litmus harness
  (github.com/anilandcode/litmus).
