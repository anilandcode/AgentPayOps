import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";
import { InvoiceIntake } from "@/components/invoice-intake";
import { LiveOperationsCenter } from "@/components/live-operations-center";
import {
  dashboardStats,
  invoices,
  policies,
  type Decision,
} from "@/lib/sample-data";

const statusStyles: Record<Decision, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  escalated: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusIcons: Record<Decision, ElementType> = {
  approved: CheckCircle2,
  blocked: XCircle,
  escalated: AlertTriangle,
  pending: Gauge,
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function StatusPill({ status }: { status: Decision }) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: ElementType;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-md p-2 ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </section>
  );
}

function InvoiceReview() {
  const activeInvoice = invoices[0];

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Invoice Review
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {activeInvoice.vendorName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeInvoice.id} · Due {activeInvoice.dueDate} ·{" "}
              {activeInvoice.category}
            </p>
          </div>
          <StatusPill status={activeInvoice.status} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {currency.format(activeInvoice.amount)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Risk Score
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {activeInvoice.riskScore}/100
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Agent Action
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              Paid report
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 size-5 text-slate-700" />
            <div>
              <h3 className="font-semibold text-slate-950">
                Agent recommendation
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeInvoice.recommendation}
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {activeInvoice.findings.map((finding) => (
            <li
              className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600"
              key={finding}
            >
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
              {finding}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <LockKeyhole className="size-5 text-cyan-300" />
          <h2 className="text-xl font-semibold tracking-tight">
            X402 Payment Simulation
          </h2>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Paid endpoint
            </p>
            <p className="mt-2 font-mono text-sm text-cyan-100">
              GET /api/vendor-risk/report
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="rounded-md bg-amber-400/15 px-2 py-1 font-mono text-amber-200">
              402
            </span>
            <span>Endpoint requires 0.42 EUR before returning vendor risk.</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <ArrowRight className="size-4 text-cyan-300" />
            <span>Policy engine checks vendor, category, limit, duplicate use.</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <CheckCircle2 className="size-4 text-emerald-300" />
            <span>Payment approved and audit event stored.</span>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
            Result
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-50">
            AgentPayOps allows the agent to buy one risk report, attaches it to
            the invoice, and blocks repeat purchases against the same vendor.
          </p>
        </div>
      </div>
    </section>
  );
}

function PolicyControls() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Payment Controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Finance policies for autonomous agents
          </h2>
        </div>
        <SlidersHorizontal className="size-5 text-slate-500" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {policies.map((policy) => (
          <article
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={policy.id}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-950">{policy.name}</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                On
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-700">{policy.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Max amount</dt>
                <dd className="font-medium text-slate-700">
                  {currency.format(policy.maxAmount)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Approval above</dt>
                <dd className="font-medium text-slate-700">
                  {currency.format(policy.approvalRequiredAbove)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  AgentPayOps
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Finance controls for autonomous agents
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Review invoices, govern agent payments, respond to X402 payment
              challenges, and keep an audit trail finance teams can trust.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <Bot className="size-4" />
            Ops Invoice Agent active
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CircleDollarSign}
            label="Agent spend reviewed"
            tone="bg-cyan-50 text-cyan-700"
            value={currency.format(dashboardStats.agentSpend)}
          />
          <MetricCard
            icon={XCircle}
            label="Blocked spend"
            tone="bg-rose-50 text-rose-700"
            value={currency.format(dashboardStats.blockedSpend)}
          />
          <MetricCard
            icon={WalletCards}
            label="Savings identified"
            tone="bg-emerald-50 text-emerald-700"
            value={currency.format(dashboardStats.moneySaved)}
          />
          <MetricCard
            icon={ReceiptText}
            label="Pending approvals"
            tone="bg-amber-50 text-amber-700"
            value={dashboardStats.pendingApprovals.toString()}
          />
        </section>

        <InvoiceIntake />
        <InvoiceReview />
        <LiveOperationsCenter />
        <PolicyControls />
      </div>
    </main>
  );
}
