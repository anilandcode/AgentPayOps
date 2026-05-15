import {
  invoiceAnalyses,
  invoiceSamples,
  type Decision,
  type InvoiceAnalysis,
} from "@/lib/sample-data";

type ParsedInvoiceFields = {
  invoiceId: string;
  vendorName: string;
  amount: number;
  currency: "EUR" | "USD";
  dueDate: string;
  category: string;
  notes: string;
};

export function inferSampleId(invoiceText: string) {
  const normalized = invoiceText.toLowerCase();

  if (normalized.includes("apex enrichment")) {
    return "sample-duplicate-enrichment";
  }

  if (normalized.includes("metro cloud")) {
    return "sample-cloud-escalation";
  }

  return "sample-vendor-risk";
}

export function analyzeInvoiceText(invoiceText: string, sampleId?: string): InvoiceAnalysis {
  if (sampleId && invoiceAnalyses[sampleId]) {
    return invoiceAnalyses[sampleId];
  }

  const inferredSampleId = inferSampleId(invoiceText || invoiceSamples[0].invoiceText);
  const parsed = parseInvoiceFields(invoiceText);

  if (!parsed) {
    return invoiceAnalyses[inferredSampleId];
  }

  return buildAnalysis(parsed);
}

export function buildUploadedFallbackAnalysis(fileName: string, mimeType: string): InvoiceAnalysis {
  const readableName = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const vendorName = readableName || "Uploaded Vendor";

  return {
    invoiceId: `UP-${Date.now().toString().slice(-6)}`,
    vendorName,
    amount: 4820,
    currency: "EUR",
    dueDate: "Pending extraction",
    category: "vendor-risk-data",
    riskScore: 42,
    recommendation: "pending",
    summary:
      "Document was received, but structured extraction requires text content or Gemini multimodal extraction.",
    findings: [
      `Uploaded file type: ${mimeType || "unknown"}.`,
      "Manual review is required before an agent can issue payment.",
      "A paid vendor-risk report should be attached before final approval.",
    ],
    requiredDataPurchase: {
      vendorName,
      amount: 0.42,
      category: "vendor-risk-data",
      reason: "Confirm sanctions, operating history, and payment risk.",
    },
  };
}

function parseInvoiceFields(invoiceText: string): ParsedInvoiceFields | null {
  const normalized = invoiceText.trim();

  if (!normalized) {
    return null;
  }

  const invoiceId =
    matchFirst(normalized, /invoice\s*[:#]?\s*([A-Z]{2,}-[\w-]+)/i) ||
    matchFirst(normalized, /\b(INV-[\w-]+)\b/i) ||
    `INV-${Date.now().toString().slice(-6)}`;
  const vendorName =
    matchFirst(normalized, /vendor\s*:\s*(.+)/i) ||
    matchFirst(normalized, /supplier\s*:\s*(.+)/i) ||
    "Uploaded Vendor";
  const amountMatch = normalized.match(
    /(?:amount|total|balance due)\s*:\s*(EUR|USD|€|\$)?\s*([\d,]+(?:\.\d+)?)/i,
  );
  const amount = amountMatch ? Number(amountMatch[2].replace(/,/g, "")) : 0;
  const currency = inferCurrency(normalized, amountMatch?.[1]);
  const dueDate =
    matchFirst(normalized, /due\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) ||
    matchFirst(normalized, /due date\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i) ||
    "Pending extraction";
  const category = (
    matchFirst(normalized, /category\s*:\s*([a-z0-9-]+)/i) ||
    inferCategory(normalized)
  ).toLowerCase();

  return {
    invoiceId,
    vendorName: vendorName.trim(),
    amount,
    currency,
    dueDate,
    category,
    notes: normalized,
  };
}

function buildAnalysis(fields: ParsedInvoiceFields): InvoiceAnalysis {
  const decision = inferDecision(fields);
  const riskScore = inferRiskScore(fields, decision);
  const requiredDataPurchase =
    fields.category === "vendor-risk-data" || fields.notes.toLowerCase().includes("new vendor")
      ? {
          vendorName: fields.vendorName,
          amount: 0.42,
          category: "vendor-risk-data",
          reason: "Confirm sanctions, operating history, and payment risk.",
        }
      : undefined;

  return {
    invoiceId: fields.invoiceId,
    vendorName: fields.vendorName,
    amount: fields.amount,
    currency: fields.currency,
    dueDate: fields.dueDate,
    category: fields.category,
    riskScore,
    recommendation: decision,
    summary: buildSummary(fields, decision),
    findings: buildFindings(fields, decision, Boolean(requiredDataPurchase)),
    requiredDataPurchase,
  };
}

function inferDecision(fields: ParsedInvoiceFields): Decision {
  const normalized = `${fields.vendorName} ${fields.category} ${fields.notes}`.toLowerCase();

  if (normalized.includes("apex enrichment") || normalized.includes("duplicate")) {
    return "blocked";
  }

  if (fields.amount >= 10000 || normalized.includes("purchase order not found")) {
    return "escalated";
  }

  return "approved";
}

function inferRiskScore(fields: ParsedInvoiceFields, decision: Decision) {
  if (decision === "blocked") {
    return 84;
  }

  if (decision === "escalated") {
    return 67;
  }

  return fields.notes.toLowerCase().includes("new vendor") ? 31 : 28;
}

function buildSummary(fields: ParsedInvoiceFields, decision: Decision) {
  if (decision === "blocked") {
    return `${fields.vendorName} should not be paid automatically because the invoice matches blocked or duplicate-purchase controls.`;
  }

  if (decision === "escalated") {
    return `${fields.vendorName} requires finance approval before payment because the invoice exceeds the autonomous approval threshold or lacks purchase-order confidence.`;
  }

  return `${fields.vendorName} is eligible for autonomous processing after required risk data is attached to the invoice packet.`;
}

function buildFindings(fields: ParsedInvoiceFields, decision: Decision, needsPaidData: boolean) {
  if (decision === "blocked") {
    return [
      "Blocked vendor or duplicate data-purchase pattern detected.",
      "Agent retry behavior should be stopped and logged.",
      "Human override is required before any payment attempt.",
    ];
  }

  if (decision === "escalated") {
    return [
      `${fields.currency} ${fields.amount.toLocaleString()} is above the autonomous approval threshold.`,
      "Finance approval is required before funds are issued.",
      "The agent can prepare the audit packet but should not complete payment.",
    ];
  }

  return [
    "Invoice amount is within autonomous processing range.",
    needsPaidData
      ? "A paid vendor-risk report is required before final approval."
      : "No blocking policy signal was found.",
    "Structured fields are ready for policy evaluation.",
  ];
}

function inferCurrency(invoiceText: string, token?: string): "EUR" | "USD" {
  if (token === "USD" || token === "$" || invoiceText.includes("USD")) {
    return "USD";
  }

  return "EUR";
}

function inferCategory(invoiceText: string) {
  const normalized = invoiceText.toLowerCase();

  if (normalized.includes("cloud")) {
    return "cloud-credits";
  }

  if (normalized.includes("enrichment")) {
    return "lead-enrichment";
  }

  return "vendor-risk-data";
}

function matchFirst(input: string, regex: RegExp) {
  return input.match(regex)?.[1]?.trim();
}
