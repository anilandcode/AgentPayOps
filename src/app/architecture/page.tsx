import type { Metadata } from "next";
import {
  ArrowDown,
  Bot,
  Brain,
  CircleDollarSign,
  Cpu,
  Database,
  FileSearch,
  Gauge,
  Layers,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { DemoOrchestra } from "@/components/demo-orchestra";

export const metadata: Metadata = {
  title: "Architecture & Live Demo — AgentPayOps",
  description:
    "How AgentPayOps governs autonomous agent payments: policy floor, Jev decision gates, Command Code reasoning, X402 rails, Supabase audit ledger.",
};

type Layer = {
  icon: typeof Cpu;
  tag: string;
  name: string;
  what: string;
  rule: string;
  tone: string;
  live: string;
};

const layers: Layer[] = [
  {
    icon: FileSearch,
    tag: "Layer 0",
    name: "Intake — invoices become structured records",
    what: "PDF, image, or text invoices are parsed: vendor, amount, category, due date, findings. Extraction uses Command Code vision with a deterministic fallback, so the pipeline never dies on a bad upload.",
    rule: "Garbage in must never become a payment.",
    tone: "border-slate-200",
    live: "Flow 5 on this page sends a fraud-flavored invoice through intake.",
  },
  {
    icon: SlidersHorizontal,
    tag: "Layer 1",
    name: "Deterministic policy — the floor",
    what: "Plain code checks what code can see: vendor allow/block lists, category, amount ceilings, approval thresholds, and duplicate purchases against the persisted ledger. Finance edits these live in Payment Controls — no redeploy.",
    rule: "If a rule can decide it, a rule decides it. Free, instant, testable (accuracy 1.000, false-approve 0.000).",
    tone: "border-emerald-200",
    live: "Flows 1, 2 and 4 are decided here alone.",
  },
  {
    icon: ShieldAlert,
    tag: "Layer 2",
    name: "Jev System One gate — the context reader",
    what: "typesafe/jev takes state + typed questions and answers with raw probabilities in ~1s for fractions of a cent. It reads the payment packet and documents for patterns rules cannot encode: lookalike domains, changed wire instructions, manufactured urgency, 'don't call to verify'.",
    rule: "Jev runs only AFTER rules approve, and can only TIGHTEN (approve → escalate). It never releases funds. Blocked paths skip it — zero cost on dead ends.",
    tone: "border-violet-200",
    live: "Flows 3 and 5 exist to show this gate firing.",
  },
  {
    icon: Brain,
    tag: "Layer 3",
    name: "Command Code LLM — the writer",
    what: "stealth/space-bunny-alpha (fallbacks: xiaomi/mimo-v2.6-pro, meta/muse-spark-1.3-contributor) turns the decision into a CFO-ready memo: headline, risk level, evidence, next action. Generation is the only job left for the expensive model.",
    rule: "The LLM explains decisions; it does not make them.",
    tone: "border-cyan-200",
    live: "Every flow ends with a real memo, source + latency shown.",
  },
  {
    icon: CircleDollarSign,
    tag: "Layer 4",
    name: "X402 payment rails — the doing",
    what: "The vendor-risk endpoint is a real HTTP 402 Payment Required challenge: price, network, accept header. Demo mode settles instantly; one env switch moves to Base mainnet USDC settlement.",
    rule: "Money moves in code, only on an approved decision.",
    tone: "border-amber-200",
    live: "Flow 1 receives the 402, pays, and attaches the report.",
  },
  {
    icon: UserCheck,
    tag: "Layer 5",
    name: "Human approval queue — the accountability",
    what: "Everything escalated — by rules or by Jev — waits for a finance controller to release or cancel, with an optional note. A model's 98% confidence is not permission; a human signature is.",
    rule: "Humans own irreversible money moves.",
    tone: "border-teal-200",
    live: "Flows 2 and 3 land in the queue on the dashboard.",
  },
  {
    icon: Database,
    tag: "Layer 6",
    name: "Supabase ledger — the memory",
    what: "Transactions, audit events, agent runs, and editable policies persist. This is what makes duplicate-blocking real across sessions, what the approval queue reads, and what compliance exports as CSV/JSON.",
    rule: "If it isn't in the ledger, it didn't happen.",
    tone: "border-slate-200",
    live: "Flow 4 re-runs flow 1 — and gets blocked by memory.",
  },
];

function LayerRow({ layer, index }: { layer: Layer; index: number }) {
  const Icon = layer.icon;
  return (
    <>
      <article className={`rounded-lg border bg-white p-5 shadow-sm ${layer.tone}`}>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {layer.tag}
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              {layer.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{layer.what}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p className="rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <span className="font-bold uppercase tracking-wide text-slate-500">Rule: </span>
                {layer.rule}
              </p>
              <p className="rounded-md bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-900">
                <span className="font-bold uppercase tracking-wide text-cyan-700">On this page: </span>
                {layer.live}
              </p>
            </div>
          </div>
        </div>
      </article>
      {index < layers.length - 1 ? (
        <div className="flex justify-center py-1">
          <ArrowDown className="size-4 text-slate-400" />
        </div>
      ) : null}
    </>
  );
}

const principles = [
  {
    icon: Layers,
    title: "Create / Decide / Do — three models, three layers",
    body: "The most expensive mistake in agent engineering is paying a frontier LLM to answer yes/no. Here the LLM writes, Jev decides, code executes. Each layer is independently testable and independently priced.",
  },
  {
    icon: ShieldCheck,
    title: "ML only ever tightens",
    body: "Jev cannot approve anything rules rejected, cannot release funds, and its escalations always route to a human — never to an auto-cancel. A wrong ML call costs a reviewer's minute; a wrong auto-approval costs real money.",
  },
  {
    icon: Gauge,
    title: "Cost is visible per decision",
    body: "Policy: free. Jev: ~$0.00002 and ~1s. Memo: seconds of cheap inference. The ledger exports with actor types, so finance can audit who decided what — model, agent, or human.",
  },
  {
    icon: ScrollText,
    title: "Degrades to safe, never to broken",
    body: "No key, timeout, or model outage returns null and the system runs rules-only. The demo never breaks mid-pitch — the AI layers are amplifiers, not dependencies.",
  },
];

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                AgentPayOps
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Architecture, explained end to end
              </h1>
            </div>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            href="/"
          >
            <Cpu className="size-4" />
            Back to the operations dashboard
          </Link>
        </header>

        <DemoOrchestra />

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Layers className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                What just ran — layer by layer
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Every button on the demo above hits these seven layers for real.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col">
            {layers.map((layer, index) => (
              <LayerRow index={index} key={layer.tag} layer={layer} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={principle.title}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="font-semibold text-slate-950">{principle.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{principle.body}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">The one-line version</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Agents request money the way APIs do (X402).{" "}
            <span className="font-semibold text-emerald-300">Deterministic policy</span>{" "}
            filters everything code can see.{" "}
            <span className="font-semibold text-violet-300">Jev</span> reads context
            and can only tighten the noose.{" "}
            <span className="font-semibold text-cyan-300">The LLM</span> writes the
            memo. <span className="font-semibold text-teal-300">A human</span> is the
            only thing that releases funds past an escalation, and{" "}
            <span className="font-semibold text-white">Supabase</span> proves the
            whole story afterwards.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-slate-400">
            <span className="rounded bg-white/10 px-2 py-1">npm run evals → falseApproveRate 0.000</span>
            <span className="rounded bg-white/10 px-2 py-1">npm run evals:jev → 5/5 gate checks</span>
            <span className="rounded bg-white/10 px-2 py-1">Jev ≈ $0.00002 / decision</span>
          </div>
        </section>
      </div>
    </main>
  );
}
