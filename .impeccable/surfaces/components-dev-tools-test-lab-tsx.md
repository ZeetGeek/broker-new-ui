---
version: 1
slug: "components-dev-tools-test-lab-tsx"
primary_target: "components/dev-tools/test-lab.tsx"
related_targets:
  - "components/dev-tools/test-lab.module.css"
  - "app/layout.tsx"
  - "lib/testing/test-lab.ts"
  - "lib/testing/test-data.ts"
  - "lib/testing/test-network.ts"
  - "lib/testing/sample-api.ts"
  - "lib/testing/sample-visits.ts"
  - "lib/api/mock-mode.ts"
  - "components/shared/app-image.tsx"
  - "components/shared/property-placeholder-image.tsx"
  - "lib/media/property-placeholder.ts"
  - "features/properties/property-form/live-summary-panel.tsx"
---

# Test lab

Mode: Operate. Developers and reviewers switch app states across routes without
editing fixture files. This is an extension of the incumbent app identity.

## Direction contract

**THESIS:** One global setup controls sample volume, account state, and request
conditions. Apply explicitly, reload, and keep the active setup visible.

**OWN-WORLD:** Reuse the warm surface, muted surface, ink, border, and green
variables from `app/globals.css`, the existing body and display fonts, Tabler
registry icons, and the shared primary Button. Local panel styling does not
establish new global tokens or component rules.

**STORY:** Open Test lab, choose sample data or the live API, adjust grouped
controls, then apply. The active-state strip and closed launcher identify the
current data volume and New account state together; reset and project defaults
provide recovery.

**FIRST VIEWPORT:** A compact launcher sits at the lower right. Its non-modal
panel has a title, close action, active-state strip, scrolling control body, and
pinned Apply & reload/reset footer. Under 48rem, the panel uses a viewport inset
for a 360px phone layout. Long launcher state text truncates within the viewport.

**FORM:** Compact global testing panel, preserving the established interface.
No alternative-form exploration or seed key was supplied for this extension.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Behavior and constraints

- Source selection reveals the relevant sample controls. Volume choices are
  Less data, More data, Too much data, and Empty all. Volume controls fixture
  counts and emptying of snapshots, relations, and profile counters independently
  of account state. New account sets a first-day account date and incomplete
  profile; Less data, More data, and Too much data still populate the workspace
  and dashboard. Pair New account with Empty all to clear all sample records.
- Account type remains an account flag. Portal selection follows the existing
  Owner launch flag and introduces no team-management interface.
- Native labelled inputs, fieldsets, selects, visible focus styles, Escape
  dismissal, panel focus on open, and trigger focus restoration support keyboard
  use. The non-modal panel is a form: Apply submits it, and Enter requests
  submission without overriding native select, button, textarea, combobox, or
  text-composition interactions.
- Settings and sample sessions use the tab's test namespace. Applying reseeds
  sample storage without clearing real sessions or real task storage.
- Sample adapters simulate request conditions. Unsupported sample HTTP actions
  fail explicitly; sample requests and Google OAuth cannot reach the backend.
- Normal production builds hide the lab and ignore its saved settings. A
  deployed preview requires explicit build-time opt-in.
- Shared AppImage handles missing and failed sources with the centralized
  property placeholder; explicit `fallbackSrc={null}` preserves caller control.
  The property-form preview keeps Add cover photo above its placeholder, and
  empty listing photo collections no longer create unrelated stock photos.
- Usage and integration guidance live in `docs/TEST-LAB.md`.

## Documentation evidence and disposition

Checked the finished component, local stylesheet, root mount, settings, fixture
expansion, request simulation, sample adapter, session namespace, API fallback,
Google OAuth guard, usage documentation, `PRODUCT.md`, `docs/DESIGN.md`,
`app/globals.css`, `lib/fonts.ts`, and the shared Button.

For the user-reported More data + New account dashboard issue, rechecked the
volume/account separation, profile counters, dashboard test scenarios, form
submission, active-state labels, launcher truncation, shared AppImage fallback,
property placeholder wrapper, property-form cover action, and empty photo
handling. The build thread reported all 20 scenario tests and 34
compatibility/photo tests passing, with clean lint and formatting.

The established warm-neutral/green language is preserved. No new design world
or approved system change requires a root design specification or token
sidecar. Existing global design files were preserved.

Pre-existing drift remains: the launcher's expected root `DESIGN.md` is absent;
the incumbent authority is `docs/DESIGN.md` plus `app/globals.css`. Some documented
token examples (ink, muted surface, and brand text) differ from the runtime CSS.
This extension follows the existing runtime variables and does not repair that
drift.

Fresh finish-review disposition supplied for this documentation pass: **SHIP at
source-review scope**, with no remaining material source findings. The initial
new-UI detector reported `[]`.

The exact requested dark-green placeholder asset is not available locally.
Existing bundled placeholder files are light green; the request for the saved
asset's file path is pending. The shared fallback behavior is implemented, but
the exact requested artwork has not been delivered.

Visual/browser QA remains unavailable because the CUA host failed and the native
fallback state was inaccessible. The user's dashboard screenshot established
the original failure; no post-fix rendered captures or approved comp were
supplied. Rendered layout, overlap, clipping, and interaction outcomes have not
received visual verification. Documentation is complete at source-review scope
only.

### Latest stress-data follow-up

The user's Too much data + New account + online screenshot showed a task-loading
error and zero today's visits despite a next visit. Native browser reproduction
and `.next/dev/logs/next-development.log` confirmed that expanded task titles
exceeded the 160-character schema limit. Copied titles now stay within 160
characters, with edge-case labels capped at 155. Sample visit filtering compares
date-only bounds on the India calendar and timestamp bounds as numeric instants.
The shared task query root moved to v10 to discard the failed query cache, and
property-attention retries use that same root. No real storage was reset.

Regression coverage includes expanding exact 160-character titles to 300 tasks,
repeated task-storage reads, the actual `visitDateBounds("today")` path and visit
grouping, timestamp bounds, and exact 300-task/deal totals. Showing 225 active
deals from 300 deals across all stages is valid. The build thread reported all 50
targeted test-lab, task-preview-store, dashboard-visit, and site-visit/lookup tests
passing, with clean TypeScript, lint, and Prettier checks.

The fresh finish review returned **SHIP at source-review scope**, with no material
findings. This follow-up changes no UI, CSS, or global design rules and requires
no new design-detector run. Native CUA reproduced the original failure; later
accessibility was unavailable and the attempted capture showed another app or
user focus. There are no valid post-fix rendered captures, so rendered behavior
remains unverified. The earlier placeholder-asset request and global design drift
notes remain open as recorded above.
