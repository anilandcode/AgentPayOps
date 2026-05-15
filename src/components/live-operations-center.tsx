"use client";

import { FileSearch, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AgentWorkflow,
  type WorkflowRunResult,
} from "@/components/agent-workflow";
import {
  auditEvents,
  transactions,
  type AuditEvent,
  type Decision,
  type Transaction,
} from "@/lib/sample-data";

const statusStyles: Record<Decision, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  escalated: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function StatusPill({ status }: { status: Decision }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function buildTransaction(result: WorkflowRunResult, runNumber: number): Transaction {
  return {
    id: `LIVE-${String(runNumber).padStart(3, "0")}`,
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

function buildAuditEvent(result: WorkflowRunResult, runNumber: number): AuditEvent {
  return {
    id: `LIVE-AUD-${String(runNumber).padStart(3, "0")}`,
    actorType: "agent",
    actorName:
      result.scenario.category === "lead-enrichment"
        ? "Procurement Agent"
        : "Ops Invoice Agent",
    action: result.memo.headline,
    target: result.scenario.invoiceId,
    decision: result.payment.status,
    reasoning: result.memo.summary,
    createdAt: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(result.completedAt)),
  };
}

function LiveTransactionTable({
  rows,
  source,
}: {
  rows: Transaction[];
  source: "sample" | "supabase";
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Transactions
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Agent payment attempts
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
          <PlusCircle className="size-4" />
          {source === "supabase" ? "Database backed" : "Demo data active"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Agent</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((transaction) => (
              <tr
                className={transaction.id.startsWith("LIVE") ? "bg-cyan-50/40" : ""}
                key={transaction.id}
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-950">
                    {transaction.id}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    {transaction.x402Reference}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {transaction.agentName}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {transaction.vendorName}
                </td>
                <td className="px-5 py-4 font-medium text-slate-950">
                  {currency.format(transaction.amount)}
                </td>
                <td className="px-5 py-4">
                  <StatusPill status={transaction.status} />
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {transaction.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LiveAuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Audit Log
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Decision trail
          </h2>
        </div>
        <FileSearch className="size-5 text-slate-500" />
      </div>
      <div className="mt-6 space-y-4">
        {events.map((event) => (
          <article
            className={`flex gap-4 ${
              event.id.startsWith("LIVE") ? "rounded-lg bg-cyan-50/50 p-2" : ""
            }`}
            key={event.id}
          >
            <div className="flex flex-col items-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {event.createdAt}
              </span>
              <span className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">{event.action}</h3>
                <StatusPill status={event.decision} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {event.actorName} · {event.target}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {event.reasoning}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LiveOperationsCenter() {
  const [baseTransactions, setBaseTransactions] =
    useState<Transaction[]>(transactions);
  const [baseAuditEvents, setBaseAuditEvents] =
    useState<AuditEvent[]>(auditEvents);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [liveAuditEvents, setLiveAuditEvents] = useState<AuditEvent[]>([]);
  const [source, setSource] = useState<"sample" | "supabase">("sample");

  const allTransactions = useMemo(
    () => [...liveTransactions, ...baseTransactions],
    [baseTransactions, liveTransactions],
  );
  const allAuditEvents = useMemo(
    () => [...liveAuditEvents, ...baseAuditEvents],
    [baseAuditEvents, liveAuditEvents],
  );

  useEffect(() => {
    let isActive = true;

    async function loadOperations() {
      const response = await fetch("/api/audit");
      const body = (await response.json()) as {
        source?: "sample" | "supabase";
        transactions: Transaction[];
        auditEvents: AuditEvent[];
      };

      if (!isActive) {
        return;
      }

      setBaseTransactions(body.transactions);
      setBaseAuditEvents(body.auditEvents);
      setSource(body.source ?? "sample");
    }

    loadOperations().catch(() => {
      setSource("sample");
    });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleRunComplete(result: WorkflowRunResult) {
    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(result),
      });
      const body = (await response.json()) as {
        source?: "memory" | "supabase";
        transaction?: Transaction;
        auditEvent?: AuditEvent;
      };

      if (body.transaction && body.auditEvent) {
        setLiveTransactions((current) => [body.transaction as Transaction, ...current]);
        setLiveAuditEvents((current) => [body.auditEvent as AuditEvent, ...current]);
        setSource(body.source === "supabase" ? "supabase" : source);
        return;
      }
    } catch {
      // Keep the demo responsive if persistence is unavailable.
    }

    setLiveTransactions((current) => [
      buildTransaction(result, current.length + 1),
      ...current,
    ]);
    setLiveAuditEvents((current) => [
      buildAuditEvent(result, current.length + 1),
      ...current,
    ]);
  }

  return (
    <>
      <AgentWorkflow onRunComplete={handleRunComplete} />
      <LiveTransactionTable rows={allTransactions} source={source} />
      <LiveAuditTimeline events={allAuditEvents} />
    </>
  );
}
