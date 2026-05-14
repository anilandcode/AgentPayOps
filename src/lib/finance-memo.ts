import type { Decision } from "./sample-data";

export type FinanceMemoInput = {
  vendorName: string;
  amount: number;
  category: string;
  invoiceId?: string;
  decision: Decision;
  reason: string;
  checks: {
    label: string;
    passed: boolean;
  }[];
};

export type FinanceMemo = {
  source: "gemini" | "deterministic-fallback";
  headline: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  nextAction: string;
  evidence: string[];
};

export function buildFallbackMemo(input: FinanceMemoInput): FinanceMemo {
  const failedChecks = input.checks.filter((check) => !check.passed);
  const passedChecks = input.checks.filter((check) => check.passed);

  if (input.decision === "approved") {
    return {
      source: "deterministic-fallback",
      headline: "Autonomous payment approved within finance policy",
      summary: `${input.vendorName} can be paid because the requested ${input.category} purchase is within configured limits and no blocking risk signal was found.`,
      riskLevel: "low",
      nextAction:
        "Attach the paid report to the invoice packet and preserve the payment proof in the audit log.",
      evidence: passedChecks.map((check) => check.label),
    };
  }

  if (input.decision === "escalated") {
    return {
      source: "deterministic-fallback",
      headline: "Human approval required before payment",
      summary: `${input.vendorName} is not automatically blocked, but the agent should not issue funds because ${input.reason.toLowerCase()}`,
      riskLevel: "medium",
      nextAction:
        "Route the invoice to finance with policy context and keep the agent from retrying payment until approval is recorded.",
      evidence:
        failedChecks.length > 0
          ? failedChecks.map((check) => check.label)
          : [input.reason],
    };
  }

  return {
    source: "deterministic-fallback",
    headline: "Payment blocked before funds were issued",
    summary: `${input.vendorName} should not be paid by the agent because ${input.reason.toLowerCase()}`,
    riskLevel: "high",
    nextAction:
      "Stop the payment attempt, keep the failed policy checks in the audit log, and require a human override for any retry.",
    evidence:
      failedChecks.length > 0
        ? failedChecks.map((check) => check.label)
        : [input.reason],
  };
}
