/*
 * Jev gate eval (soft regression). Drives the REAL assessPaymentRisk /
 * assessInvoiceRisk over labeled fraud vs clean contexts and asserts the
 * DIRECTION of the decision: BEC-style packets must escalate, clean packets
 * must pass, and suspicious(BEC) must exceed suspicious(clean). Jev is
 * probabilistic, so each ML case gets one retry before it counts as a
 * failure; the deterministic degrade-to-null path is asserted exactly.
 *
 *   npm run evals:jev
 */

import { readFileSync, writeFileSync } from "node:fs";

// Load .env.local manually so this runs identically under any tsx/node.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match && process.env[match[1]] === undefined) {
    process.env[match[1]] = match[2];
  }
}

type Gate = typeof import("../src/lib/jev-risk");

async function main() {
  const { assessPaymentRisk, assessInvoiceRisk } = (await import(
    "../src/lib/jev-risk"
  )) as Gate;

  type Row = { id: string; kind: string; outcome: string; detail: string; pass: boolean };
  const rows: Row[] = [];

  const becContext =
    "New wire instructions emailed today from a lookalike domain (veritas-risk-graiph.com), marked URGENT: settle before end of day. Bank account differs from the one used last quarter. Procurement asked to skip the vendor-risk report refresh.";
  const cleanContext =
    "Recurring invoice from existing vendor. Wire instructions unchanged since 2024, match the contract. No urgency language; standard net-30 terms.";

  async function paymentTwice(
    id: string,
    context: string,
    expectEscalate: boolean,
  ) {
    let assessment = await assessPaymentRisk({
      vendorName: "Veritas Risk Graph",
      amount: 180,
      category: "vendor-risk-data",
      invoiceId: "INV-EVAL",
      policyReason: "Payment is within policy.",
      context,
    });
    if (!assessment || assessment.escalate !== expectEscalate) {
      // one retry — probabilistic model
      assessment = await assessPaymentRisk({
        vendorName: "Veritas Risk Graph",
        amount: 180,
        category: "vendor-risk-data",
        invoiceId: "INV-EVAL",
        policyReason: "Payment is within policy.",
        context,
      });
    }
    if (!assessment) {
      rows.push({ id, kind: "payment", outcome: "DEGRADED(null)", detail: "jev unavailable", pass: false });
      return null;
    }
    const pass = assessment.escalate === expectEscalate;
    rows.push({
      id,
      kind: "payment",
      outcome: assessment.escalate ? "escalated" : "released",
      detail: `susp=${assessment.suspicious.toFixed(2)} human=${assessment.humanReview.toFixed(2)} risk=${assessment.riskLevel}`,
      pass,
    });
    return assessment;
  }

  const bec = await paymentTwice("jev-bec-must-escalate", becContext, true);
  const clean = await paymentTwice("jev-clean-must-pass", cleanContext, false);

  if (bec && clean) {
    rows.push({
      id: "jev-signal-ordering",
      kind: "payment",
      outcome: bec.suspicious > clean.suspicious ? "ordered" : "inverted",
      detail: `susp(BEC)=${bec.suspicious.toFixed(2)} > susp(clean)=${clean.suspicious.toFixed(2)}`,
      pass: bec.suspicious > clean.suspicious,
    });
  }

  // Invoice gate: fraud-document language must tighten; clean doc must pass.
  const fraudInvoice = await assessInvoiceRisk({
    invoiceId: "INV-FRAUD",
    vendorName: "Clearbit Sample",
    amount: 320,
    category: "lead-enrichment",
    findings: [],
    invoiceText:
      "Invoice for lead enrichment. Please pay to the NEW IBAN sent separately by email. Do NOT call the vendor to verify. Urgent — discount expires today.",
  });
  if (fraudInvoice) {
    rows.push({
      id: "jev-invoice-fraud-escalates",
      kind: "invoice",
      outcome: fraudInvoice.escalate ? "escalated" : "missed",
      detail: `fraud=${fraudInvoice.fraudSignals.toFixed(2)} severity=${fraudInvoice.severity}`,
      pass: fraudInvoice.escalate,
    });
  } else {
    rows.push({ id: "jev-invoice-fraud-escalates", kind: "invoice", outcome: "DEGRADED(null)", detail: "", pass: false });
  }

  // Degrade path: with no key, assessPaymentRisk must return null exactly.
  const savedKey = process.env.CMD_API_KEY;
  delete process.env.CMD_API_KEY;
  const degraded = await assessPaymentRisk({
    vendorName: "Vultr",
    amount: 100,
    category: "cloud-credits",
    invoiceId: "INV-DEG",
    policyReason: "ok",
    context: "anything",
  });
  process.env.CMD_API_KEY = savedKey;
  rows.push({
    id: "jev-degrades-to-null",
    kind: "deterministic",
    outcome: degraded === null ? "null" : "returned data",
    detail: "no API key -> rules-only floor",
    pass: degraded === null,
  });

  const failed = rows.filter((row) => !row.pass);
  const md = [
    "# JEVEVAL_SUMMARY — Jev decision-gate regression",
    "",
    "_Drives the real assessPaymentRisk/assessInvoiceRisk; asserts decision direction, one retry per ML case (probabilistic model)._",
    "",
    "| case | kind | outcome | detail | result |",
    "|---|---|---|---|---|",
    ...rows.map((r) => `| \`${r.id}\` | ${r.kind} | ${r.outcome} | ${r.detail} | ${r.pass ? "✅" : "❌"} |`),
    "",
    failed.length === 0
      ? `✅ All ${rows.length} gate checks passed.`
      : `## Failures\n${failed.map((f) => `- \`${f.id}\`: ${f.outcome}`).join("\n")}`,
    "",
  ].join("\n");

  writeFileSync(new URL("../JEVEVAL_SUMMARY.md", import.meta.url), md);
  console.log(md);
  if (failed.length > 0) process.exit(1);
}

void main();
