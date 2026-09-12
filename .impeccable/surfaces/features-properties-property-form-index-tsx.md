---
version: 1
slug: "features-properties-property-form-index-tsx"
primary_target: "features/properties/property-form/index.tsx"
related_targets: ["features/properties/property-form/property-form-dialog.tsx"]
---

SCOPE: Add Property full-screen modal and its responsive page variant. MODE: Operate. The primary user is a Surat broker recording a property and deal terms on a low-cost Android phone or a desktop during follow-up.

THESIS: Property entry is a guided deal workspace, not a long form in a centered card. The modal replaces the two-tab dialog with ten short, legible stages and keeps the live deal outcome visible without crowding the task.

OWN-WORLD: Inherit the product's cream canvas, white working surface, ink hierarchy, compact 12–16px corners, and restrained green state language. Private information is marked with text and a lock icon; no second accent hue, gradients, or ornamental elevation.

STORY: Choose what is being listed, locate it, describe it, record measurements and price, agree the commission, add proof, confirm the owner, then save a draft or publish. The user always knows the current stage, what is saved, and what remains before publishing.

FIRST VIEWPORT: A narrow persistent step rail sits left, the active step owns the wide center, and a compact live property/deal summary anchors the right. The header carries mode, save state, and close. On mobile the stepper becomes horizontal and the live commission collapses into a bottom strip above Back and Next.

FORM: Local extension of the established Operate surface; no concept seed was required by the precise supplied specification. Signature interaction: live commission figures re-enter softly as pricing changes, while the mobile deal strip expands into an in-context panel.

FINISH: Reviewed and documented on 2026-09-12 from the implemented source and the desktop/mobile review captures. The completed surface keeps the incumbent system: cream canvas, white work surfaces, ink and restrained green hierarchy, 12–16px corners, existing control/elevation tokens, and existing motion utilities. Its ten-step rail, live listing score, live deal summary, local-draft recovery, duplicate warning, and media-processing states are task-local patterns; they do not add or change a global visual token or component rule. `docs/DESIGN.md` remains the system source of truth and needs no change for this surface.
