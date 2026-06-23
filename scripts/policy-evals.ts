import { writeFileSync } from "node:fs";
import { evaluatePayment, type PaymentRequest } from "../src/lib/policy-engine";
import type { Decision, Transaction } from "../src/lib/sample-data";

/*
 * Policy-engine eval. Drives the REAL evaluatePayment() over a labeled scenario
 * set covering every decision branch (approve / escalate / block), and reports a
 * confusion matrix + the costliest error — falseApproveRate (a payment that
 * should be blocked, approved instead). A deterministic policy should score 0
 * false-approves; this is the regression gate that keeps it that way.
 *
 *   npm run evals
 */

type Label = "approved" | "escalated" | "blocked";
type Case = { id: string; req: PaymentRequest; expected: Label };

const dup: Transaction = {
  id: "TX-DUP",
  invoiceId: "INV-DUP",
  agentName: "Test Agent",
  vendorName: "Veritas Risk Graph",
  amount: 100,
  category: "vendor-risk-data",
  status: "approved",
  policyDecision: "seed",
  reason: "seed duplicate",
  x402Reference: "seed",
  createdAt: "2026-05-14T00:00:00Z",
};

const cases: Case[] = [
  { id: "ap-approve-under-threshold", req: { vendorName: "Veritas Risk Graph", amount: 200, category: "vendor-risk-data", existingTransactions: [] }, expected: "approved" },
  { id: "ap-escalate-over-approval", req: { vendorName: "Northstar Data Labs", amount: 300, category: "vendor-risk-data", existingTransactions: [] }, expected: "escalated" },
  { id: "ap-block-over-max", req: { vendorName: "Veritas Risk Graph", amount: 600, category: "vendor-risk-data", existingTransactions: [] }, expected: "blocked" },
  { id: "ap-block-vendor-not-allowed", req: { vendorName: "Shady Vendor LLC", amount: 100, category: "vendor-risk-data", existingTransactions: [] }, expected: "blocked" },
  { id: "ap-block-vendor-blocked", req: { vendorName: "Apex Enrichment API", amount: 100, category: "lead-enrichment", existingTransactions: [] }, expected: "blocked" },
  { id: "ap-escalate-no-policy", req: { vendorName: "Anyone", amount: 100, category: "crypto", existingTransactions: [] }, expected: "escalated" },
  { id: "ap-approve-cloud", req: { vendorName: "Vultr", amount: 5000, category: "cloud-credits", existingTransactions: [] }, expected: "approved" },
  { id: "ap-escalate-cloud-large", req: { vendorName: "Metro Cloud Brokers", amount: 12000, category: "cloud-credits", existingTransactions: [] }, expected: "escalated" },
  { id: "ap-block-cloud-over-max", req: { vendorName: "Vultr", amount: 16000, category: "cloud-credits", existingTransactions: [] }, expected: "blocked" },
  { id: "ap-approve-enrichment", req: { vendorName: "Clearbit Sample", amount: 300, category: "lead-enrichment", existingTransactions: [] }, expected: "approved" },
  { id: "ap-escalate-enrichment-over", req: { vendorName: "PeopleGraph Demo", amount: 500, category: "lead-enrichment", existingTransactions: [] }, expected: "escalated" },
  { id: "ap-block-duplicate", req: { vendorName: "Veritas Risk Graph", amount: 100, category: "vendor-risk-data", existingTransactions: [dup] }, expected: "blocked" },
];

const classes: Label[] = ["approved", "escalated", "blocked"];
const cm: Record<string, Record<string, number>> = {};
for (const a of classes) {
  cm[a] = {};
  for (const p of classes) cm[a][p] = 0;
}

let correct = 0;
const failures: string[] = [];
for (const c of cases) {
  const got = evaluatePayment(c.req).decision as Decision;
  const pred = (got === "pending" ? "escalated" : got) as Label;
  cm[c.expected][pred] += 1;
  if (pred === c.expected) correct += 1;
  else failures.push(`- \`${c.id}\`: expected ${c.expected}, got ${pred}`);
}

const accuracy = correct / cases.length;
const actualBlocked = classes.reduce((s, p) => s + cm["blocked"][p], 0);
const falseApprove = cm["blocked"]["approved"];
const falseApproveRate = actualBlocked ? falseApprove / actualBlocked : 0;

const md = [
  "# EVAL_SUMMARY — AgentPayOps policy engine",
  "",
  `_${cases.length} labeled scenarios · evaluates the real evaluatePayment()_`,
  "",
  `- **accuracy: ${accuracy.toFixed(3)}**`,
  `- **falseApproveRate: ${falseApproveRate.toFixed(3)}**  (a block wrongly approved — must be 0)`,
  "",
  "**Confusion matrix** (rows = expected, cols = predicted)",
  "",
  `| expected ↓ / pred → | ${classes.join(" | ")} |`,
  `|---|${classes.map(() => "---:").join("|")}|`,
  ...classes.map((a) => `| ${a} | ${classes.map((p) => cm[a][p]).join(" | ")} |`),
  "",
  failures.length ? "## Failures\n" + failures.join("\n") : "✅ All scenarios decided as expected — 0 false-approves.",
  "",
].join("\n");

writeFileSync(new URL("../EVAL_SUMMARY.md", import.meta.url), md);
console.log(md);
if (falseApproveRate > 0 || accuracy < 1) process.exit(1);
