# Property details

Mode: Operate. Primary target: `features/properties/property-detail/property-detail-page.tsx`.
Related targets: `features/properties/owner-listings/owner-listing-detail-page.tsx`, shared detail layout, gallery and action rail.

## Direction contract

THESIS: User-selected Airbnb-style property presentation: contained photography, open sections and one decision panel. Replace the full-width banner and disconnected boxes.

OWN-WORLD: The portal's warm canvas with one white detail surface and matching action cards, existing green actions, existing fonts and shared corner tokens. Sections separate through spacing instead of horizontal rules. Shared Button variants handle actions and gallery/read-more controls; shared Badges label status with stone, amber or emerald according to state. Preserve the surrounding portal and its established identity, as documented in docs/DESIGN.md §5.8.

STORY: Identify the property, inspect real photos and facts, then take the action permitted by ownership and representation consent.

FIRST VIEWPORT: A 1120px centered container on the standard warm portal canvas, title and location above an adaptive gallery with a 432px maximum height on larger screens. Below, a broad white information surface with spacious unruled sections and a 350px sticky price/action panel (310px on tablet). Phone: single 4:3 photo, stacked surfaces, utility targets of at least 44px and a persistent price/48px primary action bar replacing portal bottom navigation below 768px, with safe-area spacing.

FORM: User-pinned Airbnb reference, code implementation. Each photo is individually rounded with the existing control-radius token. Four photos use a large left image and two rows on the right (two upper tiles, one lower tile spanning their combined width). Facts use an open grid with Tabler icons and no fact or section dividers. Optional location/property facts and accepted brokers render only from API values. No new raster imagery, generated listing photographs or fabricated maps, reviews, booking calendars, people, claims or amenities. Signature interaction: real listing photos open into a full-screen dialog with arrow-key navigation, Escape dismissal and focus restoration; missing photos have an explicit empty state.

FINISH: Documentation merged into the existing docs/DESIGN.md; no root DESIGN.md or design sidecar was introduced. Source-only finish reviews completed and their findings were addressed at source scope. Reported validation: all 30 tests, typecheck and the layout detector passed; ESLint passed after import sorting. Browser access was unavailable, so desktop/phone rendering, visual fit to the reference and live interactions have not been visually verified. No new raster assets require provenance.

## Conditions

Owners manage publication and requests. Brokers browsing owner supply request representation, respond to invitations or open approved deals; exact address and owner contact are gated until representation is approved. Approval flows the existing property into the CRM without manual re-entry. Broker custom inventory exposes editing and linked owner contact without representation requests. Listing asks reuse PriceWithCommission with the correct audience, including the phone bar. Facts reuse derive and FIELD_RULES through property-detail-facts.ts rather than a second visibility matrix. Additional facts must come from the actual API payload and its mapping; do not infer missing data or add unsupported fields.

Costs, availability and suitable-use details use supplied API values. Exact parking, country and visibility survive mapping; missing parking or furnishing does not become a fabricated fact. Total floors can appear independently of a unit floor when applicable.

## Source review observations

The action card now reuses the existing shadow-md token. Unrelated older guidance in docs/DESIGN.md, including its lib/format.ts reference and fixed pipeline-column example, was left untouched.
