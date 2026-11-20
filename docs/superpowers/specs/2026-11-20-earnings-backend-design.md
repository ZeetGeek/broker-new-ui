# Broker Earnings — real data, backend-computed

Date: 2026-11-20
Repos: `broker-backend` (NestJS + Prisma + PostgreSQL), `broker-new-ui` (Next.js)

## Intent

The broker Earnings page (`/broker/earnings`) is a finished design running on
mock/sample data. Make every number on it real and backend-supported: the
backend filters by period and computes the report; the frontend only picks the
period and renders.

Today the page pages through `GET /clients/leads` 100 at a time until it has the
broker's entire pipeline, then `features/earnings/earnings-math.ts`
(`buildEarningsReport`) computes everything in the browser. In development it
shows invented deals (`sample-earnings.ts`) when the broker has none.

## Goals

- One backend endpoint returns the complete earnings report for a period.
- The database can filter deals by the date they were sold / lost.
- Commission on a sold deal is **locked when it is marked sold** (decision A):
  later edits to the property's commission never change past earnings.
- Existing sold/lost deals are backfilled so history shows up on day one.
- The page shows only real data; sample data is removed.
- Tested end to end: backend e2e against a real database, frontend unit tests,
  and a run of the real page against the local stack.

## Non-goals

- Owner portal earnings or any owner-side screen (broker CRM launches first).
- Team management screens. (Team _scoping_ of data follows existing rules — see
  Access.)
- Editing a sold deal's commission (decision C, later).
- Exports, dashboard reuse, payouts, invoices, tax.
- The legacy `deals` table (`Deal` model) — left untouched and unused here.

## Anti-goals

- A number on the page that differs from what the broker would compute from
  their own sold deals.
- Past months changing because an owner edited a listing.
- A deal with no commission set counted as ₹0 earned — it stays "unvalued", as
  the page already shows.
- Invented data ever reaching a real broker.

## Approaches considered

1. **Single report endpoint (chosen).** `GET /earnings/report` returns finished
   aggregates. Small payload regardless of deal count; one source of truth;
   reusable later. Cost: the report logic (~600 lines) moves to the backend with
   its tests.
2. Filtered deals endpoint, math stays in the browser. Less rewrite, but "All
   time" still ships every closed deal and the numbers live only in the browser.
3. Date filter on `/clients/leads` only — rejected: still raw deals and browser
   math, which is what this work removes.

## Data model (backend)

Add to `BrokerPropertyLead` (`broker_property_leads`):

| Column                        | Type          | Meaning                                                                      |
| ----------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `resolved_at`                 | timestamptz ? | When the lead entered `closed_won` / `closed_lost`. Null while live.         |
| `commission_percent_at_close` | float ?       | Sale deals: the property's commission % at that moment. Null for rent.       |
| `commission_inr_at_close`     | bigint ?      | Estimated brokerage in INR at that moment. Null = unvalued.                  |
| `is_rent_at_close`            | boolean ?     | Whether the deal closed as a rental. Set with `resolved_at`.                 |
| `amount_inr_at_close`         | bigint ?      | The base amount the commission was computed on (sale price or monthly rent). |

_Builder's call (from the review):_ the deal's sale/rent type and base amount are
locked alongside the commission, so an owner editing the listing's type or
prices after the sale moves nothing in history, and deal rows show the same
locked numbers the totals use. A null `commission_percent_at_close` is
unambiguous because `is_rent_at_close` says which kind of deal it was.

Index: `(broker_id, stage, resolved_at)`.

**Commission at close** uses today's frontend rule (`dealCommissionInr`):

- Rent: the property's `commission_amount` if > 0, else null.
- Sale: `commission_percent` if > 0, applied to the base amount, else null.
  Base = `closed_amount` if > 0, else the accepted offer amount, else
  `list_price` / the property's current sale price.
- Rounded to whole rupees.

Locked for **both** won and lost leads, so "commission that walked away with
lost deals" is stable too.

### "Sale & Rent" listings — the broker says which (decision A)

A listing with `transactionType = both` has a sale price and a monthly rent.
When the broker marks a deal on such a listing as sold:

- **Frontend:** the Mark as sold dialog (`features/pipeline/stage-note-modal.tsx`)
  shows a required two-option choice, **Sold** / **Rented**, above the final
  price, only for "Sale & Rent" listings. The final-price field's label and
  default follow the choice (sale price vs monthly rent). Sale-only and
  rent-only listings are unchanged.
- **API:** `UpdateLeadStatusDto` gains optional `closedAs: 'sale' | 'rent'`.
  Required (400 when missing) when moving a "both" listing to `closed_won`;
  ignored otherwise (the listing's own type decides).
- `is_rent_at_close` = `closedAs === 'rent'` for "both" listings, else the
  listing's type.

_Builder's call:_ paths with no broker choice — owner accepts an offer (offers
are on the sale price), auto-lost leads, and the backfill — use today's rule
from `mapLeadToDeal`: rent only when the listing is `rent`, or has a rent and no
sale price; otherwise sale.

### Every path that resolves or reopens a lead must maintain these columns

Put the computation in one helper (e.g. `resolveLeadFields(lead, property, stage, now)`)
and call it from each path:

1. `ClientService.updateLeadStatus` → `closed_lost`
2. `ClientService.closeLeadAsWon` (broker marks sold)
3. Owner accepts an offer → `closed_won` (`client.service.ts` ~1561)
4. `PropertySaleService.closePropertyInTx` — other live leads auto-lost
5. `RepresentativeService` (~1723) — live leads auto-lost when representation ends
6. `ClientService.reopenSoldLead` and any transition from a closed stage back to
   a live stage → clear all three columns.

A unit test per path asserts the columns are set (or cleared).

### Backfill migration

For every lead in `closed_won` / `closed_lost`:

- `resolved_at` = `at` of the latest `stage_history` entry whose `status` equals
  the current stage; fallback `updated_at`.
- `commission_*_at_close` = computed from the property's current commission
  (the best information available; documented in the migration).

## API

`GET /earnings/report` — new `EarningsModule` (controller + service).

Query:

| Param         | Required | Notes                                                    |
| ------------- | -------- | -------------------------------------------------------- |
| `from`        | no       | ISO date-time. Omitted = all time.                       |
| `to`          | yes      | ISO date-time, inclusive.                                |
| `compareFrom` | no       | Comparison window start. Both compare params or neither. |
| `compareTo`   | no       |                                                          |

400 when dates are invalid, `from > to`, or only one compare param is sent.

The frontend keeps resolving presets ("Last 6 months", "This FY", custom) into
dates — that logic and its copy ("the 6 months before") are already tested in
`earnings-math.ts`, and the backend stays preset-agnostic. Dates are computed in
India time (Asia/Kolkata); the backend buckets in Asia/Kolkata as well.

Response (camelCase; amounts are numbers in whole INR):

```ts
{
  window: { from: string | null; to: string };
  chartWindow: { from: string; to: string };
  chartTrimmed: boolean;
  bucketUnit: "week" | "month" | "quarter" | "year";

  earnedInr; saleEarnedInr; rentEarnedInr;
  previousEarnedInr: number | null;           // null without a compare window
  closedCount; saleClosedCount; rentClosedCount;
  previousClosedCount: number | null;
  lostCount; previousLostCount: number | null;
  winRate: number | null;                     // 0–100, rounded
  unvaluedClosedCount;
  avgDaysToClose: number | null;              // created_at → resolved_at, calendar days
  bestDeal: EarningsDeal | null;

  buckets: Array<{
    start: string;                            // ISO, bucket start in IST
    saleInr; rentInr; totalInr; closed; lost; lostInr;
    lostReasonCounts: Partial<Record<LostReasonKey | "other", number>>;
    isToDate: boolean;
  }>;

  lostReasonCounts: Record<LostReasonKey | "other", number>;  // always all five
  lostWithoutReasonCount: number;
  lostFromStages: Array<{ stage: DealStage; count: number }>;

  recentClosed: EarningsDeal[];               // newest 5
  areas: Array<{ key; locality; city; earnedInr; closedCount; unvaluedCount }>;

  live: {
    count; saleValueInr; saleCount;
    stageCounts: Record<DealStage, number>;
    stageCommissionInr: Record<DealStage, number>;
    stalledCount; potentialInr; valuedCount;
    likelyInr; likelyCount; acceptedOfferCount;
    topDeals: EarningsDeal[];                 // top 10 by commission
  };
}

type EarningsDeal = {
  id: string;
  status: "closed" | "lost" | DealStage;
  resolvedAt: string | null;
  buyerName: string;
  property: {
    title: string; isRent: boolean; amountInr: number;
    commissionPercent: number | null; commissionAmountInr: number | null;
  };
  commissionInr: number | null;
};
```

For sold and lost deals, `EarningsDeal.property.isRent`, `amountInr` and the
commission fields come from the `*_at_close` columns; for live deals, from the
current listing.

`DealStage` uses the frontend's names (`new | contacted | visit | negotiation`);
the backend maps `site_visit → visit` and `offer_made → negotiation` exactly as
`lib/api/pipeline.ts` does today. `LostReasonKey` = `price | bought_elsewhere |
not_responding | changed_mind`; anything else counts as `other`.

_Builder's call (from the review):_ in the top-level `lostReasonCounts`,
`other` counts **only** free-text reasons; deals with no reason are counted in
`lostWithoutReasonCount` alone. The frontend adds the two for the "Others" row.
In each bucket's `lostReasonCounts`, no-reason deals are folded into `other`
(the chart has no separate slot) — same as today's `buildEarningsReport`.

_Builder's call:_ all amounts are INR. The product launches in India only
(`AGENTS.md`); multi-currency listings are out of scope, and the report does not
group by currency.

Rules ported 1:1 from `buildEarningsReport` (its test file is the spec):

- Bucket unit by chart length: ≤ 62 days week (Mon start), ≤ ~3 years month,
  ≤ ~9 years quarter, else year. At most 36 buckets; older history trimmed and
  `chartTrimmed` set. All time charts from the first resolved deal, minimum the
  last 6 months.
- Lost-from-stage = last live stage in `stage_history` before the loss.
- Live pipeline is "right now", not windowed. Live commission uses the
  property's _current_ commission (not yet locked). Stalled = no stage change or
  contact for `STALLED_AFTER_DAYS` (14), same rule as the board.
- Sold/lost deals use the locked `commission_inr_at_close`.

Labels and copy (bucket labels, lost-reason labels, headlines) stay in the
frontend.

## Access

- Broker portal only; owners get 403. Guarded like the leads endpoints
  (`@RequireAccess('leads', 'view')`).
- Scope = exactly the leads `GET /clients/leads` would show this user:
  `brokerId` = holder broker profile and `client` = `clientAccess.resolve(userId).listWhere`.
  An organization owner therefore sees the team's deals, a team member their own
  — same as the pipeline today. No new team UI.

## Frontend

- `lib/api/earnings.ts`: `earningsApi.report({ from, to, compareFrom, compareTo }, signal)`.
  Maps the response into the existing `EarningsReport` shape (dates to `Date`,
  bucket labels via the existing `bucketLabels`, lost-reason labels/details via
  `DEAL_LOST_REASON_LABEL` / `DEAL_LOST_REASON_DETAIL`).
- `ValuedDeal.deal` becomes the slim `EarningsDeal`; update the few components
  that read deal fields (`earnings-deal-lists.tsx` reads `id`, `status`,
  `resolvedAt`, `buyer.name`, `property.title/isRent/amountInr/commission*`).
- `earnings-page.tsx`: query key includes the resolved window; keep the previous
  report on screen (dimmed) while a new period loads — never a blank screen.
- Delete `sample-earnings.ts` and the `SHOW_SAMPLE_EARNINGS_WHEN_EMPTY` path.
  Empty state = the existing "Your earnings will show here".
- `buildEarningsReport` stays only for mock mode (`NEXT_PUBLIC_USE_MOCK_DATA`),
  run over `MOCK_DEALS`, so offline development still works. Window, comparison
  and headline helpers stay as they are.

## Testing

- **Backend unit:** report computation ported from `earnings-math.test.ts`
  (buckets, trimming, comparison totals, win rate, unvalued, lost reasons,
  lost-from-stage, areas, live pipeline); commission-at-close helper; each
  resolve/reopen path sets or clears the columns.
- **Backend e2e** (`test/earnings.e2e-spec.ts`, same pattern as
  `tasks.e2e-spec.ts`): seed a broker with sold (sale + rent, with and without
  commission), lost and live deals across months; assert totals, window
  filtering, comparison, buckets; owner token → 403; another broker sees none of
  it; changing the property commission after a sale leaves earnings unchanged;
  a "Sale & Rent" listing closed as Rented counts as rent, and closing one
  without `closedAs` is a 400.
- **Migration:** run against the local database; spot-check backfilled rows
  against `stage_history`.
- **Frontend:** mapping tests for `lib/api/earnings.ts`; the Mark as sold
  dialog shows Sold / Rented only for "Sale & Rent" listings and sends
  `closedAs`; existing earnings tests keep passing.
- **End to end:** run the local stack, sign in as a seeded broker, mark a deal
  sold and one lost in the pipeline, open Earnings, switch periods, and confirm
  the numbers match the API and the deals.

## Left to the builder

- Prisma vs raw SQL for aggregation (deal counts per broker are small; loading
  the windowed resolved leads plus live leads and aggregating in TypeScript is
  acceptable if the queries are filtered by `resolved_at` in the database).
- Exact DTO class names, module layout, Swagger annotations.
- Whether the commission-at-close helper lives in `client` or a shared module.
