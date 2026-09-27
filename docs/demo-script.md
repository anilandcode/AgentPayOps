# AgentPayOps live workspace narration

1. Open Overview. Explain that every number comes from the same shared demo dataset. Say clearly: payments are simulated.
2. Open Invoice Intake. Select a sample or upload a supported sample document, run extraction, then confirm or edit vendor, invoice ID, amount, and category. Choose **Evaluate this invoice** to carry the fields to Agent Runs.
3. In Agent Runs, run **Clean purchase**. Inspect the policy checks, actual decision, Jev state, memo source, latency, and audit persistence. A policy approval may result in a simulated payment completion; no funds move.
4. Run **Rules escalation**. Jev should say *skipped by policy*. Open Human Review, inspect policy reason and amount, add a note, and confirm a simulated approval or rejection. A second browser session should see the changed queue after refresh.
5. Run **Jev fraud review**. If Jev responds and tightens the decision, show the added human-review item. If unavailable or failed, say this is a rules-only decision and do not claim fraud was detected. The optional Command Code memo has a 12-second request budget in guided runs; a failed or unavailable memo uses a labelled deterministic explanation.
6. Open Audit & Transactions. Filter records, inspect details, and export all matching records as CSV or JSON.
7. Optional: run **Duplicate purchase** after the clean purchase and **Blocked vendor**. Show how the first is based on recorded history and the second on policy.
8. Open How It Works for the seven-stage explanation. Presenters may use `/presenter` to reset only the new demo dataset; reset is blocked while a run is active.

If the database banner says unavailable, stop the shared-data demonstration. Verify the preview Supabase migration and environment before presenting the run as live.
