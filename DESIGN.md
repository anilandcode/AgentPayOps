---
name: AgentPayOps Olive Editorial
version: "alpha"
description: An editorial marketing page and precise finance-control workspace for a shared, simulated payment demo.
colors:
  primary: "#263000"
  olive: "#263000"
  oliveMid: "#586B08"
  lime: "#CBE781"
  white: "#FFFFFF"
  warmSurface: "#F6F6F3"
  outerCanvas: "#EFEFF1"
  ink: "#171A13"
  footer: "#111311"
  muted: "#60645B"
  border: "#E2E5DC"
  approved: "#1B7052"
  escalated: "#9A5D0B"
  blocked: "#A83A46"
  released: "#136F6C"
typography:
  hero: { fontFamily: Urbanist, fontSize: 7rem, fontWeight: 400, lineHeight: 0.93 }
  section: { fontFamily: Urbanist, fontSize: 3.7rem, fontWeight: 400, lineHeight: 1.04 }
  page: { fontFamily: Urbanist, fontSize: 2rem, fontWeight: 500, lineHeight: 1.15 }
  body: { fontFamily: Urbanist, fontSize: 1rem, fontWeight: 400, lineHeight: 1.5 }
  label: { fontFamily: Urbanist, fontSize: 0.75rem, fontWeight: 700, lineHeight: 1.3 }
rounded:
  control: 8px
  card: 12px
  stage: 15px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 110px
components:
  marketing-canvas:
    backgroundColor: "{colors.outerCanvas}"
    textColor: "{colors.ink}"
  hero-glow:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.olive}"
  supporting-section:
    backgroundColor: "{colors.warmSurface}"
    textColor: "{colors.muted}"
  page-footer:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.white}"
  hairline:
    backgroundColor: "{colors.border}"
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  secondary-action:
    backgroundColor: "{colors.white}"
    textColor: "{colors.olive}"
    rounded: "{rounded.pill}"
  data-surface:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  hero-summary:
    backgroundColor: "{colors.oliveMid}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
  status-approved:
    textColor: "{colors.approved}"
  status-escalated:
    textColor: "{colors.escalated}"
  status-blocked:
    textColor: "{colors.blocked}"
  status-released:
    textColor: "{colors.released}"
---

## Overview
AgentPayOps makes agent payment decisions understandable. The public homepage uses a deep olive hero, a controlled lime glow, geometric lines, a row of three glass summaries, spacious white editorial sections, a dark olive process band, and a near-black ending. The workspace translates that language into readable, solid operational surfaces. It serves visitors exploring a shared finance-control demo; payments are simulated. The reference establishes visual composition, not customer proof or product facts. The source image is indexed in `docs/design/references/INDEX.md`.

## Colors
Use olive `#263000` for the hero, process band, primary workspace actions, and selected high-value regions. Transition toward `#586B08` and `#CBE781` at the lower hero; keep text-bearing summaries dark enough to remain readable over the glow. White `#FFFFFF` carries dense data and broad editorial sections. Warm gray `#F6F6F3` separates supporting sections; `#EFEFF1` frames the marketing canvas on desktop. Ink `#171A13` anchors text and the footer is `#111311`. Supporting text is `#60645B` on opaque white, with a fine `#E2E5DC` border. Approval, escalation, blocking, and release use their semantic colors plus written status and icons. Never use lime alone to convey a decision.

## Typography
Use the locally served Urbanist family at 400, 500, and 600. The exact font in the raster reference is unknown; Urbanist was checked against the rendered checkpoint. Marketing hero type scales from roughly 45px mobile to 112px on wide desktop with tight tracking and a two-line composition. Editorial headings use 36–59px and a regular weight. Workspace page headings are 28–32px; body is 15–16px. Labels are at least 11–12px and dense table text stays legible. Amounts and counts use tabular figures. Do not reduce opacity on small copy over the glow.

## Layout
The marketing page is a centered canvas with a 28px pale outer frame on desktop and edge-to-edge layout below 680px. Its header has a compact brand, centered capsule navigation, and a white action. Hero summaries form a three-column row, stack on mobile, and link to their source screens. Section padding is about 110px desktop and 70px mobile. The showcase uses working tabs and a labelled sample product stage. The workspace has a 224px solid white sidebar, a compact white header, and warm content canvas with 18–48px gutters. Tablet uses an icon rail; mobile uses a labelled drawer. Forms and tables stay opaque; dense table overflow is contained in its own scroll region. Follow the screen contracts in `docs/design/UX-SPEC.md`.

## Elevation & Depth
Atmosphere belongs to the hero: restrained radial gradient, fine SVG circles/grid/diagonals, and translucent summaries with blur. The product stage may use a soft shadow and layered paper. The rest of the site uses section contrast, hairline borders, and whitespace. Workspace sidebar, forms, tables, dialogs, and evidence are solid. When blur is unsupported, the hero summaries remain readable through their olive-tinted fill.

## Shapes
Cards use 8–12px corners, the product stage 15px, and actions, filters, labels, and capsule navigation use full pills. Thin chart marks and geometric linework are precise and quiet. Icon line weight is restrained. Avoid repeated oversized rounded wrappers and broad glass containers.

## Components
Marketing: capsule navigation, hero label, two CTA variants, live summary links, workflow tabs, sample product stage, proof strip, process diagram, principle columns, recorded case, resource links, and closing CTA/footer. Workspace: sidebar/rail/drawer, compact header, metric, scenario selector, decision badge, invoice input and extracted fields, queue/detail layout, policy editor, audit table, timeline, drawer, confirmation dialog, and status banner. Controls have 44px touch targets, visible focus, disabled/loading/error states, and reduced-motion behavior. Loading, empty, stale, disconnected, retry, and partial provider outcomes must be labelled accurately. The homepage's sample workflow is explicitly labelled; live summaries identify the dataset source.

## Do's and Don'ts
Do compare the rendered page section by section against the reference, checking scale, whitespace, heading wraps, surface opacity, and glow contrast. Do use actual AgentPayOps routes, recorded activity, and truthful provider states. Do preserve input and run state across navigation. Do show simulated payment context. Don't copy the reference brand, commerce imagery, customer quotes, revenue, testimonials, authors, or invented success metrics. Don't place data entry on glass, animate fake metrics, hide unavailable providers, or show an empty ledger while loading.

## Stitch Guidance
Use the indexed Nexora raster as a composition reference for AgentPayOps: olive-to-lime hero, fine geometric linework, tight regular-weight typography, three translucent summaries, generous white sections, dark olive process band, and near-black footer. Use AgentPayOps workflows and actual demo data. For operational screens, use opaque data surfaces, compact navigation, restrained olive accents, and semantic status colors. The screenshot is desktop-only; responsive layouts are proposed in the UX specification and require rendered review.
