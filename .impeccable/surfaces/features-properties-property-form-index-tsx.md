---
version: 1
slug: "features-properties-property-form-index-tsx"
primary_target: "features/properties/property-form/index.tsx"
related_targets: ["features/properties/property-form/property-form-dialog.tsx"]
---

SCOPE: Add Property full-screen modal and its responsive page variant. MODE: Operate. The primary user is a Surat broker recording a property and deal terms on a low-cost Android phone or a desktop during follow-up.

## Direction contract

THESIS: Property entry is a warm deal workspace on cream canvas, not a white-on-white form. The active step owns a white working surface; chrome and preview sit quieter around it.

OWN-WORLD: Cream canvas shell, surface-muted step rail, white center stage with shadow-sm, restrained brand green for selection and primary actions. No second accent hue, no gradients, no ornamental glass. Live deal earnings may use one brand-ink attention card (existing private-income pattern).

STORY: Choose what is being listed, locate it, describe it, record measurements and price, agree the commission, add proof, confirm the owner, then save a draft or publish. The user always knows the current stage, what is saved, and what remains before publishing.

FIRST VIEWPORT: Header and footer stay white on cream. Left step rail is muted cream. Center is the only bright white work surface. Right preview stack sits on canvas with light resting shadows. Continue is the primary footer action.

FORM: Warm workspace (user-locked, code-led). Signature interaction: step content soft-enters; live deal figures re-enter as pricing changes.

FINISH: Code-led finish review completed 2026-10-06 against the Warm workspace contract. Authenticated screenshot captures were unavailable (route gated). Material fixes applied: Draft badge → neutral, mobile listing-score chrome → surface, FormSection nested card flattened, SectionLabel sentence case. Live brand-ink deal summary kept as the one private-income attention card. `docs/DESIGN.md` remains system source of truth; no new global tokens.

## Live sidebar contract

LISTING SCORE: Retain the ordered checklist as tasks are completed. Only the first unfinished applicable task is actionable; later unfinished tasks are disabled with a lock. Completed rows show a check and Complete. Recompute from draft values so clearing a requirement relocks later unfinished tasks. Rows use transparent backgrounds without a rectangular hover fill; keyboard focus remains visible. Desktop and mobile share the same checklist.

THESIS: Recognize the property first, check the deal breakdown, then finish on estimated commission. The sidebar extends the existing warm workspace.

OWN-WORLD: Two white cards on cream canvas, shared card corners and light resting shadows, restrained green prices, and one deep-green commission footer with soft-green supporting text. Draft remains neutral. These choices follow `docs/DESIGN.md` colour, surface and mobile guidance; no global tokens or system rules change.

STORY: Recognize the property through the actual listing-card hierarchy: cover and availability, draft status, asking price, property headline and location, then the broker's attached owner and contacts. Check commission after any co-broker split and copy the summary.

FIRST VIEWPORT: Photo first (full-width, 4:3), with no visible preview header. Availability badges overlay the photo; a top-right ellipsis menu holds cover replacement and removal. The empty state offers Add cover photo. Below: Status with neutral Draft, `PriceWithCommission`, a one-line headline using shared `formatPropertyTypeDisplay` / `formatPropertyCardArea` and exact `BEDROOM_OPTIONS` labels (preserving 1 RK and 6–10), then location. Broker owner/contact rows reflect actual draft attachments, including empty states. The deal card places aligned monetary rows on white before its full-width deep-green footer containing commission, the tax caveat and copy action. Rows wrap in narrow containers; help and copy targets are at least 44px.

FORM: Local, code-led extension of the established warm workspace; no new visual world. Existing digit animation remains the sole authored motion. Copy success changes the icon and visible status and stays until the summary changes. The compact variant retains the commission and price summary.

FINISH: Source verified against `live-summary-panel.tsx` and the incumbent warm workspace contract; typecheck passes. Live browser screenshots were unavailable, so rendered desktop/mobile layout and clipboard interaction remain unverified. No new raster assets or global tokens.
