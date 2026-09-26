/*
 * Jev risk gates for AgentPayOps.
 *
 * Architecture rule (enterprise pattern): deterministic policy code is the
 * FLOOR — it can block and escalate, and Jev can only ever TIGHTEN an
 * approved decision (approve -> escalate). Jev never auto-approves anything
 * rules rejected, and money never moves on a high probability alone.
 *
 * Jev (typesafe/jev) is a System One model: it takes state + typed
 * questions and returns probabilities in ~1s, ~$0.042/M input tokens.
 * Every gate here degrades to null (rules-only behavior) if the model is
 * unavailable — the product must never break because an ML call failed.
 */

import { askJev, type JevAnswer, type JevResult } from "./jev-client";

export type PaymentRiskAssessment = {
  model: string;
  suspicious: number;
  humanReview: number;
  riskLevel: string;
  riskScore: number;
  escalate: boolean;
  latencyMs: number;
  inputTokens: number;
};

export type InvoiceRiskAssessment = {
  model: string;
  fraudSignals: number;
  severity: string;
  severityScore: number;
  escalate: boolean;
  latencyMs: number;
  inputTokens: number;
};

function suspiciousThreshold(): number {
  return Number(process.env.JEV_SUSPICIOUS_ESCALATE ?? "0.8");
}

function humanReviewThreshold(): number {
  return Number(process.env.JEV_HUMAN_REVIEW_ESCALATE ?? "0.85");
}

function fraudInvoiceThreshold(): number {
  return Number(process.env.JEV_INVOICE_FRAUD_ESCALATE ?? "0.75");
}

function noulOf(result: JevResult, key: string): number | null {
  const answer = result.answers[key] as JevAnswer | undefined;
  return answer && answer.type === "noul" ? answer.noul : null;
}

function scoreOf(result: JevResult, key: string): { label: string; value: number } | null {
  const answer = result.answers[key] as JevAnswer | undefined;
  if (!answer || answer.type !== "score") {
    return null;
  }
  const label = answer.legend[String(Math.round(answer.score))] ?? "unknown";
  return { label, value: answer.score };
}

function choiceOf(result: JevResult, key: string): { choice: string; confidence: number } | null {
  const answer = result.answers[key] as JevAnswer | undefined;
  if (!answer || answer.type !== "choice") {
    return null;
  }
  return { choice: answer.choice, confidence: answer.confidence };
}

/**
 * Gate 1 — payment fraud review. Runs only on rule-approved payments.
 * Catches business-email-compromise / changed-wire-instruction patterns that
 * pass every deterministic check (allowlisted vendor, small amount, no dup).
 */
export async function assessPaymentRisk(input: {
  vendorName: string;
  amount: number;
  category: string;
  invoiceId?: string;
  policyReason: string;
  context?: string;
}): Promise<PaymentRiskAssessment | null> {
  const result = await askJev(
    {
      payment: {
        vendor: input.vendorName,
        amount: input.amount,
        category: input.category,
        invoice_id: input.invoiceId ?? null,
      },
      deterministic_policy: { decision: "approved", reason: input.policyReason },
      transaction_context: input.context || "no additional context provided",
    },
    {
      suspicious: {
        type: "noul",
        instructions:
          "Do these payment details show fraud or social-engineering signals (for example: new or changed wire/bank instructions, lookalike sender domain, manufactured urgency, request to skip verification, first payment to this vendor under pressure) even though the deterministic policy passed?",
      },
      human_review: {
        type: "noul",
        instructions:
          "Should a human finance reviewer approve this payment before funds move?",
      },
      risk: {
        type: "score",
        instructions: "Overall risk of releasing this payment autonomously.",
        criteria: ["routine", "caution", "high-risk"],
      },
      action: {
        type: "choice",
        instructions: "What should the agent do with this payment next?",
        criteria: {
          release: "pay now, no concerns beyond the policy checks already done",
          hold: "keep in queue, watch for more information",
          escalate: "route to a human before any money moves",
        },
      },
    },
    "jev-payment",
  );

  if (!result) {
    return null;
  }

  const suspicious = noulOf(result, "suspicious");
  const humanReview = noulOf(result, "human_review");
  const risk = scoreOf(result, "risk");
  const action = choiceOf(result, "action");

  if (suspicious === null || humanReview === null || risk === null) {
    return null;
  }

  const escalate =
    suspicious >= suspiciousThreshold() ||
    humanReview >= humanReviewThreshold() ||
    action?.choice === "escalate";

  return {
    model: "typesafe/jev",
    suspicious,
    humanReview,
    riskLevel: risk.label,
    riskScore: risk.value,
    escalate,
    latencyMs: result.latencyMs,
    inputTokens: result.usage.input_tokens ?? 0,
  };
}

/**
 * Gate 2 — invoice document triage. Scores freshly-parsed invoice text for
 * fraud signals and severity; can tighten an `approved` recommendation to
 * `escalated` and lifts the displayed risk score. Never downgrades.
 */
export async function assessInvoiceRisk(input: {
  invoiceId: string;
  vendorName: string;
  amount: number;
  category: string;
  findings: string[];
  invoiceText: string;
}): Promise<InvoiceRiskAssessment | null> {
  const result = await askJev(
    {
      invoice: {
        id: input.invoiceId,
        vendor: input.vendorName,
        amount: input.amount,
        category: input.category,
        rule_findings: input.findings,
      },
      document_text: input.invoiceText.slice(0, 4000),
    },
    {
      fraud_signals: {
        type: "noul",
        instructions:
          "Does this invoice show fraud or manipulation signals (altered totals vs line items, changed payment instructions, lookalike vendor name, mismatched bank details, pressure language, duplicate billing pattern)?",
      },
      severity: {
        type: "score",
        instructions: "How severe are the concerns in this invoice document?",
        criteria: ["low", "medium", "high", "critical"],
      },
    },
    "jev-invoice",
  );

  if (!result) {
    return null;
  }

  const fraudSignals = noulOf(result, "fraud_signals");
  const severity = scoreOf(result, "severity");
  if (fraudSignals === null || severity === null) {
    return null;
  }

  return {
    model: "typesafe/jev",
    fraudSignals,
    severity: severity.label,
    severityScore: severity.value,
    escalate: fraudSignals >= fraudInvoiceThreshold(),
    latencyMs: result.latencyMs,
    inputTokens: result.usage.input_tokens ?? 0,
  };
}
