# AgentPayOps — 60-Minute Submission Kit

Everything you need to paste, record, and ship in the next hour. Do **not** touch code.

## 60-Minute Schedule

| Min | Task | Tool |
|---|---|---|
| 0–5 | Cover image: screenshot the dashboard, slap title on top | Mac screenshot + Preview / Canva |
| 5–25 | Record 90-second video (re-record once max) | QuickTime / Loom |
| 25–45 | Build 6-slide deck — copy slide content from this file | Google Slides / Canva / Keynote |
| 45–55 | Fill lablab.ai submission form — copy text from this file | lablab.ai |
| 55–60 | Final check: submit, verify all 4 assets live | lablab.ai |

**Hard rule:** if anything runs over, cut quality, don't cut a section. A submitted-but-rough package beats a polished-but-late one.

---

## 1. Cover Image (5 min)

- Take a clean screenshot of the live Vultr URL dashboard with a successful agent run visible (approved scenario, audit log populated).
- Drop in Preview or Canva, add overlay text at top-left:
  - **Title:** AgentPayOps
  - **Subtitle:** Finance controls for autonomous AI agents
  - **Bottom-right tag:** X402 · Gemini · Vultr · Supabase
- Export at 1600×900 PNG. Done.

---

## 2. Video Script — 90 seconds (record in 20 min)

Use this verbatim. If you mess up a line, keep going — cut in post.

> **[0:00–0:10] Hook**
> "Autonomous AI agents are going to start buying things — data, compute, tools, services. Today, finance teams have no way to control that spend. AgentPayOps is the missing control layer."

> **[0:10–0:30] Approved scenario**
> "Here's an invoice from a vendor-risk API. The agent uploads it. We extract the vendor, the amount, the category — using Gemini. Policy engine evaluates it against our rules. It's a low-value, allow-listed vendor — approved. The audit log captures the decision and Gemini's reasoning."

> **[0:30–0:55] X402 + escalation**
> "Now the agent needs a paid vendor-risk report. The endpoint returns 402 Payment Required — real X402 challenge, not a demo. The agent submits proof of payment, the report is released. Next invoice: high-value cloud compute. Policy says escalate, not auto-approve. Decision flips."

> **[0:55–1:15] Block + persistence**
> "Third invoice: duplicate enrichment from an offshore vendor. Blocked — pattern match against historical transactions in Supabase. Every decision is now in our system of record."

> **[1:15–1:30] Close**
> "AgentPayOps is deployed on Vultr, persistent on Supabase, reasoning on Gemini, and gates payments through real X402 — so every dollar your agents spend is governed. Thanks."

**Recording tips:**
- One take. Don't redo.
- Screen-record the live Vultr URL, voiceover after if cleaner.
- Loom auto-trims silence. Use it.

---

## 3. Slide Deck — 6 slides (20 min)

Copy each slide's content into Google Slides. Use a single dark template (Slidesgo "Tech Dark" or similar).

**Slide 1 — Title**
- AgentPayOps
- Finance controls for autonomous AI agents
- Milan AI Week · AI Agent Olympics · B2B FinOps Track
- Your name + GitHub handle

**Slide 2 — Problem**
- "Autonomous AI agents will buy data, compute, and tools."
- 3 bullets:
  - No spend visibility per agent
  - No policy enforcement before purchase
  - No audit trail for finance / compliance
- Footer quote: "Every dollar an agent spends should be governed."

**Slide 3 — Solution (1-line + flow)**
- "A control plane that decides if an agent can spend, blocks bad spend, escalates risky spend, and logs every decision."
- Horizontal flow icon strip: Invoice → Extract (Gemini) → Policy → X402 Challenge → Decision → Audit (Supabase)

**Slide 4 — Live Demo Screenshots**
- 3 screenshots side-by-side: Invoice Intake / Decision card / Audit log

**Slide 5 — Architecture**
- Diagram with these boxes:
  - Browser → Next.js on Vultr → [/api routes]
  - /api/invoices/* → Gemini
  - /api/vendor-risk/report → X402 (402 challenge + paid retry)
  - All decisions → Supabase audit + transactions
- Caption: "Production-style. Real X402. Real Gemini. Real persistence."

**Slide 6 — Why us / Roadmap**
- Why now: X402 makes programmable agent payments possible for the first time
- Roadmap: multi-tenant SaaS · real on-chain settlement · 3 design partners
- CTA: github.com/anilandcode/AgentPayOps · live demo URL · contact

---

## 4. lablab.ai Submission Copy (paste-ready, 10 min)

**Project Title:**
> AgentPayOps

**Short Description (≤200 chars):**
> Finance control plane for autonomous AI agents. Reviews invoices, enforces policy, handles X402 payment challenges, produces audit-ready decision logs.

**Long Description:**
> Autonomous AI agents will soon buy data, tools, compute, and services on behalf of their organizations. Finance teams have no control plane for this. AgentPayOps is that missing layer.
>
> An agent uploads an invoice. AgentPayOps extracts vendor, amount, and category using Gemini. A policy engine evaluates against allow-list / block-list / amount thresholds / duplicate-purchase rules. The agent then attempts to call a paid vendor-risk endpoint, which returns 402 Payment Required (real X402 flow via @x402/next). The agent presents proof of payment, gets the report, and the decision plus full reasoning is persisted to Supabase as an audit-ready event.
>
> The result is three things finance teams actually want: (1) every agent payment is policy-checked before settlement, (2) duplicate or risky spend is blocked or escalated automatically, and (3) every decision — including Gemini's reasoning — is captured in a system of record.
>
> Built on Next.js 16, Tailwind 4, deployed on Vultr, persisted on Supabase, reasoning by Gemini, payments gated by real X402. Demo invoices and a 90-second walkthrough script are in the repository.
>
> Track fit: B2B FinOps & Compliance · Enterprise Utility · Agentic Workflows.

**Technology Tags:**
- Gemini
- X402
- Supabase
- Vultr
- Next.js
- TypeScript

**Category Tags:**
- B2B FinOps & Compliance
- Enterprise Utility
- Agentic Workflows

**GitHub:**
> https://github.com/anilandcode/AgentPayOps

**Demo URL (primary):**
> http://st2bm9ob1tiu62tc8jatrwlk.149.28.34.93.sslip.io/

**Demo URL (backup):**
> https://agent-pay-ops.vercel.app/

---

## Pre-Submit Checklist (5 min)

- [ ] Vultr URL loads and shows dashboard
- [ ] `/api/health` returns 200
- [ ] Video uploaded (YouTube unlisted or Loom)
- [ ] Slide deck uploaded (Google Slides shared link or PDF)
- [ ] Cover image uploaded
- [ ] All form fields filled
- [ ] GitHub repo is public
- [ ] README.md "Hackathon Submission" section visible at top of repo

Hit submit. Done.
