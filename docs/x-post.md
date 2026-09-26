# AgentPayOps — X / Twitter Posts

Three variants. Pick one. Replace `[URL]` with the actual Vultr demo link.

---

## Variant 1 — Single post (~249 chars, fits standard X limit)

```
Built AgentPayOps for Milan AI Week.

AI agents are about to start spending real money. Finance has no control plane for it.

So I built one.

Invoice → Gemini → policy engine → real X402 → Supabase audit.

[URL]
github.com/anilandcode/AgentPayOps
```

Attach a dashboard screenshot. Image posts outperform text-only by a wide margin on X.

---

## Variant 2 — Thread (6 tweets, recommended for builders following you)

**1/**
Built AgentPayOps for the AI Agent Olympics at Milan AI Week.

AI agents are about to start spending real money. Finance has no control plane for that.

So I built one.

🧵

*(attach dashboard screenshot)*

**2/**
The flow:

An agent submits an invoice. Gemini extracts vendor, amount, category. A policy engine decides: approve, escalate, or block.

Every decision lands in Supabase as an audit-ready event.

**3/**
When the agent needs a paid resource (vendor-risk report, premium API), the endpoint returns a real X402 challenge: 402 Payment Required.

This is the part most teams fake.

I wired it through @x402/next directly. No mock.

*(attach screenshot of 402 response in workflow card)*

**4/**
Three demo scenarios:

→ Low-value trusted vendor: approved
→ High-value GPU compute (€12,600): escalated for human review
→ Duplicate enrichment from a sanctioned vendor: blocked and logged

Each runs the same pipeline. Different policy outcome.

**5/**
Stack:

- Next.js 16
- TypeScript + Tailwind 4
- Gemini for extraction + reasoning
- Supabase for transactions + audit log
- @x402/next + @x402/evm + @x402/core
- Vultr for deployment

**6/**
Live demo: [URL]
Code: github.com/anilandcode/AgentPayOps

If you work on agent infrastructure, FinOps, or programmable payments, tell me what you'd add next.

Especially curious about multi-agent budget caps and on-chain settlement.

---

## Variant 3 — Tag-the-sponsors version (use as Variant 1 if you want sponsor reach)

```
Built AgentPayOps for @lablabai's Milan AI Week hackathon.

AI agents will start spending real money soon. Finance has no control plane for it.

So I built one.

Powered by Gemini, Supabase, and a real @x402 integration on @Vultr.

[URL]
github.com/anilandcode/AgentPayOps
```

Notes on tagging:
- @lablabai (verify) — hackathon host
- @Vultr — cloud sponsor
- @x402 (verify the official handle before posting; check the official X402 docs/site)
- @supabase — persistence sponsor
- @GoogleAI for Gemini if you want broader reach; @GoogleDeepMind doesn't engage with hackathon posts

Don't tag accounts you can't verify exist. A broken tag looks unprofessional.

---

## Posting tactics

**Timing:** Post Tuesday–Thursday, 9–11am your timezone. X feed velocity is highest then.

**Image:** Tweet with image > tweet without. Attach the dashboard screenshot to tweet 1 of the thread (or the only tweet of Variant 1).

**Reply with the video:** Add the demo video URL as a self-reply 5–10 minutes after the main post lands. Keeps the main tweet light, gives algorithm engagement signals.

**Pin it:** If you don't pin anything else, pin this. Hackathon submissions are evergreen for the duration of the event.

**Cross-post:** LinkedIn first, X second, ~30 minutes apart. Different audiences, but if both fire at once you spread your initial engagement too thin.
