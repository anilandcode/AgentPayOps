import type { FinanceMemo } from "./finance-memo";
import {
  auditEvents,
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
  const action = result.payment.status === "approved" ? "Policy approved simulated payment" : result.payment.status === "escalated" ? "Sent simulated payment for human review" : "Blocked simulated payment";
  return {
    id: id ?? `LIVE-AUD-${crypto.randomUUID().slice(0, 8)}`,
    actorType: "agent",
    actorName:
      result.scenario.category === "lead-enrichment"
        ? "Procurement Agent"
        : "Ops Invoice Agent",
    action,
    target: result.scenario.invoiceId,
    decision: result.payment.status,
    reasoning: result.payment.evaluation.reason,
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
    createdAt: row.created_at,
  };
}

async function allRows(table: "demo_v2_transactions" | "demo_v2_audit_events") {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;
  const rows: Record<string, unknown>[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false }).range(start, start + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

export async function getOperationsSnapshot() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { source: "sample" as const, transactions, auditEvents };
  const [transactionRows, auditRows] = await Promise.all([
    allRows("demo_v2_transactions"), allRows("demo_v2_audit_events"),
  ]);
  return { source: "supabase" as const,
    transactions: (transactionRows ?? []).map(row => mapTransaction(row as TransactionRow)),
    auditEvents: (auditRows ?? []).map(row => mapAuditEvent(row as AuditEventRow)) };
}

export async function getTransactionsForPolicyEvaluation() {
  const snapshot = await getOperationsSnapshot();
  return snapshot.transactions;
}

export async function beginAgentRun(id: string, scenarioId: string, invoiceId: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Shared demo database is not configured.");
  const { error } = await supabase.from("demo_v2_agent_runs").insert({ id, scenario_id: scenarioId, invoice_id: invoiceId, status: "running" });
  if (error) throw new Error(error.message);
}
export async function failAgentRun(id: string) {
  const supabase = createServerSupabaseClient();
  if (supabase) await supabase.from("demo_v2_agent_runs").update({status:"failed",completed_at:new Date().toISOString()}).eq("id",id).eq("status","running");
}
export async function saveAgentRun(result: AgentRunRecord, runId?: string) {
  const supabase = createServerSupabaseClient();
  if (!supabase || !runId) return {source:"unavailable" as const,error:"Shared demo database or server run ID is unavailable."};
  const transaction = transactionFromRun(result);
  const auditEvent = auditEventFromRun(result);
  const transactionRow = {
    id:transaction.id,invoice_id:transaction.invoiceId,agent_name:transaction.agentName,
    vendor_name:transaction.vendorName,amount:transaction.amount,category:transaction.category,
    status:transaction.status,policy_decision:transaction.policyDecision,reason:transaction.reason,
    x402_reference:transaction.x402Reference,created_at:result.completedAt,
  };
  const auditRow = {
    id:auditEvent.id,actor_type:auditEvent.actorType,actor_name:auditEvent.actorName,
    action:auditEvent.action,target:auditEvent.target,decision:auditEvent.decision,
    reasoning:auditEvent.reasoning,created_at:result.completedAt,
  };
  const {error} = await supabase.rpc("demo_v2_complete_run",{
    p_id:runId,p_decision:result.payment.status,p_payload:result,
    p_transaction:transactionRow,p_audit:auditRow,
  });
  if(error) return {source:"supabase" as const,error:error.message};
  return {source:"supabase" as const,transaction,auditEvent,runId};
}

/* ------------------------------------------------------------------ */
/* Human approval queue — releasing or cancelling escalated payments   */
/* ------------------------------------------------------------------ */

export type HumanDecision = "released" | "cancelled";

export async function recordHumanDecision(input: {
  transactionId:string;decision:HumanDecision;actorName:string;note?:string;
}) {
  const supabase = createServerSupabaseClient();
  if (!supabase) return {source:"unavailable" as const,error:"Shared demo database is not configured."};
  const {error} = await supabase.rpc("demo_v2_decide_payment",{
    p_id:input.transactionId,p_decision:input.decision,p_actor:input.actorName,p_note:input.note??"",
  });
  if(error) return {source:"supabase" as const,error:error.message};
  return {source:"supabase" as const,statusChanged:true};
}
export async function listPendingApprovals() {
  const snapshot = await getOperationsSnapshot();
  return snapshot.transactions.filter(t=>t.status==="escalated");
}

/* ------------------------------------------------------------------ */
/* Editable payment controls — isolated shared demo policy table.       */
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
  version: number;
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
    version: row.version,
  };
}

export async function getActivePolicies(): Promise<Policy[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Shared demo database is not configured.");
  }

  const { data, error } = await supabase.from("demo_v2_policies").select("*");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Demo policy dataset is empty.");

  return (data as PolicyRow[]).map(mapPolicyRow);
}

export async function updatePolicy(
  id: string,
  patchBody: Partial<Omit<Policy, "id">>,
  expectedVersion: number,
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
    return { source: "unavailable" as const, error: "Shared demo database is not configured." };
  }

  const { data, error } = await supabase
    .from("demo_v2_policies")
    .update({...row,version:expectedVersion+1,updated_at:new Date().toISOString()})
    .eq("id", id)
    .eq("version",expectedVersion)
    .select("*");

  if (error) {
    return { source: "supabase" as const, error: error.message };
  }

  if (!data || data.length === 0) {
    return { source: "supabase" as const, error: `Policy ${id} was changed by another visitor. Refresh and retry.` };
  }

  return { source: "supabase" as const, policy: mapPolicyRow(data[0] as PolicyRow) };
}
