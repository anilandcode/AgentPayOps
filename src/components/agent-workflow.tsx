"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Radio,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceMemo } from "@/lib/finance-memo";
import { demoScenarios, type Decision, type DemoScenario } from "@/lib/sample-data";

type WorkflowStep = {
  id: string;
  label: string;
  status: "waiting" | "running" | "complete" | "error";
  detail: string;
};

export type PaymentAttemptResponse = {
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

export type VendorRiskResponse = {
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

export type WorkflowRunResult = {
  scenario: DemoScenario;
  payment: PaymentAttemptResponse;
  memo: FinanceMemo;
  report: VendorRiskResponse | null;
  completedAt: string;
};

type AgentWorkflowProps = {
  onRunComplete?: (result: WorkflowRunResult) => void;
};

const decisionStyles: Record<Decision, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  escalated: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
};

function StepIcon({ status }: { status: WorkflowStep["status"] }) {
  if (status === "running") {
    return <Loader2 className="size-4 animate-spin text-cyan-600" />;
  }

  if (status === "complete") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }

  if (status === "error") {
    return <XCircle className="size-4 text-rose-600" />;
  }

  return <Radio className="size-4 text-slate-400" />;
}

const initialSteps: WorkflowStep[] = [
  {
    id: "challenge",
    label: "Call protected vendor-risk endpoint",
    status: "waiting",
    detail: "Waiting for agent run.",
  },
  {
    id: "policy",
    label: "Evaluate payment policy",
    status: "waiting",
    detail: "Waiting for 402 challenge.",
  },
  {
    id: "payment",
    label: "Issue or stop payment",
    status: "waiting",
    detail: "Waiting for policy decision.",
  },
  {
    id: "report",
    label: "Attach paid report to invoice review",
    status: "waiting",
    detail: "Waiting for payment result.",
  },
];

function updateStep(
  steps: WorkflowStep[],
  id: string,
  status: WorkflowStep["status"],
  detail: string,
) {
  return steps.map((step) =>
    step.id === id
      ? {
          ...step,
          status,
          detail,
        }
      : step,
  );
}

export function AgentWorkflow({ onRunComplete }: AgentWorkflowProps) {
  const [selectedId, setSelectedId] = useState(demoScenarios[0].id);
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [paymentResult, setPaymentResult] =
    useState<PaymentAttemptResponse | null>(null);
  const [reportResult, setReportResult] = useState<VendorRiskResponse | null>(
    null,
  );
  const [financeMemo, setFinanceMemo] = useState<FinanceMemo | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const scenario = useMemo(
    () =>
      demoScenarios.find((candidate) => candidate.id === selectedId) ??
      demoScenarios[0],
    [selectedId],
  );

  async function runScenario(activeScenario: DemoScenario) {
    setIsRunning(true);
    setPaymentResult(null);
    setReportResult(null);
    setFinanceMemo(null);
    setSteps(initialSteps);

    try {
      setSteps((current) =>
        updateStep(
          current,
          "challenge",
          "running",
          `Requesting paid report for ${activeScenario.vendorName}.`,
        ),
      );

      const challenge = await fetch(
        `/api/vendor-risk/report?vendorName=${encodeURIComponent(
          activeScenario.vendorName,
        )}`,
      );
      const challengeBody = await challenge.json();

      if (challenge.status !== 402) {
        throw new Error("Protected endpoint did not return a 402 challenge.");
      }

      setSteps((current) =>
        updateStep(
          current,
          "challenge",
          "complete",
          `Received ${challenge.status}: ${challengeBody.amount} ${challengeBody.currency} required.`,
        ),
      );

      setSteps((current) =>
        updateStep(
          current,
          "policy",
          "running",
          "Checking vendor allowlist, category, amount, approval threshold, and duplicate purchases.",
        ),
      );

      const paymentResponse = await fetch("/api/payments/attempt", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          vendorName: activeScenario.vendorName,
          amount: activeScenario.amount,
          category: activeScenario.category,
          invoiceId: activeScenario.invoiceId,
        }),
      });
      const paymentBody = (await paymentResponse.json()) as PaymentAttemptResponse;
      setPaymentResult(paymentBody);

      const memoResponse = await fetch("/api/agent/reasoning", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          vendorName: activeScenario.vendorName,
          amount: activeScenario.amount,
          category: activeScenario.category,
          invoiceId: activeScenario.invoiceId,
          decision: paymentBody.evaluation.decision,
          reason: paymentBody.evaluation.reason,
          checks: paymentBody.evaluation.checks,
        }),
      });
      const memoBody = (await memoResponse.json()) as FinanceMemo;
      setFinanceMemo(memoBody);

      setSteps((current) =>
        updateStep(
          current,
          "policy",
          "complete",
          `${paymentBody.evaluation.decision.toUpperCase()}: ${paymentBody.evaluation.reason}`,
        ),
      );

      if (paymentBody.status !== "approved" || !paymentBody.x402Reference) {
        setSteps((current) =>
          updateStep(
            updateStep(
              current,
              "payment",
              paymentBody.status === "blocked" ? "error" : "complete",
              paymentBody.status === "blocked"
                ? "Payment stopped before funds were issued."
                : "Payment routed to human approval queue.",
            ),
            "report",
            "complete",
            "No paid report was fetched because payment was not autonomously approved.",
          ),
        );
        onRunComplete?.({
          scenario: activeScenario,
          payment: paymentBody,
          memo: memoBody,
          report: null,
          completedAt: new Date().toISOString(),
        });
        return;
      }

      setSteps((current) =>
        updateStep(
          current,
          "payment",
          "complete",
          `Payment issued with reference ${paymentBody.x402Reference}.`,
        ),
      );

      setSteps((current) =>
        updateStep(
          current,
          "report",
          "running",
          "Retrying paid endpoint with payment proof.",
        ),
      );

      const reportResponse = await fetch(
        `/api/vendor-risk/report?vendorName=${encodeURIComponent(
          activeScenario.vendorName,
        )}`,
        {
          headers: {
            "x-payment-proof": paymentBody.x402Reference,
          },
        },
      );
      const reportBody = (await reportResponse.json()) as VendorRiskResponse;
      setReportResult(reportBody);

      setSteps((current) =>
        updateStep(
          current,
          "report",
          "complete",
          `Report attached: risk score ${reportBody.report.riskScore}/100.`,
        ),
      );
      onRunComplete?.({
        scenario: activeScenario,
        payment: paymentBody,
        memo: memoBody,
        report: reportBody,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Agent workflow failed.";
      setSteps((current) =>
        updateStep(current, "payment", "error", message),
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Live Agent Run
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Execute the payment-governance workflow
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Pick a scenario and run the same API sequence the demo pitch
            describes: protected endpoint, 402 challenge, policy decision,
            payment outcome, and audit-ready result.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isRunning}
          onClick={() => runScenario(scenario)}
          type="button"
        >
          {isRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Run agent review
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {demoScenarios.map((candidate) => (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${
                candidate.id === selectedId
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
              disabled={isRunning}
              key={candidate.id}
              onClick={() => setSelectedId(candidate.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{candidate.name}</h3>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold capitalize ${
                    candidate.id === selectedId
                      ? "border-white/20 bg-white/10 text-white"
                      : decisionStyles[candidate.expectedDecision]
                  }`}
                >
                  {candidate.expectedDecision}
                </span>
              </div>
              <p
                className={`mt-2 text-sm leading-6 ${
                  candidate.id === selectedId ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {candidate.description}
              </p>
              <p
                className={`mt-3 font-mono text-xs ${
                  candidate.id === selectedId ? "text-cyan-200" : "text-slate-500"
                }`}
              >
                {candidate.invoiceId} · {candidate.vendorName} ·{" "}
                {candidate.amount.toLocaleString("en-US", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            {steps.map((step) => (
              <article
                className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4"
                key={step.id}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <StepIcon status={step.status} />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{step.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.detail}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {paymentResult ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950">Policy checks</h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                    decisionStyles[paymentResult.evaluation.decision]
                  }`}
                >
                  {paymentResult.evaluation.decision}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {paymentResult.evaluation.checks.map((check) => (
                  <div
                    className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    key={check.label}
                  >
                    {check.passed ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="size-4 text-rose-600" />
                    )}
                    {check.label}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {financeMemo ? (
            <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-cyan-950">
                  <Sparkles className="size-4 text-cyan-700" />
                  AI finance memo
                </div>
                <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-semibold capitalize text-cyan-800">
                  {financeMemo.source === "gemini" ? "Gemini" : "Fallback"} ·{" "}
                  {financeMemo.riskLevel} risk
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-cyan-950">
                {financeMemo.headline}
              </h3>
              <p className="mt-2 text-sm leading-6 text-cyan-900">
                {financeMemo.summary}
              </p>
              <div className="mt-4 rounded-md border border-cyan-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Next action
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {financeMemo.nextAction}
                </p>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {financeMemo.evidence.map((item) => (
                  <li
                    className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                    key={item}
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-cyan-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {reportResult ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <CheckCircle2 className="size-4" />
                Paid report attached
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                {reportResult.report.summary}
              </p>
              <p className="mt-3 font-mono text-xs text-emerald-700">
                Payment proof: {reportResult.paymentReference}
              </p>
            </div>
          ) : paymentResult?.status === "blocked" ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-rose-800">
                <AlertTriangle className="size-4" />
                Payment blocked before funds were issued
              </div>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                {paymentResult.evaluation.reason}
              </p>
            </div>
          ) : paymentResult?.status === "escalated" ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertTriangle className="size-4" />
                Human finance approval required
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                {paymentResult.evaluation.reason}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
