/*
 * Demo reset — run immediately before a client demo.
 *
 * Wipes everything produced by practice runs (LIVE-*, HUMAN-*) and restores
 * the seed narrative in Supabase, including TX-9002 as *escalated* so the
 * Human Approval Queue opens with exactly one item to release live.
 *
 *   npm run demo:reset
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match && process.env[match[1]] === undefined) {
    process.env[match[1]] = match[2];
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("demo:reset requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  // 1) purge demo artifacts
  const { data: txDeleted } = await supabase
    .from("transactions")
    .delete()
    .like("id", "LIVE-%")
    .select("id");
  const { data: auditDeleted } = await supabase
    .from("audit_events")
    .delete()
    .or("id.like.LIVE-%,id.like.HUMAN-%")
    .select("id");
  const { error: runsError } = await supabase.from("agent_runs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log(`purged ${txDeleted?.length ?? 0} transactions, ${auditDeleted?.length ?? 0} audit events${runsError ? ` (agent_runs: ${runsError.message})` : ", agent_runs"}`);

  // 2) restore the seed narrative (idempotent upserts)
  const seedTransactions = [
    { id: "TX-9001", invoice_id: "INV-2409", agent_name: "Ops Invoice Agent", vendor_name: "Northstar Data Labs", amount: 0.42, category: "vendor-risk-data", status: "approved", policy_decision: "APPROVED by POL-001", reason: "Paid report price is below autonomous data-purchase limit.", x402_reference: "x402-demo-5f3a", created_at: "2026-05-14T11:16:00.000Z" },
    { id: "TX-9002", invoice_id: "INV-2410", agent_name: "Ops Invoice Agent", vendor_name: "Metro Cloud Brokers", amount: 12600.0, category: "cloud-credits", status: "escalated", policy_decision: "ESCALATED by POL-002", reason: "Invoice is above the 10,000 EUR finance approval threshold.", x402_reference: "manual-approval-required", created_at: "2026-05-14T11:21:00.000Z" },
    { id: "TX-9003", invoice_id: "INV-2411", agent_name: "Procurement Agent", vendor_name: "Apex Enrichment API", amount: 0.18, category: "lead-enrichment", status: "blocked", policy_decision: "BLOCKED by POL-003", reason: "Duplicate purchase and vendor blocked by enrichment policy.", x402_reference: "payment-not-issued", created_at: "2026-05-14T11:27:00.000Z" },
  ];
  const seedAudit = [
    { id: "AUD-5001", actor_type: "agent", actor_name: "Ops Invoice Agent", action: "Requested vendor-risk report", target: "INV-2409", decision: "pending", reasoning: "The vendor is new, so the invoice cannot be approved without a risk report.", created_at: "2026-05-14T11:15:00.000Z" },
    { id: "AUD-5002", actor_type: "payment", actor_name: "X402 Gateway", action: "Returned 402 challenge", target: "Northstar Data Labs report", decision: "pending", reasoning: "The vendor-risk endpoint requires a 0.42 EUR programmable payment.", created_at: "2026-05-14T11:16:00.000Z" },
    { id: "AUD-5003", actor_type: "policy", actor_name: "Policy Engine", action: "Evaluated paid data purchase", target: "TX-9001", decision: "approved", reasoning: "Category is allowed, price is below limit, and no duplicate report exists.", created_at: "2026-05-14T11:16:30.000Z" },
    { id: "AUD-5004", actor_type: "policy", actor_name: "Policy Engine", action: "Evaluated cloud invoice", target: "INV-2410", decision: "escalated", reasoning: "Invoice is valid in category but amount requires human finance approval.", created_at: "2026-05-14T11:21:00.000Z" },
    { id: "AUD-5005", actor_type: "policy", actor_name: "Policy Engine", action: "Blocked repeat data payment", target: "TX-9003", decision: "blocked", reasoning: "The same enrichment report was already purchased and the vendor is blocked.", created_at: "2026-05-14T11:27:00.000Z" },
  ];

  const { error: txError } = await supabase.from("transactions").upsert(seedTransactions);
  const { error: auditError } = await supabase.from("audit_events").upsert(seedAudit);

  if (txError || auditError) {
    console.error("restore failed:", txError?.message, auditError?.message);
    process.exit(1);
  }

  // 3) make sure TX-9002 shows as awaiting a human even if it had been decided
  await supabase
    .from("transactions")
    .update({ status: "escalated", decided_by: null, released_at: null, x402_reference: "manual-approval-required" })
    .eq("id", "TX-9002");

  console.log("✅ demo state restored: 3 transactions (1 awaiting human approval), 5 audit events");
}

void main();
