# AgentPayOps glass workspace UX specification

## Purpose and audience
A live shared demo for clients and recruiters. A first-time visitor should understand the problem in 30 seconds, complete the guided flow in two minutes, then explore each operating function. The seven public routes are Overview `/`, Invoices `/invoices`, Agent Runs `/runs`, Human Review `/approvals`, Payment Controls `/policies`, Audit `/audit`, and How It Works `/architecture`.

## Shell and navigation
Desktop: 240px sidebar, compact header, 1440px maximum content, 24px gutters. Tablet: icon rail with accessible tooltips. Mobile: labelled menu drawer and 16px gutters. Persist `Shared demo · Simulated payments` in the shell. Keyboard focus must be clear. Deep links, browser back/forward, and the former `/#approval-queue` destination must navigate correctly.

## Page contracts
| Route | Primary content | Primary action | Empty / error behavior |
|---|---|---|---|
| Overview | Four live totals, activity chart, recent decisions, pending preview, two layered shortcuts | Start guided demo | State source and refresh error; empty chart uses explanatory copy |
| Invoices | Sample/text/image intake left, editable extracted fields and evidence right | Analyze then run review | Unsupported PDF, oversize, invalid file, extraction unavailable are explicit |
| Agent Runs | Guided flow, individual scenarios, actual step timeline, memo and source | Run selected scenario | Show skipped Jev and rules-only fallback honestly |
| Human Review | Queue, filters, selected transaction, evidence, note | Confirm approve or reject demo payment | Conflict on already-decided item refreshes queue |
| Payment Controls | Policy list, form, dirty-state controls | Save valid changes | Database unavailable blocks edits rather than implying success |
| Audit | Transaction and event tabs, filter, pagination, details, export | Export matching ledger | Database errors are visible; exports are complete |
| How It Works | Seven-layer map, expandable technical details, connected demo | Run walkthrough | Each stage reflects an actual API result |

## Guided journey
Start at Overview. Run a clean purchase, then a rules escalation, then a Jev fraud review. Review an escalated item and inspect its audit event. Visitors may skip to any page. Run progress and unfinished invoice text survive route changes within the browser session. Expected and actual decisions remain separate, especially when a provider is unavailable.

## Shared demo behavior
Visitors share sample data and policies, while raw uploaded files are not retained. Show a notice asking for sample documents. Presenter reset is authenticated and targets only this demo dataset. A reset must wait for or reject active runs. Concurrent policy edits and human decisions yield a conflict and reload current data. No action moves real funds; all payment references are marked simulated.

## Responsive and state behavior
Use 1440, 1024, 768, and 390px review widths. No page-level horizontal overflow. Dense tables may scroll inside panels. All controls have loading, success, error, disabled, and focus states. Show retry actions for recoverable failures and do not replace failed live data with unlabeled samples. Respect reduced motion, 44px touch targets, readable text contrast, and semantic labels.

## API dependencies and acceptance
Overview, queue, audit, and charts read one authoritative dataset. Run details and pagination are server-backed. Policies and decisions are validated on the server. Providers report completed, skipped, unavailable, or failed. A preview uses separate demo tables from the current public ledger. Verify two concurrent browsers, policy edit conflict, double approval conflict, complete CSV/JSON export, supported file uploads, provider timeout, database failure, and presenter-only reset. Run lint, build, deterministic policy evals, Google DESIGN.md validation, visual/responsive checks, and graphify refresh.
