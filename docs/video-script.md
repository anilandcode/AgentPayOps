# AgentPayOps — Live Narration Script (90 seconds)

You're talking **while** recording — clicking and explaining at the same time. Short sentences. Built-in pauses for clicks. Conversational tone, not marketing-speak.

**Setup before you hit record:**
- Vultr URL loaded, dashboard visible, audit log empty
- 3 demo invoice files ready to drag in: `Invoice_Standard_Data.txt`, `Invoice_HighValue_Compute.txt`, `Invoice_Duplicate_Enrichment.txt`
- Take a breath. Press record. Wait one second of silence.

---

## Beat 1 — Hook (0:00–0:12)

**You're showing:** Dashboard hero, no clicking yet.

**You say:**
> "Hi. This is AgentPayOps."
>
> *(short pause)*
>
> "AI agents are about to start spending money — buying data, compute, APIs. But finance teams have no way to control that spend."
>
> *(beat)*
>
> "So we built the control layer. Let me show you."

---

## Beat 2 — Approved invoice (0:12–0:35)

**You're doing:** Click Invoice Intake → upload `Invoice_Standard_Data.txt` → fields populate → decision flips green.

**You say (while clicking):**
> "I'm uploading an invoice from a vendor-risk API."
>
> *(drag file in, wait for fields)*
>
> "Behind the scenes, Gemini is extracting the vendor, the amount, and the category."
>
> *(wait for decision to flip)*
>
> "Our policy engine runs against allow-lists, amount thresholds, and duplicate rules. This one's low-value and from a trusted vendor — so it's approved."
>
> *(scroll to memo)*
>
> "And here's the Gemini-written finance memo. Goes straight to the audit log."

---

## Beat 3 — X402 challenge (0:35–0:55)

**You're doing:** Scroll down to **Live Operations Center** → find the **"Live Agent Run"** card → make sure the first scenario **"Approve paid vendor-risk report"** is selected (left column) → click **"Run agent review"** button (top-right, dark, Play icon) → watch the 5 steps animate on the right side: protected endpoint → 402 challenge → policy decision → payment → audit.

**You say:**
> "Now the agent wants a paid vendor-risk report. I'll run the scenario."
>
> *(click "Run agent review")*
>
> "Watch this — the endpoint returns 402 Payment Required."
>
> *(hold 2 seconds on the 402 step in the workflow card)*
>
> "That's a real X402 challenge. Not a mock. The agent submits payment proof —"
>
> *(steps continue, policy checks card appears)*
>
> "— policy engine approves the spend, payment is issued, and the report releases. This is what programmable agent payments actually look like."

---

## Beat 4 — Escalated and Blocked (0:55–1:18)

**You're doing:** Still in the **Live Agent Run** card. Click the second scenario card on the left: **"Escalate high-value cloud invoice"** (Metro Cloud Brokers · €12,600). Click **"Run agent review"**. Wait for amber "Escalated" decision. Then click the third card: **"Block duplicate enrichment purchase"** (Apex Enrichment API). Click **"Run agent review"** again. Wait for red "Blocked."

**You say:**
> "Next scenario — high-value cloud invoice. Twelve thousand six hundred euros."
>
> *(click the second scenario card, then "Run agent review")*
>
> "This is above our autonomous threshold, so it escalates. The system doesn't auto-pay. A human reviews it."
>
> *(wait for amber Escalated badge to appear)*
>
> "Last one — duplicate enrichment purchase from a blocked vendor."
>
> *(click the third scenario card, then "Run agent review")*
>
> "Caught against the policy rules and the transaction history. Blocked. And the reasoning's right there in the policy checks."

---

## Beat 5 — Close (1:18–1:30)

**You're doing:** Scroll to Live Operations Center → 3 rows visible (approved, escalated, blocked) → hold on the audit log.

**You say:**
> "Three decisions. All persisted. All auditable."
>
> *(hold on the audit log for 2 seconds)*
>
> "AgentPayOps runs on Vultr, persists on Supabase, reasons with Gemini, and gates payments through real X402."
>
> *(brief pause)*
>
> "So every dollar your agents spend is governed. Thanks for watching."

---

## Live-narration survival kit

**If you stumble on a word:** keep going. Don't repeat. Editing out a small flub is 10 seconds in iMovie or QuickTime.

**If the demo lags:** fill with one of these phrases (memorize them):
- "Give it a second — the policy engine is evaluating in real time."
- "This is hitting our live Supabase, so there's a tiny network round-trip."
- "Gemini's reasoning takes about a second to generate."

**If you forget a line:** don't panic. The judge needs to see the *demo working*, not a perfect speech. Improvise around what you see on screen.

**Pacing self-check:** if you've talked for 30 seconds and haven't uploaded the first invoice, you're going too slow on the hook. Move.

**Cursor discipline:** between beats, park your cursor somewhere neutral. Don't wiggle it.

**Audio:** mic 6 inches from your mouth. Don't lean back. Don't smile while talking (it sounds odd on mic).

---

## The 30-second emergency cut

If anything breaks and you need a backup, record just this:

> "This is AgentPayOps — a finance control layer for AI agents."
>
> *(upload approved invoice)*
>
> "Agents submit invoices. Gemini extracts the details. Our policy engine decides: approve, escalate, or block."
>
> *(show 402 challenge)*
>
> "Paid actions go through real X402 — that's a 402 Payment Required, not a mock."
>
> *(scroll to audit log)*
>
> "Every decision is logged to Supabase. Deployed on Vultr. Thanks."

That's 30 seconds and still covers all four sponsor stacks plus the X402 differentiator.
