"use client";

import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  Play,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

type StepStatus = "idle" | "running" | "complete" | "error" | "skipped";
type FlowStatus = "idle" | "running" | "done" | "error";

type Step = { label: string; status: StepStatus; detail?: string };

type Flow = {
  id: string;
  title: string;
  input: string;
  expected: string;
  status: FlowStatus;
  startedAt?: number;
  latencyMs?: number;
  steps: Step[];
  result?: { verdict: string; ok: boolean; note: string; jev?: string };
};

const initialFlows = (): Record<string, Flow> => ({
  clean: {
    id: "clean",
    title: "1 · Clean purchase — autonomous approve",
    input: "Clearbit Sample · lead-enrichment · €300",
    expected: "approved",
    status: "idle",
    steps: [
      { label: "Call protected vendor-risk endpoint", status: "idle" },
      { label: "Evaluate deterministic policy", status: "idle" },
      { label: "Jev System One fraud gate", status: "idle" },
      { label: "Issue X402 payment", status: "idle" },
      { label: "Command Code finance memo", status: "idle" },
      { label: "Persist to Supabase ledger", status: "idle" },
    ],
  },
  highvalue: {
    id: "highvalue",
    title: "2 · Cloud invoice above 10k — rules escalate",
    input: "Metro Cloud Brokers · cloud-credits · €12,600",
    expected: "escalated (rules)",
    status: "idle",
    steps: [
      { label: "Evaluate deterministic policy", status: "idle" },
      { label: "Jev skipped — rules already decided ($0, 0 ms)", status: "idle" },
      { label: "Command Code finance memo", status: "idle" },
      { label: "Persist → lands in approval queue", status: "idle" },
    ],
  },
  bec: {
    id: "bec",
    title: "3 · Wire-fraud attack — every rule passes, Jev catches it",
    input: "Veritas Risk Graph · vendor-risk-data · €180 + BEC context",
    expected: "escalated (Jev)",
    status: "idle",
    steps: [
      { label: "Evaluate deterministic policy", status: "idle" },
      { label: "Jev fraud gate on approved payment", status: "idle" },
      { label: "Command Code finance memo", status: "idle" },
      { label: "Persist → lands in approval queue", status: "idle" },
    ],
  },
  duplicate: {
    id: "duplicate",
    title: "4 · Repeat purchase — ledger memory blocks it",
    input: "Clearbit Sample · lead-enrichment · €300 (again)",
    expected: "blocked (duplicate)",
    status: "idle",
    steps: [
      { label: "Evaluate policy against persisted ledger", status: "idle" },
      { label: "Command Code finance memo", status: "idle" },
      { label: "Persist blocked attempt to audit trail", status: "idle" },
    ],
  },
  invoice: {
    id: "invoice",
    title: "5 · Invoice upload — Jev document triage tightens",
    input: "Invoice text: new IBAN, 'don't call to verify', urgent discount",
    expected: "escalated (Jev)",
    status: "idle",
    steps: [
      { label: "Deterministic parse + rule recommendation", status: "idle" },
      { label: "Jev reads the document for fraud signals", status: "idle" },
      { label: "Final recommendation", status: "idle" },
    ],
  },
});

function StepDot({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 className="size-4 animate-spin text-cyan-600" />;
  if (status === "complete") return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (status === "error") return <XCircle className="size-4 text-rose-600" />;
  if (status === "skipped") return <ArrowRight className="size-4 text-slate-400" />;
  return <Circle className="size-4 text-slate-300" />;
}

const verdictStyles: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  released: "bg-teal-100 text-teal-800",
  escalated: "bg-amber-100 text-amber-800",
  blocked: "bg-rose-100 text-rose-800",
};

async function postJson<T>(path: string, body: unknown): Promise<{ status: number; body: T }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as T };
}

type JevPayment = {
  suspicious: number;
  humanReview: number;
  riskLevel: string;
  escalated: boolean;
  latencyMs: number;
  inputTokens?: number;
};

type AttemptBody = {
  status: string;
  paymentIssued: boolean;
  x402Reference?: string;
  evaluation: { decision: string; reason: string; checks: unknown[]; policyId: string | null };
  jev: JevPayment | null;
};

type MemoBody = {
  source: string;
  headline: string;
  summary: string;
  riskLevel: string;
  nextAction: string;
  evidence: string[];
  latencyMs?: number;
};

type InvoiceBody = {
  analysis: { recommendation: string; riskScore: number; summary: string; invoiceId: string; findings: string[] };
  jev: { fraudSignals: number; severity: string; riskScore: number } | null;
};

type PersistBody = { source: string; transaction?: { id: string }; error?: string };

export function DemoOrchestra() {
  const [flows, setFlows] = useState<Record<string, Flow>>(initialFlows);
  const [isRunning, setIsRunning] = useState(false);
  const [persist, setPersist] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const patchRef = useRef<Record<string, Flow>>(initialFlows());

  const commit = useCallback((next: Record<string, Flow>) => {
    patchRef.current = next;
    setFlows({ ...next });
  }, []);

  const step = useCallback(
    (flowId: string, index: number, status: StepStatus, detail?: string) => {
      const current = patchRef.current[flowId];
      const steps = current.steps.map((s, i) =>
        i === index ? { ...s, status, detail: detail ?? s.detail } : s,
      );
      commit({ ...patchRef.current, [flowId]: { ...current, steps } });
    },
    [commit],
  );

  const finish = useCallback(
    (flowId: string, verdict: string, ok: boolean, note: string, jev?: string) => {
      const current = patchRef.current[flowId];
      commit({
        ...patchRef.current,
        [flowId]: {
          ...current,
          status: "done",
          latencyMs: current.startedAt ? Date.now() - current.startedAt : undefined,
          result: { verdict, ok, note, jev },
        },
      });
    },
    [commit],
  );

  const memoFor = useCallback(
    async (flowId: string, index: number, input: Record<string, unknown>) => {
      step(flowId, index, "running", "Asking Command Code (space-bunny-alpha)…");
      try {
        const { body } = await postJson<MemoBody>("/api/agent/reasoning", input);
        const source =
          body.source === "deterministic-fallback"
            ? "fallback"
            : String(body.source).replace("command-code:", "");
        step(flowId, index, "complete", `Memo by ${source} · ${((body.latencyMs ?? 0) / 1000).toFixed(1)}s`);
        return body;
      } catch {
        step(flowId, index, "error", "Memo service unreachable");
        return null;
      }
    },
    [step],
  );

  const persistRun = useCallback(
    async (flowId: string, index: number, scenario: Record<string, unknown>, payment: AttemptBody, memo: MemoBody | null) => {
      if (!persist) {
        step(flowId, index, "skipped", "Persistence off for this click");
        return null;
      }
      step(flowId, index, "running", "Writing transaction + audit event…");
      try {
        const { body } = await postJson<PersistBody>("/api/agent-runs", {
          scenario,
          payment,
          memo: memo ?? {
            headline: "Run recorded by architecture demo",
            summary: String(payment.evaluation?.reason ?? ""),
            riskLevel: "medium",
            nextAction: "See decision trail",
            evidence: [],
            source: "deterministic-fallback",
          },
          report: null,
          completedAt: new Date().toISOString(),
        });
        step(flowId, index, "complete", `${body.source} · ${body.transaction?.id ?? ""}`);
        return body;
      } catch {
        step(flowId, index, "error", "Persist failed");
        return null;
      }
    },
    [persist, step],
  );

  const jevNote = (jev: Partial<JevPayment & { fraudSignals: number; severity: string }> | null | undefined) =>
    jev
      ? "susp" in jev
        ? `susp ${(jev.suspicious ?? 0).toFixed(2)} · ${jev.riskLevel} · ${jev.latencyMs} ms · ~$${(((jev.inputTokens ?? 900) * 0.042) / 1_000_000).toFixed(5)}`
        : `fraud ${(jev.fraudSignals ?? 0).toFixed(2)} · ${jev.severity}`
      : undefined;

  async function runClean(tag: string) {
    const flowId = "clean";
    patchRef.current[flowId] = { ...patchRef.current[flowId], status: "running", startedAt: Date.now() };
    commit(patchRef.current);

    step(flowId, 0, "running");
    const challenge = await fetch(`/api/vendor-risk/report?vendorName=Clearbit Sample`);
    step(flowId, 0, "complete", `HTTP ${challenge.status} Payment Required — pay before data`);

    const { body: attempt } = await postJson<AttemptBody>("/api/payments/attempt", {
      vendorName: "Clearbit Sample",
      category: "lead-enrichment",
      amount: 300,
      invoiceId: `INV-ARC-${tag}`,
      context: "Recurring invoice from existing vendor, wire instructions unchanged, standard net-30.",
    });
    step(flowId, 1, "complete", `${attempt.evaluation.decision.toUpperCase()} — ${attempt.evaluation.reason}`);
    step(flowId, 2, attempt.jev ? "complete" : "skipped", attempt.jev ? jevNote(attempt.jev) : "no ML needed");

    if (attempt.status === "approved" && attempt.paymentIssued) {
      step(flowId, 3, "complete", `Payment issued · ${attempt.x402Reference}`);
    } else {
      step(flowId, 3, attempt.status === "blocked" ? "error" : "skipped", "No funds released");
    }

    const memo = await memoFor(flowId, 4, {
      vendorName: "Clearbit Sample",
      amount: 300,
      category: "lead-enrichment",
      invoiceId: `INV-ARC-${tag}`,
      decision: attempt.evaluation.decision,
      reason: attempt.evaluation.reason,
      checks: attempt.evaluation.checks,
    });

    await persistRun(
      flowId,
      5,
      { id: "arch-clean", name: "Architecture demo — clean purchase", description: "", invoiceId: `INV-ARC-${tag}`, vendorName: "Clearbit Sample", amount: 300, category: "lead-enrichment", expectedDecision: "approved" },
      attempt,
      memo,
    );

    finish(
      flowId,
      attempt.status,
      attempt.status === "approved",
      attempt.status === "approved"
        ? "Paid autonomously — Jev confirmed routine risk."
        : "Ledger already holds this purchase — duplicate guard fired (memory working).",
      jevNote(attempt.jev),
    );
    return attempt;
  }

  async function runHighValue(tag: string) {
    const flowId = "highvalue";
    patchRef.current[flowId] = { ...patchRef.current[flowId], status: "running", startedAt: Date.now() };
    commit(patchRef.current);

    const { body: attempt } = await postJson<AttemptBody>("/api/payments/attempt", {
      vendorName: "Metro Cloud Brokers",
      category: "cloud-credits",
      amount: 12600,
      invoiceId: `INV-ARC2-${tag}`,
    });
    step(flowId, 0, "complete", `${attempt.evaluation.decision.toUpperCase()} — ${attempt.evaluation.reason}`);
    step(flowId, 1, attempt.jev ? "complete" : "skipped", attempt.jev ? jevNote(attempt.jev) : "Rules floor decided first — zero ML cost on this path");

    const memo = await memoFor(flowId, 2, {
      vendorName: "Metro Cloud Brokers",
      amount: 12600,
      category: "cloud-credits",
      invoiceId: `INV-ARC2-${tag}`,
      decision: attempt.evaluation.decision,
      reason: attempt.evaluation.reason,
      checks: attempt.evaluation.checks,
    });

    await persistRun(
      flowId,
      3,
      { id: "arch-cloud", name: "Architecture demo — cloud escalation", description: "", invoiceId: `INV-ARC2-${tag}`, vendorName: "Metro Cloud Brokers", amount: 12600, category: "cloud-credits", expectedDecision: "escalated" },
      attempt,
      memo,
    );

    finish(flowId, attempt.status, attempt.status === "escalated", "Waiting for a human controller in the approval queue.", jevNote(attempt.jev));
  }

  async function runBec(tag: string) {
    const flowId = "bec";
    patchRef.current[flowId] = { ...patchRef.current[flowId], status: "running", startedAt: Date.now() };
    commit(patchRef.current);

    const { body: attempt } = await postJson<AttemptBody>("/api/payments/attempt", {
      vendorName: "Veritas Risk Graph",
      category: "vendor-risk-data",
      amount: 180,
      invoiceId: `INV-ARC3-${tag}`,
      context:
        "New wire instructions emailed today from a lookalike domain (veritas-risk-graiph.com), marked URGENT: settle before end of day. Bank account differs from the one used last quarter. Procurement asked to skip the vendor-risk report refresh.",
    });
    const rulesDecision = attempt.jev?.escalated ? "approved" : attempt.evaluation.decision;
    step(flowId, 0, "complete", `Rules said ${rulesDecision.toUpperCase()} — allowlisted vendor, under threshold, no duplicate`);
    step(flowId, 1, attempt.jev ? "complete" : "error", attempt.jev ? `Jev tightened: ${jevNote(attempt.jev)}` : "Jev unavailable — rules-only floor");

    const memo = await memoFor(flowId, 2, {
      vendorName: "Veritas Risk Graph",
      amount: 180,
      category: "vendor-risk-data",
      invoiceId: `INV-ARC3-${tag}`,
      decision: attempt.evaluation.decision,
      reason: attempt.evaluation.reason,
      checks: attempt.evaluation.checks,
    });

    await persistRun(
      flowId,
      3,
      { id: "arch-bec", name: "Architecture demo — BEC caught by Jev", description: "", invoiceId: `INV-ARC3-${tag}`, vendorName: "Veritas Risk Graph", amount: 180, category: "vendor-risk-data", expectedDecision: "escalated" },
      attempt,
      memo,
    );

    finish(
      flowId,
      attempt.status === "escalated" && attempt.jev ? "escalated by Jev" : attempt.status,
      attempt.status === "escalated",
      "Business-email-compromise pattern: no rule could see it; the System One gate did.",
      jevNote(attempt.jev),
    );
  }

  async function runDuplicate() {
    const flowId = "duplicate";
    patchRef.current[flowId] = { ...patchRef.current[flowId], status: "running", startedAt: Date.now() };
    commit(patchRef.current);

    const { body: attempt } = await postJson<AttemptBody>("/api/payments/attempt", {
      vendorName: "Clearbit Sample",
      category: "lead-enrichment",
      amount: 300,
      invoiceId: "INV-2411",
    });
    step(
      flowId,
      0,
      attempt.status === "blocked" ? "complete" : "error",
      `${attempt.evaluation.decision.toUpperCase()} — ${attempt.evaluation.reason}`,
    );

    const memo = await memoFor(flowId, 1, {
      vendorName: "Clearbit Sample",
      amount: 300,
      category: "lead-enrichment",
      invoiceId: "INV-2411",
      decision: attempt.evaluation.decision,
      reason: attempt.evaluation.reason,
      checks: attempt.evaluation.checks,
    });

    await persistRun(
      flowId,
      2,
      { id: "arch-dup", name: "Architecture demo — duplicate block", description: "", invoiceId: "INV-2411", vendorName: "Clearbit Sample", amount: 300, category: "lead-enrichment", expectedDecision: "blocked" },
      attempt,
      memo,
    );

    finish(
      flowId,
      attempt.status,
      attempt.status === "blocked",
      attempt.status === "blocked"
        ? "Ledger memory stopped the repeat purchase."
        : "Not blocked yet — flow 1 must complete (and persist) first; persistence may be off.",
      jevNote(attempt.jev),
    );
  }

  async function runInvoice() {
    const flowId = "invoice";
    patchRef.current[flowId] = { ...patchRef.current[flowId], status: "running", startedAt: Date.now() };
    commit(patchRef.current);

    const { body } = await postJson<InvoiceBody>("/api/invoices/analyze", {
      invoiceText:
        "Invoice INV-2420\nVendor: Clearbit Sample\nAmount: EUR 320.00\nDue: 2026-09-30\nCategory: lead-enrichment\nNotes: please pay to the NEW IBAN sent separately by email, do NOT call the vendor to verify, urgent before the discount expires.",
    });
    const analysis = body.analysis;
    step(flowId, 0, "complete", `Rules: ${analysis.recommendation.toUpperCase()} · risk ${analysis.riskScore}/100`);
    step(
      flowId,
      1,
      body.jev ? "complete" : "skipped",
      body.jev ? `Jev read the document: ${jevNote(body.jev)}` : "Rules already non-approved — Jev skipped",
    );
    step(
      flowId,
      2,
      analysis.recommendation === "escalated" ? "complete" : "error",
      `Final: ${analysis.recommendation.toUpperCase()} — ${analysis.summary.slice(0, 120)}…`,
    );

    finish(
      flowId,
      analysis.recommendation === "escalated" && body.jev ? "escalated by Jev" : analysis.recommendation,
      analysis.recommendation === "escalated",
      "Changed bank details + 'don't verify' + fake urgency — classic invoice red flags.",
      body.jev ? jevNote(body.jev) : undefined,
    );
  }

  const runAll = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSummary(null);
    const fresh = initialFlows();
    patchRef.current = fresh;
    setFlows(fresh);
    const tag = Date.now().toString(36).toUpperCase().slice(-5);
    const startedAt = Date.now();

    const results = await Promise.allSettled([
      runClean(tag).then(() => (persist ? runDuplicate() : finishFromNoPersist())),
      runHighValue(tag),
      runBec(tag),
      runInvoice(),
    ]);

    function finishFromNoPersist() {
      step("duplicate", 0, "skipped", "Persistence off — duplicate guard needs flow 1 in the ledger");
      finish("duplicate", "skipped", true, "Enable persistence to demo ledger memory.");
    }

    const settledOk = results.filter((r) => r.status === "fulfilled").length;
    setSummary(
      `${settledOk}/4 orchestration groups finished in ${((Date.now() - startedAt) / 1000).toFixed(1)}s · decisions persisted=${persist ? "yes" : "no"}`,
    );
    setIsRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, persist]);

  const flowList = Object.values(flows);
  const doneCount = flowList.filter((f) => f.status === "done").length;
  const totalMs = flowList.reduce((sum, f) => sum + (f.latencyMs ?? 0), 0);
  const jevCost = flowList.reduce((sum, f) => {
    const tokens = f.result?.jev?.match(/~\$([\d.]+)/);
    return sum + (tokens ? Number(tokens[1]) : 0);
  }, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Live Architecture Demo
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Five real inputs, one click — watch every layer decide
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Hits the same production APIs the dashboard uses: X402 402 challenge,
            deterministic policy, Jev System One gates, Command Code memos, and
            the Supabase ledger. Nothing is mocked on this panel.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isRunning}
            onClick={() => void runAll()}
            type="button"
          >
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {isRunning ? "Agents running…" : "Run all five flows"}
          </button>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <input
              checked={persist}
              className="size-3.5 accent-slate-900"
              onChange={(event) => setPersist(event.target.checked)}
              type="checkbox"
            />
            Persist runs to the live audit ledger
          </label>
        </div>
      </div>

      {summary ? (
        <p className="mt-4 rounded-md bg-slate-950 px-4 py-2.5 font-mono text-xs text-emerald-300">
          {summary} · {doneCount}/5 flows reported · {totalMs.toLocaleString()} ms aggregate flow
          time · ~${jevCost.toFixed(5)} total ML spend
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {flowList.map((flow) => (
          <article
            className={`rounded-lg border p-4 transition ${
              flow.status === "running"
                ? "border-cyan-300 bg-cyan-50/40"
                : flow.status === "done"
                  ? "border-slate-200 bg-white"
                  : "border-slate-200 bg-slate-50"
            }`}
            key={flow.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-950">{flow.title}</h3>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{flow.input}</p>
              </div>
              {flow.result ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                    verdictStyles[flow.result.verdict.split(" ")[0]] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {flow.result.verdict}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  expected: {flow.expected}
                </span>
              )}
            </div>

            <ol className="mt-3 space-y-1.5">
              {flow.steps.map((s, index) => (
                <li className="flex items-start gap-2.5 text-sm" key={`${flow.id}-${index}`}>
                  <span className="mt-0.5 shrink-0">
                    <StepDot status={s.status} />
                  </span>
                  <div className="min-w-0">
                    <span
                      className={
                        s.status === "idle" ? "text-slate-400" : "font-medium text-slate-700"
                      }
                    >
                      {s.label}
                    </span>
                    {s.detail ? (
                      <p className="truncate font-mono text-xs text-slate-500">{s.detail}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            {flow.result ? (
              <p
                className={`mt-3 rounded-md px-3 py-2 text-xs leading-5 ${
                  flow.result.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                }`}
              >
                {flow.result.note}
                {flow.latencyMs ? ` · ${(flow.latencyMs / 1000).toFixed(1)}s` : ""}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <a
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          href="/api/audit/export?format=csv"
        >
          <Download className="size-4" />
          Export what just happened (CSV)
        </a>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          href="/#approval-queue"
        >
          <UserCheck className="size-4" />
          Decide on escalated payments in the queue
        </Link>
        <p className="text-xs text-slate-400">
          Tip: run it twice — flow 4 (and then flow 1) trips the duplicate guard
          because the first purchase is now in the ledger. That is the memory
          story. Reset anytime with <code className="font-mono">npm run demo:reset</code>.
        </p>
      </div>
    </section>
  );
}
