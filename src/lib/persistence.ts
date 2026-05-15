import type { FinanceMemo } from "./finance-memo";
import {
  auditEvents,
  transactions,
  type AuditEvent,
  type Decision,
  type DemoScenario,
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
