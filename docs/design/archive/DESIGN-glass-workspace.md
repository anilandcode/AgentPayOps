---
name: AgentPayOps Glass Workspace
version: "alpha"
description: A calm, transparent finance workspace for a shared autonomous-agent demo.
colors:
  primary: "#163144"
  secondary: "#1B405B"
  mint: "#DFF3EB"
  canvas: "#F6FAF9"
  white: "#FFFFFF"
  text: "#163144"
  muted: "#526A73"
  gradientInk: "#25505E"
  border: "#C9DCD9"
  approved: "#176B52"
  escalated: "#9A5D0B"
  blocked: "#AA3E48"
  released: "#126C73"
typography:
  page-title: { fontFamily: Urbanist, fontSize: 2rem, fontWeight: 600, lineHeight: 1.15 }
  section-title: { fontFamily: Urbanist, fontSize: 1.5rem, fontWeight: 600, lineHeight: 1.25 }
  metric: { fontFamily: Urbanist, fontSize: 2.5rem, fontWeight: 600, lineHeight: 1.05 }
  body: { fontFamily: Urbanist, fontSize: 1rem, fontWeight: 400, lineHeight: 1.5 }
  label: { fontFamily: Urbanist, fontSize: 0.8rem, fontWeight: 600, lineHeight: 1.4 }
rounded:
  control: 12px
  card: 16px
  panel: 24px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
  panel-solid:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  panel-glass:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  panel-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
  supporting-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  gradient-label:
    textColor: "{colors.gradientInk}"
    typography: "{typography.label}"
  outlined-control:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
  status-approved:
    textColor: "{colors.approved}"
  status-escalated:
    textColor: "{colors.escalated}"
  status-blocked:
    textColor: "{colors.blocked}"
  status-released:
    textColor: "{colors.released}"
  border-rule:
    backgroundColor: "{colors.border}"
---

## Overview
A considered finance operating room: airy, composed, precise, and visibly alive. The reference images provide the blue-to-mint atmosphere, Urbanist type, floating paper sheets, soft glass, and restrained data marks. Financial decisions must remain easy to read and verify; the visual system never obscures an amount, status, actor, or next action.

## Colors
Deep blue `#1B405B` anchors the upper background; pale mint `#DFF3EB` transitions toward an almost-white `#F6FAF9` work surface. Deep navy `#163144` carries primary text and actions. White surfaces hold dense content. Muted ink `#526A73` is for supporting text on solid surfaces; darker `#25505E` is used for small labels over the gradient. Semantic status colors label approved, escalated, blocked, and human-released outcomes; every status is also expressed in words and an icon.

## Typography
Use locally served Urbanist throughout. Body copy is 15–16px, medium labels are 12–13px, page titles 28–32px, and primary metrics 36–40px. Use tabular numerals in amounts, counts, charts, and timestamps. Keep headings at 600 weight; light reference typography is interpreted through generous whitespace rather than low-contrast text.

## Layout
A 240px sidebar and flexible content region form the desktop shell. The content grid has a maximum width of 1440px, 24px gutters, and 24px gaps. Tablet navigation condenses into an icon rail. Mobile navigation uses a labelled drawer and 16px gutters. Charts and tables scroll within their own panels when necessary; pages do not overflow horizontally.

## Elevation & Depth
Use a blue-to-mint gradient behind the shell. Glass is reserved for the sidebar, header, and broad grouping panels: translucent white at approximately 65–80%, 16–24px blur, a fine white edge, and a subtle navy shadow. Tables, forms, evidence, and dialog bodies use near-opaque white. When backdrop blur is unavailable, panels render as solid pale surfaces. Layered invoice-sheet illustrations may sit behind overview shortcuts, never behind editable text.

## Shapes
Panels have 24px corners, nested cards 16px, controls 12px, and filters or status badges full pill corners. Chart strokes are thin, markers are small, grid guides are dashed, and fills are restrained. Icons use simple outlines. Focus rings are visible against both glass and solid surfaces.

## Components
Primary actions are navy with white text. Secondary actions are near-white with navy text and a fine border. Inputs and selection controls have explicit labels, 44px minimum touch height, and clearly distinct hover, focus, disabled, loading, and error states. Status badges combine words, icons, and color. A run timeline shows actual stage progress. Tables align numbers and offer a detail panel rather than cramming all evidence into rows. Confirmation dialogs explain that money movement is simulated. Motion lasts 180–240ms and respects reduced-motion settings.

## Do's and Don'ts
Do show the source of every metric and provider status. Do use real activity for charts; show an empty state when no activity exists. Do distinguish rules-only decisions from Jev-reviewed decisions. Don't use decorative controls with no behavior. Don't blur individual table cells or place navy text directly over the darkest gradient. Don't label simulated references as settled payments.

## Stitch Generation Notes
Generate each route from this document and the page requirements in `docs/design/UX-SPEC.md`. Keep the same Urbanist hierarchy, navy-to-mint atmosphere, frosted shell, solid data surfaces, and semantic status tokens across every screen. Example prompt: “Design the AgentPayOps Approvals page in the shared glass workspace. Show one selected escalated transaction, readable risk evidence, a note input, and explicit approve or reject demo actions; use the DESIGN.md tokens and mobile drawer behavior.” Reference images are indexed in `docs/design/references/INDEX.md`.
