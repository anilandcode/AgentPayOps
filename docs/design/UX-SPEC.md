# AgentPayOps olive editorial UX specification

## Purpose and route map
The public `/` page introduces the real finance-control demo. `/dashboard` is the live overview. The seven workspace screens are `/dashboard`, `/invoices`, `/runs`, `/approvals`, `/policies`, `/audit`, and `/architecture`; `/presenter` is a supporting utility. Payments are simulated. Keep the root `/#approval-queue` legacy anchor pointing to `/approvals`.

## Homepage
Compact brand, capsule anchor navigation, and workspace action sit over an olive-to-lime hero with quiet geometric lines. Two-line promise, two working actions, and three ledger-derived summaries lead into a centered workflow showcase. The three tabs show Invoice Intake, Policy Review, and Human Approval with a labelled sample stage and a real route link. Continue with an editorial statement and capability strip, dark olive four-stage process, three control principles, actual recorded case or explicit empty/error state, three real resource links, and near-black final CTA/footer. No customer testimonial, stock commerce imagery, or invented growth figures. On mobile the navigation becomes a labelled menu; summaries, stage, process, proof, and footer stack without page overflow.

## Shared shell
Desktop: 224px opaque white sidebar with olive active marker and compact white header; warm canvas and solid data surfaces. At 769–1024px use a 70px icon rail with accessible link titles; at 768px and below use a labelled drawer with scrim, Escape closure, focus trap, and focus return. Header always states `Shared demo · Simulated payments`. Brand goes to `/`; Overview goes to `/dashboard`. Forms, evidence, and tables never sit on translucent backgrounds.

## Screen contracts
| Route | Layout and primary task | States and constraints |
|---|---|---|
| `/dashboard` | Four live metrics, broad activity chart, next review action, recent decisions, and route shortcuts | Source and refresh error visible; chart and decisions explain actual empty state only after loading |
| `/invoices` | Olive action header; sample/file/text input left; editable extracted fields and evidence right | Sample selection, upload formats and 6 MB maximum, unsupported PDF, extraction error, loading, and output empty state explicit. Input persists in session. On mobile input precedes output and action. |
| `/runs` | Guided next action, one scenario selector and primary run action, live step timeline, recorded outcome, compact history | Expected and actual separate; clean runs repeat, duplicate blocks latest matching paid invoice; provider skipped/unavailable/failed states truthful. |
| `/approvals` | Filter row, queue left, selected evidence and decision right | Confirmation before approve/reject; conflict reloads; no selection, empty, loading, sample-only, and success clearly labelled. |
| `/policies` | Focused list/editor, thresholds and vendors, enabled state, save/cancel and dirty indicator | Validation, version conflict, sample-only, and save error visible. |
| `/audit` | Large table, tabs, restrained filters, pagination/export, detail drawer | Money, timestamps, actors, source, and provider evidence readable. Loading and API error cannot masquerade as empty. Dense table scrolls within panel. |
| `/architecture` | Olive introduction, seven expandable layers, actual run status and technical details | Active stage reflects run controller; no fabricated completion. |
| `/presenter` | Solid credential and reset utility | 30-minute session messaging; reset guards and active run conflict retained. |

## Data and interaction rules
Homepage summaries and workspace totals come from the shared ledger, identified as live or sample. Preserve provider distinctions and human decision conflicts. Uploaded files are processed in memory; recommend sample documents on the public demo. The guided journey runs a clean purchase, escalation, optional risk review, human decision, then audit; visitors can enter anywhere. Refresh while visible, preserve invoice draft and walkthrough position in session, and distinguish connection errors from no records.

## Responsive and visual checkpoint
Compare the homepage hero/showcase and Invoice Intake at 1440px and 390px before propagating treatments. Inspect all routes at 1440, 1024, 768, and 390px. Review section proportions, heading wraps, glow contrast, form order, table containment, and no page-level horizontal overflow. The desktop preview checkpoint was inspected; mobile requires an actual viewport rendering before acceptance. Keyboard focus, tab order, focus restoration, 44px touch controls, semantic labels, WCAG AA text contrast, and reduced motion are required.

## Verification
Run lint, build, deterministic policy evaluations, and `npx @google/design.md lint DESIGN.md`. Check links, workflow tabs, back/forward, legacy anchor, two clean runs and duplicate result, edited invoice evaluation, approval conflict, policy save, audit export/details, valid and invalid uploads, presenter reset, and provider failures on the branch preview. Release is separate from this draft preview. Current known Command Code failure remains a truthful provider state and is outside this UI redesign.
