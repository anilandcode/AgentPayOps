export type Decision = "approved" | "blocked" | "escalated" | "pending";

export type Invoice = {
  id: string;
  vendorName: string;
  amount: number;
  currency: "USD" | "EUR";
  dueDate: string;
  category: string;
  status: Decision;
  riskScore: number;
  recommendation: string;
  findings: string[];
};

export type Policy = {
  id: string;
  name: string;
  category: string;
  maxAmount: number;
  approvalRequiredAbove: number;
  allowedVendors: string[];
  blockedVendors: string[];
  enabled: boolean;
};

export type Transaction = {
  id: string;
  invoiceId: string;
  agentName: string;
  vendorName: string;
  amount: number;
  category: string;
  status: Decision;
  policyDecision: string;
  reason: string;
  x402Reference: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  actorType: "agent" | "policy" | "human" | "payment";
  actorName: string;
  action: string;
  target: string;
  decision: Decision;
  reasoning: string;
  createdAt: string;
};

export type DemoScenario = {
  id: string;
  name: string;
  description: string;
  invoiceId: string;
  vendorName: string;
  amount: number;
  category: string;
  expectedDecision: Decision;
};

export type InvoiceSample = {
  id: string;
  label: string;
  invoiceText: string;
};

export type InvoiceAnalysis = {
  invoiceId: string;
  vendorName: string;
  amount: number;
  currency: "EUR" | "USD";
  dueDate: string;
  category: string;
  riskScore: number;
  recommendation: Decision;
  summary: string;
  findings: string[];
  requiredDataPurchase?: {
    vendorName: string;
    amount: number;
    category: string;
    reason: string;
  };
};

export const invoiceSamples: InvoiceSample[] = [
  {
    id: "sample-vendor-risk",
    label: "New vendor needs risk report",
    invoiceText: `Invoice INV-2412
Vendor: Veritas Risk Graph
Amount: EUR 4,820.00
Due: 2026-05-24
Category: vendor-risk-data
Line items: Milan market intelligence package and vendor verification data.
Notes: New vendor for the operations team.`,
  },
  {
    id: "sample-cloud-escalation",
    label: "Cloud invoice above approval limit",
    invoiceText: `Invoice INV-2410
Vendor: Metro Cloud Brokers
Amount: EUR 12,600.00
Due: 2026-05-19
Category: cloud-credits
Line items: Cloud credits and managed deployment support.
Notes: Purchase order not found in the sample ledger.`,
  },
  {
    id: "sample-duplicate-enrichment",
    label: "Duplicate enrichment attempt",
    invoiceText: `Invoice INV-2411
Vendor: Apex Enrichment API
Amount: EUR 930.00
Due: 2026-05-22
Category: lead-enrichment
Line items: Repeat customer account enrichment export.
Notes: Same report was bought yesterday by Procurement Agent.`,
  },
];

export const invoiceAnalyses: Record<string, InvoiceAnalysis> = {
  "sample-vendor-risk": {
    invoiceId: "INV-2412",
    vendorName: "Veritas Risk Graph",
    amount: 4820,
    currency: "EUR",
    dueDate: "2026-05-24",
    category: "vendor-risk-data",
    riskScore: 31,
    recommendation: "approved",
    summary:
      "Invoice is payable after the agent purchases one low-cost vendor-risk report and attaches it to the audit packet.",
    findings: [
      "Vendor is new to the finance ledger.",
      "Invoice amount is below the autonomous invoice review threshold.",
      "A paid vendor-risk report is required before final approval.",
    ],
    requiredDataPurchase: {
      vendorName: "Veritas Risk Graph",
      amount: 0.42,
      category: "vendor-risk-data",
      reason: "Confirm sanctions, operating history, and payment risk.",
    },
  },
  "sample-cloud-escalation": {
    invoiceId: "INV-2410",
    vendorName: "Metro Cloud Brokers",
    amount: 12600,
    currency: "EUR",
    dueDate: "2026-05-19",
    category: "cloud-credits",
    riskScore: 67,
    recommendation: "escalated",
    summary:
      "Invoice belongs to an allowed category but must be routed to finance because it exceeds the autonomous approval threshold.",
    findings: [
      "Cloud spend category is allowed.",
      "Amount is above the 10,000 EUR approval threshold.",
      "No matching purchase order was found in the sample ledger.",
    ],
  },
  "sample-duplicate-enrichment": {
    invoiceId: "INV-2411",
    vendorName: "Apex Enrichment API",
    amount: 930,
    currency: "EUR",
    dueDate: "2026-05-22",
    category: "lead-enrichment",
    riskScore: 84,
    recommendation: "blocked",
    summary:
      "Payment should be blocked because the vendor is not allowed for enrichment data and the same report was already purchased.",
    findings: [
      "Blocked vendor for lead-enrichment category.",
      "Duplicate data purchase detected within the last 24 hours.",
      "Agent retry behavior should be stopped and logged.",
    ],
  },
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "approve-vendor-risk",
    name: "Approve paid vendor-risk report",
    description:
      "A new invoice needs a low-cost vendor-risk report before the agent can recommend payment.",
    invoiceId: "INV-2412",
    vendorName: "Veritas Risk Graph",
    amount: 0.42,
    category: "vendor-risk-data",
    expectedDecision: "approved",
  },
  {
    id: "escalate-cloud-invoice",
    name: "Escalate high-value cloud invoice",
    description:
      "A cloud invoice is valid in category but too large for autonomous approval.",
    invoiceId: "INV-2410",
    vendorName: "Metro Cloud Brokers",
    amount: 12600,
    category: "cloud-credits",
    expectedDecision: "escalated",
  },
  {
    id: "block-duplicate-data",
    name: "Block duplicate enrichment purchase",
    description:
      "An agent tries to buy repeat lead-enrichment data from a blocked vendor.",
    invoiceId: "INV-2411",
    vendorName: "Apex Enrichment API",
    amount: 0.18,
    category: "lead-enrichment",
    expectedDecision: "blocked",
  },
];

export const invoices: Invoice[] = [
  {
    id: "INV-2409",
    vendorName: "Northstar Data Labs",
    amount: 4820,
    currency: "EUR",
    dueDate: "2026-05-24",
    category: "vendor-risk-data",
    status: "approved",
    riskScore: 28,
    recommendation:
      "Approve after paid vendor-risk report confirms operating history and no sanctions exposure.",
    findings: [
      "New vendor, but amount is below department approval threshold.",
      "Vendor-risk report was purchased once and attached to this invoice.",
      "Line items match the procurement request for market intelligence.",
    ],
  },
  {
    id: "INV-2410",
    vendorName: "Metro Cloud Brokers",
    amount: 12600,
    currency: "EUR",
    dueDate: "2026-05-19",
    category: "cloud-credits",
    status: "escalated",
    riskScore: 67,
    recommendation:
      "Escalate to finance because invoice amount exceeds the autonomous approval limit.",
    findings: [
      "Spend category is allowed for operations agents.",
      "Amount is above the 10,000 EUR approval threshold.",
      "No matching purchase order was found in the sample ledger.",
    ],
  },
  {
    id: "INV-2411",
    vendorName: "Apex Enrichment API",
    amount: 930,
    currency: "EUR",
    dueDate: "2026-05-22",
    category: "lead-enrichment",
    status: "blocked",
    riskScore: 84,
    recommendation:
      "Block payment because the same report was already purchased in the last 24 hours.",
    findings: [
      "Duplicate data purchase detected for the same customer account list.",
      "Vendor is not on the current allowlist for enrichment data.",
      "Agent attempted repeat purchase after receiving a 402 payment challenge.",
    ],
  },
];

export const policies: Policy[] = [
  {
    id: "POL-001",
    name: "Paid data under 500 EUR",
    category: "vendor-risk-data",
    maxAmount: 500,
    approvalRequiredAbove: 250,
    allowedVendors: ["Northstar Data Labs", "Veritas Risk Graph"],
    blockedVendors: [],
    enabled: true,
  },
  {
    id: "POL-002",
    name: "Cloud spend requires finance approval above 10k",
    category: "cloud-credits",
    maxAmount: 15000,
    approvalRequiredAbove: 10000,
    allowedVendors: ["Vultr", "Metro Cloud Brokers"],
    blockedVendors: [],
    enabled: true,
  },
  {
    id: "POL-003",
    name: "Block duplicate lead enrichment",
    category: "lead-enrichment",
    maxAmount: 1000,
    approvalRequiredAbove: 400,
    allowedVendors: ["Clearbit Sample", "PeopleGraph Demo"],
    blockedVendors: ["Apex Enrichment API"],
    enabled: true,
  },
];

export const transactions: Transaction[] = [
  {
    id: "TX-9001",
    invoiceId: "INV-2409",
    agentName: "Ops Invoice Agent",
    vendorName: "Northstar Data Labs",
    amount: 0.42,
    category: "vendor-risk-data",
    status: "approved",
    policyDecision: "Approved by POL-001",
    reason: "Paid report price is below autonomous data-purchase limit.",
    x402Reference: "x402-demo-5f3a",
    createdAt: "2026-05-14T11:16:00Z",
  },
  {
    id: "TX-9002",
    invoiceId: "INV-2410",
    agentName: "Ops Invoice Agent",
    vendorName: "Metro Cloud Brokers",
    amount: 12600,
    category: "cloud-credits",
    status: "escalated",
    policyDecision: "Escalated by POL-002",
    reason: "Invoice is above the 10,000 EUR finance approval threshold.",
    x402Reference: "manual-approval-required",
    createdAt: "2026-05-14T11:21:00Z",
  },
  {
    id: "TX-9003",
    invoiceId: "INV-2411",
    agentName: "Procurement Agent",
    vendorName: "Apex Enrichment API",
    amount: 0.18,
    category: "lead-enrichment",
    status: "blocked",
    policyDecision: "Blocked by POL-003",
    reason: "Duplicate purchase and vendor blocked by enrichment policy.",
    x402Reference: "payment-not-issued",
    createdAt: "2026-05-14T11:27:00Z",
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "AUD-1001",
    actorType: "agent",
    actorName: "Ops Invoice Agent",
    action: "Requested vendor-risk report",
    target: "INV-2409",
    decision: "pending",
    reasoning:
      "The vendor is new, so the invoice cannot be approved without a risk report.",
    createdAt: "11:15",
  },
  {
    id: "AUD-1002",
    actorType: "payment",
    actorName: "X402 Gateway",
    action: "Returned 402 challenge",
    target: "Northstar Data Labs report",
    decision: "pending",
    reasoning:
      "The vendor-risk endpoint requires a 0.42 EUR programmable payment.",
    createdAt: "11:16",
  },
  {
    id: "AUD-1003",
    actorType: "policy",
    actorName: "Policy Engine",
    action: "Evaluated paid data purchase",
    target: "TX-9001",
    decision: "approved",
    reasoning:
      "Category is allowed, price is below limit, and no duplicate report exists.",
    createdAt: "11:16",
  },
  {
    id: "AUD-1004",
    actorType: "policy",
    actorName: "Policy Engine",
    action: "Evaluated cloud invoice",
    target: "INV-2410",
    decision: "escalated",
    reasoning:
      "Invoice is valid in category but amount requires human finance approval.",
    createdAt: "11:21",
  },
  {
    id: "AUD-1005",
    actorType: "policy",
    actorName: "Policy Engine",
    action: "Blocked repeat data payment",
    target: "TX-9003",
    decision: "blocked",
    reasoning:
      "The same enrichment report was already purchased and the vendor is blocked.",
    createdAt: "11:27",
  },
];

export const dashboardStats = {
  agentSpend: 12600.6,
  blockedSpend: 930.18,
  moneySaved: 930.18,
  pendingApprovals: 1,
};
