# YesBroker

> **The name "YesBroker" is a PLACEHOLDER.** The real product name has not been
> decided yet. Do not treat it as final branding. Keep the name in one place
> (a config constant or env var) so it can be changed in a single edit later.
> Do not scatter it across UI copy, page titles, or file names.

---

## What this platform is

A real estate CRM and marketplace for the **Indian market**, connecting two
sides of a property deal in one system:

- **Owners** — property owners and builders who have property to sell or rent
- **Brokers** — real estate agents and agencies who find buyers/tenants

Most existing products do only one of these. Listing portals hold owner supply
but give brokers no pipeline. Broker CRMs give a pipeline but the broker must
type in every property by hand. This platform connects the two.

---

## The core loop (this is the whole product)

```
Owner lists a property
  → Broker browses the live property pool
  → Broker sends a "request to represent"
  → Owner approves or rejects
  → On approval, the property lands in the broker's CRM pipeline automatically
  → Broker works the deal to close
```

The critical property of this loop: **no manual re-entry anywhere.** The
property is entered once, by the owner, and flows into the broker's pipeline
on approval. If a change would force a broker to retype property data, that
change is wrong.

The approval step is consent-gated and **bidirectional** — an owner can also
invite a specific broker, not only wait for requests.

---

## Roles — there are only TWO

**Owner** and **Broker**. That is the complete list.

There is **no** admin role, **no** agency role, and **no** team-member role.
If a feature seems to need one, it does not — re-read this section.

Account type is a **flag on the account**, not a role:

| `account_type` | Chosen at signup as                    | Can manage a team? |
| -------------- | -------------------------------------- | ------------------ |
| `individual`   | Independent Owner / Independent Broker | No                 |
| `organization` | Builder Company / Broker Agency        | Yes                |

Organization accounts can create and manage a **team** — add members, set
configurable access, define assignment rules, suspend or remove members. Team
members sit **under** the organization account. They are still just Owner or
Broker; being on a team is not a third role.

---

## Domain vocabulary

Use these exact terms. They mean specific things.

| Term                     | Meaning                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Representation**       | The consent-gated relationship between an owner and a broker for a specific property. Created by request + approval. |
| **Request to represent** | A broker asking an owner for permission to represent a property. Not a purchase, not an inquiry.                     |
| **Broker property lead** | An owner-facing mirror of a broker's CRM client record. Denormalized on purpose.                                     |
| **Portal**               | The owner-side vs broker-side split of the app. A user sees one portal, never both.                                  |
| **Pipeline**             | The broker's CRM stages a client moves through toward a closed deal.                                                 |

Note on user-facing language: internal terms are not always the right words to
show users. "Request to represent" reads better to an owner as something like
"a broker wants to sell your property." Plain language wins in the UI.

---

## Market context

- Target market is **India**; first launch is a **single city** (Surat),
  not a nationwide rollout
- Users are onboarded **by hand** in the first phase, from personal contacts —
  not through marketing or paid acquisition
- Users are **not technical**, and will mostly be on **inexpensive Android
  phones**, not laptops
- Money is in **INR**; property prices are large numbers and are read in
  lakh/crore terms, not raw digits

---

## Repo boundary

This repository is the **frontend only**.

The backend is a **completely separate repository** (`yesbroker-api`,
NestJS + Prisma + PostgreSQL). It is **not** a monorepo.

Never assume backend files, schema files, migrations, or server code exist in
this repo. Data comes from the API over HTTP.

---

## Scope — what is NOT being built yet

The first phase is deliberately narrow: make the core loop work well in one
city, on a phone. The following are explicitly **deferred** and should not be
built, scaffolded, or designed for right now:

- WhatsApp Business API automation
- Payments, subscriptions, or pricing tiers
- In-app chat or messaging between users
- Ratings, reviews, and public reputation scores
- Team management UI (the data model supports it; the screens are later)
- Any AI features (listing writer, matching, lead scoring, price suggestion)
- Buyer-facing accounts or buyer login

If a request seems to need one of these, flag it rather than building it.

---

## Open questions

These are genuinely undecided. Do not invent an answer — ask.

- Final product name and domain
- What "free" means and for how long
- Exact pipeline stage names and count

---

## UI conventions (icons)

**All app icons come from Tabler** via one registry:

`components/shared/icons.tsx`

```tsx
import { WhatsAppIcon, CallIcon, Search, MapPin } from "@/components/shared/icons";
```

Rules:

1. **Never import from `lucide-react`.** The app uses Tabler only. If
   `npx shadcn add` reintroduces Lucide in `components/ui/`, remap those
   imports to `@/components/shared/icons` immediately.
2. **Never import `@tabler/icons-react` directly** in feature / UI code. Add
   the icon to `icons.tsx` first, then import from there — so the glyph stays
   the same everywhere.
3. **Product actions use semantic names** so Call / WhatsApp never drift:
    - `WhatsAppIcon` — every WhatsApp CTA
    - `CallIcon` — every dial / `tel:` CTA
    - `MailIcon` — email channel actions
4. Prefer short aliases already in the registry (`Search`, `MapPin`, `Check`)
   for general UI. Type for icon props: `AppIcon` (not `LucideIcon`).
5. To add an icon: update `scripts/generate-icons-module.mjs` (or add a
   semantic export in `icons.tsx`) and re-run the generator if needed.

---

## UI conventions (price)

**Listing ask prices** (sale price, monthly rent on a property) always render
through `<PriceWithCommission>` from `components/shared/price-with-commission.tsx`.

Do **not** use bare `<Price>`, `formatPriceInr` / `formatRentInr` in JSX, or a
hand-rolled hover tip for those amounts.

| Role   | When commission is set      | When commission is unset          |
| ------ | --------------------------- | --------------------------------- |
| Broker | "You get ₹…" (+ detail)     | "Owner hasn't added a commission" |
| Owner  | "Broker gets ₹…" (+ detail) | "You haven't added a commission"  |

Pass `audience="broker"` or `audience="owner"` to match the portal. Pass
`commissionPercent` (sale) and/or `commissionAmountInr` (rent). Prefer `size`
(`xs`–`2xl`) over one-off type classes. Empty tip is on by default
(`showEmptyTip`). Price stays underlined whenever a tip exists (dashed when
unset, solid when a fee is set) so dense boards like Pipeline stay discoverable.

**Exceptions — keep `<Price>` or `lib/format/price`:** buyer offers, budgets,
totals ("₹X in play"), per-sqft helpers, form live previews, and any amount that
is not a listing ask. Formatting still goes through `lib/format/` — never inline.

Full reuse table: `docs/REUSE.md`.

---

## UI conventions (list filter chrome)

**Same filter language, different chrome.** Do not copy the Owner listings
marketplace top bar onto every property-related page.

| Screen kind            | Chrome                                                                                                                                                                                                                                                             | Examples                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Marketplace browse** | Multi-segment **top search band** (Where, Looking for, Budget, Area, Category, Property type) + Advanced **Filters** sheet for type-specific + extras (BHK, furnishing, ready-to-move when visible; listed age, commission) + optional quick chips / search / sort | Broker **Owner listings** (`/broker/owner-listings`)                                               |
| **Normal list / CRM**  | **Filters** button (opens a sheet) with only the dims that page needs — plus page-specific tabs, chips, search, sort. No marketplace band                                                                                                                          | My Deals, Your listings, Pipeline, Visits (and owner mirrors: requests, properties, leads, visits) |

Rules:

1. The band is for **discovering an unknown pool**. CRM and inventory screens
   are smaller, job-specific lists — status, stage, date, and person filters
   usually matter more than the full discovery set.
2. Reuse option labels and meaning (sale/rent, BHK, etc.) across pages; do
   **not** force the same six band controls onto every list.
3. On phone, a six-segment band burns the first viewport — reserve it for
   marketplace only.
4. Layout detail and anti-patterns: `docs/DESIGN.md` §5.6.

---

## UI conventions (conditional property filters)

**Filters are condition-based — same idea as the Add Property form.** A control
that cannot apply to the current selection must be **hidden**, not shown empty
or disabled-with-noise. When it hides, **clear its value** so a stale BHK /
furnishing / etc. does not keep filtering the list.

Authority for “when does this field exist on a listing?”:

- `lib/visibility/derive.ts` — flags (`isPlot`, `isResidential`, `isInBuilding`, …)
- `lib/visibility/rules.ts` — `FIELD_RULES` visibility per form path

Browse / list filters must follow those rules (or a thin shared helper derived
from them). Do **not** invent a second visibility matrix in the filter UI.

Examples (non-exhaustive — read `FIELD_RULES` for the full set):

| Selection                                      | Hide / clear these filters                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Category or type is **plot / land** (`isPlot`) | BHK, bathrooms, balconies, furnishing, parking, floor, property condition, ready-to-move |
| Category is **not residential**                | BHK (and other residential-only dims)                                                    |
| Looking for **sale only**                      | Rent commission amount range (show sale % if commission filters exist)                   |
| Looking for **rent only**                      | Sale commission % range                                                                  |
| Category is **agricultural**                   | Nearby-place style filters (form hides nearby places here)                               |

Also:

1. **Property type options** shrink to the selected **category** (same lists as
   `PROPERTY_TYPES` in `constants/property.ts`).
2. **Budget presets** switch sale vs rent with Looking for (already on Owner
   listings).
3. When the user changes category / type / Looking for, clear every filter that
   just became hidden — same as the form’s `stripHidden` spirit.
4. Never show a filter for an attribute the Add Property form does not collect
   for that selection.
