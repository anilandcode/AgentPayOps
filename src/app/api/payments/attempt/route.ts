import { evaluatePayment } from "@/lib/policy-engine";
import {
  getActivePolicies,
  getTransactionsForPolicyEvaluation,
} from "@/lib/persistence";
import { assessPaymentRisk, type PaymentRiskAssessment } from "@/lib/jev-risk";

export const maxDuration = 30;

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    vendorName?: string;
    amount?: number;
    category?: string;
    invoiceId?: string;
    context?: string;
  };

  if (!payload.vendorName || !payload.category || typeof payload.amount !== "number") {
    return Response.json(
      {
        error:
          "vendorName, category, and numeric amount are required to attempt payment.",
      },
      { status: 400 },
    );
  }

  const [existingTransactions, activePolicies] = await Promise.all([
    getTransactionsForPolicyEvaluation(),
    getActivePolicies(),
  ]);
  const evaluation = evaluatePayment({
    vendorName: payload.vendorName,
    category: payload.category,
    amount: payload.amount,
    invoiceId: payload.invoiceId,
    existingTransactions,
    policySet: activePolicies,
  });

  // Jev System One gate: rules are the floor. Jev may only tighten an
  // approved decision (approve -> escalate); it never approves anything the
  // rules rejected and never releases funds on its own.
  let riskAssessment: PaymentRiskAssessment | null = null;

  if (evaluation.decision === "approved") {
    riskAssessment = await assessPaymentRisk({
      vendorName: payload.vendorName,
      amount: payload.amount,
      category: payload.category,
      invoiceId: payload.invoiceId,
      policyReason: evaluation.reason,
      context: payload.context,
    });

    if (riskAssessment?.escalate) {
      evaluation.decision = "escalated";
      evaluation.reason =
        `Jev flagged fraud/social-engineering signals the policy rules cannot see ` +
        `(suspicious ${riskAssessment.suspicious.toFixed(2)}, human-review ` +
        `${riskAssessment.humanReview.toFixed(2)}, risk ${riskAssessment.riskLevel}).`;
      evaluation.checks = [
        ...evaluation.checks,
        {
          label: "Jev fraud review passes",
          passed: false,
        },
      ];
    } else if (riskAssessment) {
      evaluation.checks = [
        ...evaluation.checks,
        {
          label: `Jev fraud review passes (${riskAssessment.riskLevel} risk)`,
          passed: true,
        },
      ];
    }
  }

  if (evaluation.decision !== "approved") {
    return Response.json({
      status: evaluation.decision,
      paymentIssued: false,
      evaluation,
      jev: riskAssessment
        ? {
            model: riskAssessment.model,
            suspicious: riskAssessment.suspicious,
            humanReview: riskAssessment.humanReview,
            riskLevel: riskAssessment.riskLevel,
            escalated: riskAssessment.escalate,
            latencyMs: riskAssessment.latencyMs,
          }
        : null,
    });
  }

  return Response.json({
    status: "approved",
    paymentIssued: true,
    x402Reference: `x402-demo-${crypto.randomUUID().slice(0, 8)}`,
    evaluation,
    jev: riskAssessment
      ? {
          model: riskAssessment.model,
          suspicious: riskAssessment.suspicious,
          humanReview: riskAssessment.humanReview,
          riskLevel: riskAssessment.riskLevel,
          escalated: riskAssessment.escalate,
          latencyMs: riskAssessment.latencyMs,
        }
      : null,
  });
}
