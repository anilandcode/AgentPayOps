# AgentPayOps — Olive editorial redesign plan

Status: implementation authorized by the user on 2026-09-28; see DESIGN.md and the draft preview.
Date: 2026-09-28
Code baseline: `06c3529`, `codex/agentpayops-glass-workspace`.
Primary visual reference: [Nexora full-page image](references/nexora-olive/full-page.png).

## 1. Decision and scope

Replace the previous navy/mint workspace aesthetic with the supplied olive/lime, white, and near-black reference. The previous design relied too heavily on broad translucent rounded containers; the new design must establish hierarchy through section scale, typography, contrast, and whitespace.

Confirmed structure: a new public product homepage at `/`, with the live overview moved to `/dashboard`. Redesign all seven workspace screens to share the new visual language. Keep AgentPayOps branding and describe its actual finance-control demo.

The user subsequently authorized this UI implementation. Work is on the separate `codex/agentpayops-olive-redesign` branch. Production release remains a separate decision. The baseline implementation and its functional repairs remain the starting point.

## 2. What the reference actually establishes

The source is one static desktop image, 1504 × 8452 pixels. It establishes composition and visual treatment. It does not establish the exact font, breakpoint layouts, hover behavior, animation timing, or application-screen layouts. Those items below are proposed design decisions.

| Observed reference feature | Design rule for AgentPayOps |
|---|---|
| Centered page framed by a pale gray outer canvas | Use a centered marketing canvas with deliberate desktop framing; remove the outer frame on small screens |
| Small brand at left, centered capsule navigation, white action at right | Keep the header compact and subordinate to the headline; navigation links must work |
| Deep olive hero with a bright yellow-green lower glow | Keep the strongest atmospheric treatment in the hero; fade into white before the next content section |
| Fine grid, diagonals, and concentric circles behind the hero | Build a quiet SVG background with consistent strokes; keep it away from small copy and controls |
| Large, regular-weight, tightly set left-aligned headline | Use oversized neutral sans type with controlled two-line wrapping and a narrow text measure |
| Three translucent data cards at the hero's lower edge | Use one row of three live finance summaries; retain readable text throughout the glow |
| Centered section introduction, segmented tabs, large product stage | Show three working finance workflows in a large framed product demonstration |
| Alternation between white, warm gray, olive, and black bands | Use section contrast and whitespace to create hierarchy; avoid wrapping every section in another card |
| Restrained rounded corners, fine borders, mostly flat editorial blocks | Reserve pill shapes for controls and labels; reduce large-radius containers |
| Thin line artwork and precise chart marks | Use custom SVG finance/process illustrations, not generic decorative icon collections |
| Black closing CTA and multi-column footer | End with a clear route into the live demo and useful project links |

Do not copy the Nexora name, commerce claims, customer quotes, blog authors, stock product imagery, or numerical success claims into AgentPayOps.

## 3. Proposed visual system

Colors below are visual estimates from the supplied raster, not claimed source design tokens. Confirm them against the reference during the first rendered review.

| Token | Proposed value / behavior |
|---|---|
| Olive base | `#263000` for hero top and process section |
| Olive transition | `#586B08` through the center/lower hero |
| Lime light | `#CBE781` for the lower glow and selected accents |
| White | `#FFFFFF` for primary content sections and application surfaces |
| Warm surface | `#F6F6F3` for grouped supporting content |
| Outer canvas | `#EFEFF1` around the desktop marketing page |
| Ink / footer | `#121311` |
| Secondary text | `#60645B` on white; contrast-tested pale text on olive |
| Hairline border | `#E4E6DF` on light surfaces; subtle white on olive |
| Typography | Propose locally served Inter, weights 400/500/600; the exact reference font is unknown |
| Hero type | 64–80px desktop, 40–48px mobile; 0.95–1.02 line-height, tight tracking |
| Section headings | 36–48px desktop, 28–34px mobile; regular/medium weight |
| Workspace headings | 28–32px; body 15–16px; readable supporting text at least 12px |
| Metric figures | 32–44px with tabular numbers |
| Corners | 8–12px on cards; 16px on the product stage; full pills on buttons/tabs |
| Marketing rhythm | 96–128px section padding desktop, 56–72px mobile; 24–32px grid gaps |
| Workspace rhythm | 24–32px desktop gutters; 16px mobile gutters; compact content groups |
| Glass | Confined to hero summaries and product-stage chrome; start with 10–18% white over olive, 12–16px blur, fine white border |
| Dense data | Opaque white forms, tables, evidence, and dialogs |
| Motion | Proposed 180–240ms control transitions; brief section reveals; actual run progress only; reduced-motion support |

No persistent whole-page background animation, scroll hijacking, fake running charts, or automatic animated metric counts. A static screenshot cannot justify copying unseen motion. Brand lime must not substitute for semantic status: approval, review, blocked, and human approval keep distinct words, icons, and accessible colors.

## 4. Homepage section blueprint

The composition should closely follow the reference's visual sequence while reducing content that has no credible AgentPayOps equivalent.

| Order | Reference role | AgentPayOps content and interaction |
|---|---|---|
| 1 | Compact navigation | AgentPayOps logo; Workflow, Controls, Architecture anchors; Open workspace CTA |
| 2 | Olive hero and two-line promise | Draft headline: “Agent payments. / Clear decisions.” Supporting copy explains invoice intake, policy checks, optional AI review, and human approval. Primary: Start live demo. Secondary: See how it works. Place “Shared demo · Simulated payments” beside the action context |
| 3 | Three glass data panels | Spend reviewed, payments awaiting review, and recorded decisions/activity, all from the shared dataset. Show loading, empty, stale, and unavailable states distinctly. Cards lead to dashboard, approvals, and audit |
| 4 | Centered workflow showcase | “From invoice to recorded decision.” Functional tabs: Invoice intake, Policy review, Human approval. A large product stage shows a readable sample workflow with clear links into its real page. Any staged sample is labelled Sample; live results are labelled Live demo |
| 5 | Editorial explanation and proof strip | One concise statement connecting invoices, agent decisions, finance controls, and audit records. Proof blocks describe verified capabilities or current live counts; no invented revenue, customers, or savings |
| 6 | Dark olive process band | Left: fine-line process illustration. Right: Intake → Evaluate → Review → Record. Explicitly show Jev only when policy permits it and human review when escalation occurs. Link to the real architecture view |
| 7 | White principles section | Three spacious columns: Rules set the boundary; People decide exceptions; Every decision leaves evidence. Use restrained finance-related line illustrations |
| 8 | Pale-gray evidence section | Replace the testimonial with one traceable demo case: invoice, decision reason, provider state, and audit link. Use an actual recorded case or clearly labelled sample; no fictional customer quote |
| 9 | Compact project resources | Replace the four stock-photo blog cards with three useful links: Architecture, Demo guide, Source code. Use real project content and product imagery. Omit this section if it duplicates adjacent content |
| 10 | Near-black final CTA and footer | Product/audit visual on the left, “See a payment decision happen.” on the right. Start live demo action. Footer groups only existing destinations; no fake account, pricing, careers, or social controls |

The product stage is the primary visual asset. Use readable HTML/SVG and screenshots from the actual app instead of an unrelated AI-chat or food-packaging mockup. Avoid turning the whole stage into a static screenshot when a visitor expects a working control.

## 5. Workspace translation across every page

The screenshot does not contain an operational workspace. These layouts are deliberate adaptations that must be reviewed separately from homepage fidelity.

Use a narrow, opaque white navigation sidebar with subtle dividers, an olive active marker, a compact plain header, and a white/warm-gray content canvas. Preserve the desktop sidebar, tablet rail, and mobile labelled drawer interaction. Remove the current full-canvas blue/mint gradient, floating frosted header, and repeated oversized glass section wrappers. Use generous typography and flat groups; save olive contrast for the most important decision/action region.

| Route | Proposed structure and UX improvement |
|---|---|
| `/dashboard` | Compact introduction; four aligned live metrics; one broad activity chart; recent decision table; narrow review queue preview. Emphasize the next useful action without repeating promotional hero content |
| `/invoices` | Two-column document/extraction workspace. Left: sample selection, text or file input, clear supported formats. Right: editable extracted fields and evidence. Sticky bottom action area for evaluation. On mobile, input → fields → evidence → action |
| `/runs` | One focused scenario selector, prominent Run action, central step timeline, decision/evidence panel, and compact history. Remove the repeated grid of large cards with identical buttons. Show expected and actual outcomes together and preserve the current repeatable-clean/duplicate behavior |
| `/approvals` | Dense but readable queue at left, selected evidence and policy explanation at right. Stable approve/reject action area with confirmation. Clear item selection, conflict, empty, and success states |
| `/policies` | Policy navigation list and a single focused editor; labelled thresholds, vendor lists, enabled state, version, dirty-state indicator, and Save/Cancel bar |
| `/audit` | Large table as the primary surface. Events/transactions tabs, restrained filter row, pagination, export, and accessible detail drawer. Money, timestamps, actors, and provider evidence remain legible |
| `/architecture` | Olive introduction/diagram band above white technical detail. Diagram uses the reference's fine lines and generous spacing. The existing run controller supplies real stage status; progressively reveal provider and persistence details |
| `/presenter` | Supporting utility screen using the same typography and solid form style. Keep reset credential/session protections and active-run reset conflict behavior |

Every screen must include loading, empty, validation, error, retry, disconnected/stale, and partial-provider-success states where applicable. Preserve entered invoice fields and walkthrough state on navigation. Do not initially show an empty ledger while data is still loading.

## 6. Route and component implementation plan

Current source: `src/app/layout.tsx` wraps every route in `WorkspaceShell`, and that shell owns the shared data context. The homepage therefore needs a layout split, not a stylesheet override hiding navigation.

Proposed structure:

- Root layout: metadata, local fonts, skip link, and a separate shared `DemoDataProvider`.
- `(marketing)/page.tsx`: new `/` homepage and marketing header/footer.
- `(workspace)/layout.tsx`: workspace shell only.
- `(workspace)/dashboard/page.tsx`: existing overview behavior, redesigned.
- Existing invoices, runs, approvals, policies, audit, architecture, and presenter routes move into the workspace group without changing their public URLs.
- Update the sidebar Overview destination and internal overview links to `/dashboard`; brand/home actions explicitly lead to `/`.
- Preserve `/#approval-queue` compatibility through a small root-level hash redirect to `/approvals`.
- Retain existing APIs, shared Supabase demo tables, policy logic, approval conflicts, protected presenter reset, and provider-state distinctions.
- Split landing, shell, and component styles into readable modules; replace the current compressed global styling with named tokens and manageable component rules.

Core reusable components: capsule navigation, section label, editorial heading, primary/secondary button, hero summary, workflow tabs, product stage, process diagram, live metric, decision badge, data table, detail drawer, confirmation dialog, form field, and status banner.

## 7. Design documents and reference preservation

During planning, preserve this original image separately from the previous references and add this plan. During authorized implementation:

1. Archive the current `DESIGN.md` as the previous navy/mint specification.
2. Replace canonical `DESIGN.md` with the approved olive system using YAML tokens and the ordered sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Add Stitch guidance after those sections.
3. Update `docs/design/UX-SPEC.md` with the homepage, dashboard route, screen layouts, states, mobile behavior, API dependencies, and acceptance criteria.
4. Add an image-to-component reference index identifying hero, glass row, product stage, olive process band, editorial columns, and black footer. Identify values as observed, estimated, or proposed.
5. Add explicit prohibitions against copying the reference's fabricated business proof and unrelated product imagery.

Google's current format and validator: https://github.com/google-labs-code/design.md. Run `npx @google/design.md lint DESIGN.md`. Schema validation does not establish visual fidelity; that requires rendered comparison.

Suggested Stitch prompt:
“Use the attached Nexora screenshot as the composition reference for AgentPayOps. Match the olive-to-lime hero, fine geometric linework, tight regular-weight typography, three translucent hero summaries, generous white editorial sections, dark olive process band, and near-black footer. Use the approved DESIGN.md tokens. Keep AgentPayOps content and simulated-payment labels. Use real finance product views and working routes. For workspace screens use opaque readable data surfaces, restrained olive accents, and compact navigation. Do not spread glass across every section or recreate Nexora commerce content.”

## 8. Delivery sequence and visual review

1. Reference study: preserve the original, document section proportions and surface roles, confirm the homepage/workspace scope and palette choices.
2. Design specification: proposed tokens, typography, responsive rules, page blueprints, asset list, and component/state inventory.
3. Visual proof: build the homepage hero + first product section and the Invoice Intake screen at 1440px and 390px. Present side-by-side screenshots against corresponding reference sections. Review composition before propagating the system.
4. Homepage: complete the approved section sequence, responsive navigation, product stage, and real routes/data states.
5. Workspace: apply approved components to all seven screens and presenter utility; preserve connected demo behavior.
6. Verification: finish the visual and functional checks below, update docs and graphify, publish a new Vercel preview, and present the exact commit and URL.
7. Public release remains a separate user decision after preview review.

## 9. Acceptance criteria

Visual:
- At desktop size, recognizable reference hierarchy: compact capsule nav, dominant left-aligned olive hero, controlled lime glow, three aligned glass summaries, white product showcase, olive process band, black ending.
- Compare screenshots section by section at equal viewport widths. Check section scale, heading wraps, alignments, whitespace, chart legibility, and surface opacity rather than colors alone.
- Homepage and every workspace route reviewed at 1440, 1024, 768, and 390px. No page-level overflow; intentional dense table scrolling remains inside its container.
- Body and status text pass WCAG AA against actual composited backgrounds; visible keyboard focus, working tab order, focus restoration, 44px touch controls, and reduced motion.
- No low-contrast text lost in the glow, clipped content, placeholder imagery, decorative dead controls, or invented customer proof.

Functional:
- Homepage CTAs, section links, workflow tabs, workspace navigation, browser back/forward, and legacy approval anchor work.
- Two consecutive clean scenarios produce distinct invoices; the duplicate scenario blocks the latest matching paid invoice.
- Existing approval/rejection, edited invoice evaluation, policy saving/conflicts, shared counts, audit/export, and presenter reset behaviors survive the redesign.
- Valid text/image intake and invalid/oversized/unsupported-file errors remain understandable.
- Loading cannot masquerade as an empty ledger; network and provider failures preserve truthful source/status information.
- Run lint, production build, deterministic policy evaluations, DESIGN.md validator, and graphify update after code changes. Verify exact Vercel preview commit and actual page behavior.

Current known live limitation carried forward: Command Code failed in the two latest preview runs, with an aborted request in Vercel logs. UI work must retain the honest failure state. Provider reliability requires its own investigation before claiming a fully successful AI demonstration.

## 10. Confirmed choices

The user confirmed a new reference-style homepage plus a matching demo workspace, and close fidelity to the olive/lime palette, layout, and typography. These choices are part of the plan. Exact font identification and motion remain unresolved by the static image; the proposed local Inter typography must be judged visually against the reference before the full rebuild.
