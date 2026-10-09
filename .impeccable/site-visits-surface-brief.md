# Site visits surface brief

## Scope and mode

Broker-side `/broker/visits` operating surface. Mode: Operate.

## Audience and job

A Surat broker opens this page in the morning and repeatedly during travel to see the day, find owner-published slots, book for buyer contacts, request a missing time, prevent schedule conflicts, contact both parties, navigate, and log outcomes without leaving the page.

## Content and constraints

Keep the global broker shell untouched. Preserve the existing warm green design system, centralized placeholder product name, shared avatar/property/contact patterns, INR formatting, and API boundary. Times are UTC in data and IST in UI. The three tabs and overlay states are URL-addressable. Mobile is the primary constraint.

## Direction contract

**THESIS:** Time is the page’s spine: a broker can scan one strong chronological line and understand the day. It refuses the dashboard default of isolated metric cards and the marketplace default of one card per slot.

**OWN-WORLD:** Warm cream canvas, flat white working rows, near-black green ink, one deep-green active/control family, tactile green slot buttons, quiet warm hairlines, amber waiting/travel signals, and red only for blocked or destructive states. Bricolage Grotesque leads only at page-heading level; DM Sans and tabular figures carry the work.

**STORY:** The broker first sees what needs attention today, then chooses between managing visits, finding bookable owner time, or resolving requests. Every booking connects a buyer, owner, property, time, and travel reality in one place.

**FIRST VIEWPORT:** A compact heading and live IST chip share the top row with Request a time and Book a visit. Beneath, six real filters form one continuous summary strip, then a full-width three-tab control. The selected tab immediately shows its operational control rail and first real rows; no decorative hero or stat-card grid delays the task.

**FORM:** Precisely specified operating surface within the established project world; no concept seed is needed. The memorable interaction is the horizontally running slot rail: roving keyboard focus, strong physical slot buttons, and one booked-state flip. Seed key: brief-pinned-site-visits.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

Backend owner-slot endpoints may not exist yet, so the approved mock adapter remains behind one flag until the separate API repository implements the supplied contract. Exact pipeline stage names remain product-wide open decisions; outcome copy uses the supplied temporary stage wording only where the approved brief requires it.
