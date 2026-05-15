import { policies, transactions, type Decision, type Transaction } from "./sample-data";

export type PaymentRequest = {
  vendorName: string;
  amount: number;
  category: string;
  invoiceId?: string;
  existingTransactions?: Transaction[];
};

export type PolicyEvaluation = {
  decision: Decision;
  policyId: string | null;
  reason: string;
  checks: {
    label: string;
    passed: boolean;
  }[];
};

export function evaluatePayment(request: PaymentRequest): PolicyEvaluation {
  const policy = policies.find(
    (candidate) => candidate.enabled && candidate.category === request.category,
  );

  if (!policy) {
    return {
      decision: "escalated",
      policyId: null,
      reason: "No enabled policy exists for this payment category.",
      checks: [
        {
          label: "Category has an enabled policy",
          passed: false,
        },
      ],
    };
  }

  const vendorAllowed =
    policy.allowedVendors.length === 0 ||
    policy.allowedVendors.includes(request.vendorName);
  const vendorBlocked = policy.blockedVendors.includes(request.vendorName);
  const belowMaxAmount = request.amount <= policy.maxAmount;
  const needsApproval = request.amount > policy.approvalRequiredAbove;
  const existingTransactions = request.existingTransactions ?? transactions;
  const duplicatePurchase = existingTransactions.some(
    (transaction) =>
      transaction.vendorName === request.vendorName &&
      transaction.category === request.category &&
      transaction.status === "approved",
  );

  const checks = [
    { label: "Vendor is not blocked", passed: !vendorBlocked },
    { label: "Vendor is approved for this category", passed: vendorAllowed },
    { label: "Amount is under policy maximum", passed: belowMaxAmount },
    { label: "No duplicate approved purchase exists", passed: !duplicatePurchase },
    { label: "Amount is under autonomous approval threshold", passed: !needsApproval },
  ];

  if (vendorBlocked) {
    return {
      decision: "blocked",
      policyId: policy.id,
      reason: `${request.vendorName} is blocked for ${request.category}.`,
      checks,
    };
  }

  if (!vendorAllowed) {
    return {
      decision: "blocked",
      policyId: policy.id,
      reason: `${request.vendorName} is not on the allowlist for ${request.category}.`,
      checks,
    };
  }

  if (!belowMaxAmount) {
    return {
      decision: "blocked",
      policyId: policy.id,
      reason: `Payment exceeds the ${policy.maxAmount} policy maximum.`,
      checks,
    };
  }

  if (duplicatePurchase) {
    return {
      decision: "blocked",
      policyId: policy.id,
      reason: "A matching paid data purchase already exists in the transaction log.",
      checks,
    };
  }

  if (needsApproval) {
    return {
      decision: "escalated",
      policyId: policy.id,
      reason: `Payment exceeds the ${policy.approvalRequiredAbove} autonomous approval threshold.`,
      checks,
    };
  }

  return {
    decision: "approved",
    policyId: policy.id,
    reason: "Payment is within policy, vendor, category, and duplicate controls.",
    checks,
  };
}
