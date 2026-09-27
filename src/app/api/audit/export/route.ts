import { getOperationsSnapshot } from "@/lib/persistence";

export const maxDuration = 30;

const DECISION_ORDER = ["released", "approved", "escalated", "blocked", "pending"];

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  let snapshot: Awaited<ReturnType<typeof getOperationsSnapshot>>;
  try { snapshot = await getOperationsSnapshot(); } catch(error) { return Response.json({error:error instanceof Error?error.message:"Audit unavailable."},{status:503}); }
  const kind=url.searchParams.get("kind") || "all";
  const search=(url.searchParams.get("search") || "").slice(0,100).toLowerCase();
  const status=url.searchParams.get("status") || "all";
  const matches=(row:unknown,decision:string)=> (status==="all" || status===decision) && JSON.stringify(row).toLowerCase().includes(search);

  const auditRows = (kind === "transactions" ? [] : snapshot.auditEvents.filter(event=>matches(event,event.decision))).map((event) => ({
    id: event.id,
    timestamp: event.createdAt,
    actor_type: event.actorType,
    actor_name: event.actorName,
    action: event.action,
    target: event.target,
    decision: event.decision,
    reasoning: event.reasoning.replace(/\s+/g, " ").trim(),
  }));

  const transactionRows = (kind === "events" ? [] : snapshot.transactions.filter(transaction=>matches(transaction,transaction.status))).map((transaction) => ({
    id: transaction.id,
    invoice_id: transaction.invoiceId,
    agent_name: transaction.agentName,
    vendor_name: transaction.vendorName,
    amount_eur: transaction.amount,
    category: transaction.category,
    status: transaction.status,
    policy_decision: transaction.policyDecision,
    reason: transaction.reason.replace(/\s+/g, " ").trim(),
    x402_reference: transaction.x402Reference,
    decided_by: transaction.decidedBy ?? "",
    created_at: transaction.createdAt,
  }));

  if (format === "json") {
    const stamp = new Date().toISOString().slice(0, 10);
    return Response.json(
      {
        exportedAt: new Date().toISOString(),
        source: snapshot.source,
        decisionOrder: DECISION_ORDER,
        auditEvents: auditRows,
        transactions: transactionRows,
      },
      {
        headers: {
          "content-disposition": `attachment; filename="agentpayops-audit-${stamp}.json"`,
        },
      },
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const sections = [
    "# AgentPayOps decision log export",
    `# exported_at,${new Date().toISOString()}`,
    `# source,${snapshot.source}`,
    "",
    "## AUDIT EVENTS",
    toCsv(auditRows),
    "",
    "## TRANSACTIONS",
    toCsv(transactionRows),
    "",
  ].join("\n");

  return new Response(sections, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="agentpayops-audit-${stamp}.csv"`,
    },
  });
}
