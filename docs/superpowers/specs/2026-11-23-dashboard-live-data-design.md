# Broker dashboard — live data

Date: 2026-11-23
Repos: `broker-new-ui` (frontend), `broker-backend` (NestJS + Prisma)

## Intent

The broker dashboard (`/broker/dashboard`, `features/new-dashboard/`) still
renders several cards from hard-coded mock data. A broker opening it sees
someone else's visits, pipeline and commission. Every card must show the
signed-in broker's real data, every action on it must hit the API, and it must
be verified by running both apps against the real backend.

## Current state (audited)

| Card                              | Source today                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Header summary, stat strip, areas | Real — `GET /dashboard` (Redux `fetchBrokerDashboard`), `myListingsApi.summary`, `siteVisitsApi.list` (today) |
| My tasks (`DashboardTasksCard`)   | Real — `/tasks`                                                                                               |
| Your next visit, Today's visits   | Mock — `MOCK_VISITS`; outcome/delete mutate local state only                                                  |
| Pipeline overview                 | Mock — `MOCK_PIPELINE`, `MOCK_DEALS`                                                                          |
| Commission earned                 | Mock — `MOCK_COMMISSION`, labelled "Illustrative analytics"                                                   |
| Your listings, Recent updates     | Real path exists but the page passes `preview`, so mock data renders                                          |

## Goals

- Replace every mock source above with API data for the signed-in broker.
- Visit actions (mark attended / not attended, cancel, reschedule) persist via
  the existing slot endpoints.
- Each rewired card (visits, next visit, pipeline, commission, listings) has its
  own loading skeleton, inline error with Retry, and empty state.
- Dashboard numbers agree with the Visits, Pipeline and Earnings pages.
- After a mutation, dependent cards and other pages refresh.
- Mock mode (`isMockMode()`) keeps working for demos: mock data lives behind
  that flag only, never behind `preview`.

## Non-goals

- No new aggregated dashboard endpoint.
- No new test framework (no Playwright). Verification is by running the apps.
- No redesign. Layout stays as in the current screenshot (wording changes below
  only).
- No new activity event types in the backend.
- Deferred-scope items from `AGENTS.md` untouched.

## Anti-goals

- Any card silently falling back to mock data in live mode.
- Dashboard numbers disagreeing with Visits / Pipeline / Earnings for the same
  broker and period.
- Re-implementing logic that already lives in the visits/earnings services or
  `visit-rules`.

## Approaches

1. **Reuse existing endpoints + one small backend addition** — _chosen by user._
   Visits from `/slots/broker/bookings`, commission + pipeline from
   `/earnings/report`, listings/activity via their existing real paths. One
   source of truth per data kind; cards load and fail independently. Cost:
   ~5 requests per load.
2. New `GET /dashboard/overview` aggregate — one round trip but duplicates
   visit/earnings logic that would drift; cards couple to one failure.
3. Extend existing `GET /dashboard` — already ~1,800 lines and shared with the
   owner portal; would become the page's slowest call.

## Decisions

**User decided:**

- Approach 1.
- Pipeline counts are **deals**, labelled as such: gauge caption "Active deals",
  header line "You're working on N active deals", stat strip "Active deals ·
  In your pipeline". Header, stat strip and gauge all read the same source
  (`/earnings/report` `live`), so they always agree.
- Verification by running both apps (URLs + broker login supplied by user).

**Builder's calls (Claude), open to correction:**

- `/dashboard` stays the page gate: if it fails, the full-page error with Retry
  shows, as today. Per-card independence applies to the rewired cards.
- "Your next visit" looks beyond today: earliest upcoming visit, any date.
- "Needs update" includes unmarked past visits from earlier days, matching the
  Visits page count.
- Recent updates maps the categories the backend actually writes
  (`representation`, `clients`, `properties`, `calendar`, `team`, `profile`) to
  icons; anything else gets the generic activity icon. No task/preference
  events.
- Commission prev/next pages back at most 24 months; next disabled at the
  current month.
- Reschedule shown only for exclusive visits (`isExclusive`), linking to that
  visit on `/broker/visits`, matching the Visits page.
- "Delete visit" relabelled **Cancel visit**, behind a confirm.

## Design

### Backend (`broker-backend`)

Only change: `/earnings/report` `live` block gains per-stage asking value split
by sale vs rent, plus total monthly rent.

```ts
live: {
  ...existing,
  stageSaleValueInr: Record<DealStage, number>;   // sum of sale ask, live sale leads per stage
  stageMonthlyRentInr: Record<DealStage, number>; // sum of monthly rent, live rent leads per stage
  rentValueInr: number;                           // total monthly rent, live rent leads
}
```

- Computed in `earnings-report.ts` next to `stageCommissionInr`, from the same
  `LiveLead[]` (`amountInr`, `isRent`).
- Additive; add to response types + swagger.
- Tests: extend `earnings-report.spec.ts` and `test/earnings.e2e-spec.ts`.

### Frontend (`broker-new-ui`)

**Earnings client.** `lib/api/earnings.ts` maps the three new fields. Mock mode
builds the report in `features/earnings/earnings-math.ts`
(`buildEarningsReport`) — add the same fields there.

**Commission earned + Pipeline overview — one query.** Both read one
`useQuery` on `earningsApi.report` for the selected window (3 / 6 / 12 months
ending in the current IST month; prev/next shift by the window length, capped
at 24 months back). Buckets → bars (sale / rent split); left panel "this month
to date" from the last bucket; the period total from the buckets. `live` →
gauge (`stageCounts`), totals (`saleValueInr`, `rentValueInr`), per-stage values
(new fields). Remove the "Illustrative analytics" caption. Header line and stat
strip "Active deals" also read `live.count` from this query (shared query key),
instead of `view.pipelineCard.activeTotal`.

**Today's visits + Your next visit.**

- Today: `siteVisitsApi.list({ tab: "active", from/to: visitDateBounds("today",
now), sort: "start_asc", limit: 50 })`. `/slots/broker/bookings` takes
  `YYYY-MM-DD` IST dates. Add `"active"` to the frontend `VisitTab` type (the
  backend already accepts it).
- Needs update: `tab: "needs_update"`, no date bound (use its `total` / `counts`
  for the tab badge and header line).
- Next visit: `tab: "upcoming", sort: "start_asc", limit: 1`, no date bound.
- `BrokerVisit` gets optional `coverImage`, `amountInr`, `isRent`,
  `commissionPercent`, `commissionAmountInr`, mapped in `mapShowing` from
  fields the API already sends (`property.photos`, `salePrice` / `monthlyRent`,
  commission).
- Phase (upcoming / running / needs update) uses the existing visit-rules
  helpers, not a new derivation.
- Actions: mark attended / not attended → outcome endpoint; Cancel visit →
  cancel endpoint; Reschedule (exclusive only) → link; Call client → `tel:`,
  hidden when no phone. Price via `<PriceWithCommission audience="broker">`.
- After a mutation: invalidate the visit query keys and the earnings query, and
  re-dispatch `fetchBrokerDashboard()` (Redux — there is no React Query key for
  `/dashboard`).

**Your listings + Recent updates.** Stop passing `preview`; remove the
`preview` code paths. Mock rendering only under `isMockMode()`. Recent updates
keeps reading `view.activity` from `/dashboard`; extend `mapActivity` in
`features/dashboard/map-dashboard.ts` to keep `category` so icons can be
chosen. "Showing N of M" uses the summary count.

**States.** Each rewired card: skeleton on first load, inline error + Retry,
empty state with its primary action ("No visits today · Schedule visit", "No
upcoming visits", "No closed deals yet", "Add your first client").

**Cleanup.** Delete `mock-commission.ts` and `mock-work-overview.ts` once
unused; keep mock-mode fixtures where `isMockMode()` needs them.

## Verification

User provides running frontend + backend URLs and a broker login. Then:

- Backend: `npm test`, `npm run test:e2e` (earnings) pass.
- Frontend: `npm test`, `tsc`, `eslint` pass.
- Run-through at desktop and phone width: each card shows the broker's data;
  counts match the Visits / Pipeline / Earnings pages; tabs switch; period
  picker and prev/next move the chart; visit outcome and cancel persist after
  reload; listing delete works; an empty account shows empty states; with the
  backend stopped, rewired cards show errors with working Retry.
- Results summarised to the user, including anything not verified.

## Left to the builder

- Exact skeleton markup per card (reuse existing skeleton primitives).
- Query key names, following existing conventions.
