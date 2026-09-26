import type { FinanceMemo } from "./finance-memo";
import {
  auditEvents,
  policies,
  transactions,
  type AuditEvent,
  type Decision,
  type DemoScenario,
  type Policy,
  type Transaction,
} from "./sample-data";
import { createServerSupabaseClient } from "./supabase-server";

type PaymentAttemptRecord = {
  status: Decision;
  paymentIssued: boolean;
  x402Reference?: string;
  evaluation: {
    decision: Decision;
    policyId: string | null;
    reason: string;
    checks: {
      label: string;
      passed: boolean;
    }[];
  };
};

type VendorRiskRecord = {
  report: {
    vendorName: string;
    riskScore: number;
    sanctionsMatch: boolean;
    operatingHistory: string;
    paymentRecommendation: string;
    summary: string;
  };
  paymentReference: string;
};

export type AgentRunRecord = {
  scenario: DemoScenario;
  payment: PaymentAttemptRecord;
  memo: FinanceMemo;
  report: VendorRiskRecord | null;
  completedAt: string;
};

type TransactionRow = {
  id: string;
  invoice_id: string;
  agent_name: string;
  vendor_name: string;
  amount: number;
  category: string;
  status: Decision;
  policy_decision: string;
  reason: string;
  x402_reference: string;
  created_at: string;
  released_at?: string | null;
  decided_by?: string | null;
};

type AuditEventRow = {
  id: string;
  actor_type: AuditEvent["actorType"];
  actor_name: string;
  action: string;
  target: string;
  decision: Decision;
  reasoning: string;
  created_at: string;
};

function formatAuditTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

export function transactionFromRun(result: AgentRunRecord, id?: string): Transaction {
  return {
    id: id ?? `LIVE-${crypto.randomUUID().slice(0, 8)}`,
    invoiceId: result.scenario.invoiceId,
    agentName:
      result.scenario.category === "lead-enrichment"
        ? "Procurement Agent"
        : "Ops Invoice Agent",
    vendorName: result.scenario.vendorName,
    amount: result.scenario.amount,
    category: result.scenario.category,
    status: result.payment.status,
    policyDecision: `${result.payment.evaluation.decision.toUpperCase()} ${
      result.payment.evaluation.policyId
        ? `by ${result.payment.evaluation.policyId}`
        : "without matching policy"
    }`,
    reason: result.payment.evaluation.reason,
    x402Reference:
      result.payment.x402Reference ||
      (result.payment.status === "escalated"
        ? "human-approval-required"
        : "payment-not-issued"),
    createdAt: result.completedAt,
  };
}

export function auditEventFromRun(result: AgentRunRecord, id?: string): AuditEvent {
  return {
    id: id ?? `LIVE-AUD-${crypto.randomUUID().slice(0, 8)}`,
    actorType: "agent",
    actorName:
      result.scenario.category === "lead-enrichment"
        ? "Procurement Agent"
        : "Ops Invoice Agent",
    action: result.memo.headline,
    target: result.scenario.invoiceId,
    decision: result.payment.status,
    reasoning: result.memo.summary,
    createdAt: formatAuditTime(result.completedAt),
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    agentName: row.agent_name,
    vendorName: row.vendor_name,
    amount: row.amount,
    category: row.category,
    status: row.status,
    policyDecision: row.policy_decision,
    reason: row.reason,
    x402Reference: row.x402_reference,
    createdAt: row.created_at,
    releasedAt: row.released_at ?? null,
    decidedBy: row.decided_by ?? null,
  };
}

function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorName: row.actor_name,
    action: row.action,
    target: row.target,
    decision: row.decision,
    reasoning: row.reasoning,
    createdAt: formatAuditTime(row.created_at),
  };
}

export async function getOperationsSnapshot() {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      source: "sample" as const,
      transactions,
      auditEvents,
    };
  }

  const [transactionResult, auditResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (transactionResult.error || auditResult.error) {
    return {
      source: "sample" as const,
      transactions,
      auditEvents,
    };
  }

  return {
    source: "supabase" as const,
    transactions:
      transactionResult.data.length > 0
        ? transactionResult.data.map((row) => mapTransaction(row as TransactionRow))
        : transactions,
    auditEvents:
      auditResult.data.length > 0
        ? auditResult.data.map((row) => mapAuditEvent(row as AuditEventRow))
        : auditEvents,
  };
}

export async function getTransactionsForPolicyEvaluation() {
  const snapshot = await getOperationsSnapshot();
  return snapshot.transactions;
}

export async function saveAgentRun(result: AgentRunRecord) {
  const supabase = createServerSupabaseClient();
  const transaction = transactionFromRun(result);
  const auditEvent = auditEventFromRun(result);

  if (!supabase) {
    return {
      source: "memory" as const,
      transaction,
      auditEvent,
    };
  }

  const runId = crypto.randomUUID();

  const transactionRow: TransactionRow = {
    id: transaction.id,
    invoice_id: transaction.invoiceId,
    agent_name: transaction.agentName,
    vendor_name: transaction.vendorName,
    amount: transaction.amount,
    category: transaction.category,
    status: transaction.status,
    policy_decision: transaction.policyDecision,
    reason: transaction.reason,
    x402_reference: transaction.x402Reference,
    created_at: result.completedAt,
  };

  const auditEventRow: AuditEventRow = {
    id: auditEvent.id,
    actor_type: auditEvent.actorType,
    actor_name: auditEvent.actorName,
    action: auditEvent.action,
    target: auditEvent.target,
    decision: auditEvent.decision,
    reasoning: auditEvent.reasoning,
    created_at: result.completedAt,
  };

  const { error: runError } = await supabase.from("agent_runs").insert({
    id: runId,
    scenario_id: result.scenario.id,
    invoice_id: result.scenario.invoiceId,
    decision: result.payment.status,
    payload: result,
    created_at: result.completedAt,
  });

  const { error: transactionError } = await supabase
    .from("transactions")
    .insert(transactionRow);
  const { error: auditError } = await supabase
    .from("audit_events")
    .insert(auditEventRow);

  if (runError || transactionError || auditError) {
    return {
      source: "memory" as const,
      transaction,
      auditEvent,
      error:
        runError?.message ||
        transactionError?.message ||
        auditError?.message ||
        "Failed to save agent run.",
    };
  }

  return {
    source: "supabase" as const,
    transaction,
    auditEvent,
  };
}

/* ------------------------------------------------------------------ */
/* Human approval queue — releasing or cancelling escalated payments   */
/* ------------------------------------------------------------------ */

export type HumanDecision = "released" | "cancelled";

const memoryLedger = new Map<
  string,
  { status: Decision; reason: string; decidedBy: string; at: string }
>();

export async function recordHumanDecision(input: {
  transactionId: string;
  decision: HumanDecision;
  actorName: string;
  note?: string;
}) {
  const supabase = createServerSupabaseClient();
  const at = new Date().toISOString();
  const paymentIssued = input.decision === "released";
  const reason = paymentIssued
    ? `Human finance approval granted${input.note ? `: ${input.note}` : "."}`
    : `Human finance approval denied${input.note ? `: ${input.note}` : "."}`;

  const auditRow: AuditEventRow = {
    id: `HUMAN-${crypto.randomUUID().slice(0, 8)}`,
    actor_type: "human",
    actor_name: input.actorName,
    action: paymentIssued
      ? "Released escalated payment"
      : "Cancelled escalated payment",
    target: input.transactionId,
    decision: paymentIssued ? "released" : "blocked",
    reasoning: reason,
    created_at: at,
  };

  if (!supabase) {
    const prior = memoryLedger.get(input.transactionId);
    memoryLedger.set(input.transactionId, {
      status: paymentIssued ? "released" : "blocked",
      reason,
      decidedBy: input.actorName,
      at,
    });
    return {
      source: "memory" as const,
      statusChanged: Boolean(prior) || paymentIssued,
      auditEvent: mapAuditEvent(auditRow),
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({
      status: paymentIssued ? "released" : "blocked",
      reason,
      decided_by: input.actorName,
      released_at: paymentIssued ? at : null,
      x402_reference: paymentIssued
        ? `x402-human-${crypto.randomUUID().slice(0, 8)}`
        : "payment-cancelled-by-human",
    })
    .eq("id", input.transactionId)
    .eq("status", "escalated")
    .select("id");

  if (updateError || !updated || updated.length === 0) {
    return {
      source: "supabase" as const,
      error:
        updateError?.message ||
        "Transaction is no longer awaiting human approval.",
    };
  }

  const { error: auditError } = await supabase
    .from("audit_events")
    .insert(auditRow);

  return {
    source: "supabase" as const,
    auditEvent: mapAuditEvent(auditRow),
    auditSaved: !auditError,
  };
}

export async function listPendingApprovals() {
  const snapshot = await getOperationsSnapshot();
  const pending = snapshot.transactions.filter(
    (transaction) => transaction.status === "escalated",
  );
  return snapshot.source === "sample"
    ? pending.filter((t) => !memoryLedger.has(t.id))
    : pending;
}

/* ------------------------------------------------------------------ */
/* Editable payment controls — Supabase `policies` table, static seed  */
/* as fallback so the demo works identically without a database.       */
/* ------------------------------------------------------------------ */

type PolicyRow = {
  id: string;
  name: string;
  category: string;
  max_amount: number;
  approval_required_above: number;
  allowed_vendors: string[];
  blocked_vendors: string[];
  enabled: boolean;
};

function mapPolicyRow(row: PolicyRow): Policy {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    maxAmount: Number(row.max_amount),
    approvalRequiredAbove: Number(row.approval_required_above),
    allowedVendors: Array.isArray(row.allowed_vendors) ? row.allowed_vendors : [],
    blockedVendors: Array.isArray(row.blocked_vendors) ? row.blocked_vendors : [],
    enabled: Boolean(row.enabled),
  };
}

export async function getActivePolicies(): Promise<Policy[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return policies;
  }

  const { data, error } = await supabase.from("policies").select("*");

  if (error || !data || data.length === 0) {
    return policies;
  }

  return (data as PolicyRow[]).map(mapPolicyRow);
}

export async function updatePolicy(
  id: string,
  patchBody: Partial<Omit<Policy, "id">>,
) {
  const supabase = createServerSupabaseClient();

  const row: Record<string, unknown> = {};
  if (patchBody.name !== undefined) row.name = patchBody.name;
  if (patchBody.category !== undefined) row.category = patchBody.category;
  if (patchBody.maxAmount !== undefined) row.max_amount = patchBody.maxAmount;
  if (patchBody.approvalRequiredAbove !== undefined)
    row.approval_required_above = patchBody.approvalRequiredAbove;
  if (patchBody.allowedVendors !== undefined)
    row.allowed_vendors = patchBody.allowedVendors;
  if (patchBody.blockedVendors !== undefined)
    row.blocked_vendors = patchBody.blockedVendors;
  if (patchBody.enabled !== undefined) row.enabled = patchBody.enabled;

  if (Object.keys(row).length === 0) {
    return { source: "noop" as const };
  }

  if (!supabase) {
    return { source: "memory" as const, error: "No database configured." };
  }

  const { data, error } = await supabase
    .from("policies")
    .update(row)
    .eq("id", id)
    .select("*");

  if (error) {
    return { source: "supabase" as const, error: error.message };
  }

  if (!data || data.length === 0) {
    return { source: "supabase" as const, error: `Policy ${id} not found.` };
  }

  return { source: "supabase" as const, policy: mapPolicyRow(data[0] as PolicyRow) };
}
