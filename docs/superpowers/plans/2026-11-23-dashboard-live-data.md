# Broker Dashboard Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every mock data source on `/broker/dashboard` with the signed-in broker's real API data, with one additive backend field set.

**Architecture:** Reuse existing endpoints. `/earnings/report` feeds Commission earned, Pipeline overview and the header's "Active deals" (one React Query per window). `/slots/broker/bookings` feeds Today's visits, Your next visit and needs-update counts (three queries). Listings and Recent updates switch off their `preview` path. Backend gains per-stage sale/rent values on `live`.

**Tech Stack:** Next.js + React Query + Redux Toolkit (frontend, tests `tsx --test "lib/**/*.test.ts"`); NestJS + Prisma + Jest (backend).

**Spec:** `docs/superpowers/specs/2026-11-23-dashboard-live-data-design.md`

## Global Constraints

- **No git commits in either repo.** The user commits manually. Leave changes uncommitted.
- Frontend tests must live under `lib/**/*.test.ts` (the only glob `npm test` runs); they may import from `features/`.
- Icons only from `@/components/shared/icons`; listing ask prices only via `<PriceWithCommission audience="broker">`.
- UI copy: "Active deals" (gauge caption, header line, stat strip); "Cancel visit" replaces "Delete visit".
- Mock data renders only under `isMockMode()`; never via a `preview` prop in live mode.
- Dates sent to `/slots/broker/bookings` are IST `YYYY-MM-DD` (use `visitDateBounds`).
- Commission paging: windows of 3 / 6 / 12 months ending in the current IST month; back at most 24 months; next disabled at the current month.
- Reschedule only for `isExclusive` visits (reuse `getVisitActions`).
- `/dashboard` (Redux) stays the page gate; rewired cards each own loading / error+Retry / empty states.

## Review Focus

1. **Broker with zero data** (new account: no deals, visits, listings, closes) — every card shows its empty state with its primary action, no `NaN`, `₹0 Cr`, or division by zero in the gauge. Owner: Tasks 3, 5, 6.
2. **Visit whose property was deleted / has no photos or price** (`property: null`, `photos: []`, `salePrice: null`) — card still renders with placeholder cover and no price row. Owner: Task 4.
3. **Window crossing the IST month boundary** (e.g. `now` = 30 Nov 2026 23:00 IST = 30 Nov 17:30 UTC, or 1 Dec 00:15 IST) — the commission window's current month is the IST month, not the UTC one. Owner: Task 2.
4. **Visit action fails** (409 already marked / network error) — toast with the server message, card stays as it was, no optimistic ghost. Owner: Task 5.
5. **Rent-only pipeline** (all live leads rent) — "Total sale value ₹0" hidden or shown as "—", per-stage shows only "/mo" values. Owner: Task 3.

---

### Task 1: Backend — per-stage asking value on earnings `live`

**Files:**

- Modify: `broker-backend/src/earnings/earnings-report.types.ts` (`EarningsReportResponse.live`)
- Modify: `broker-backend/src/earnings/earnings-report.ts` (~line 420, `live:` block)
- Modify (if a Swagger response class for the report exists in `src/earnings/dto/`): add the three fields
- Test: `broker-backend/src/earnings/earnings-report.spec.ts`, `broker-backend/test/earnings.e2e-spec.ts`

**Interfaces:**

- Produces on `live`: `stageSaleValueInr: Record<DealStage, number>`, `stageMonthlyRentInr: Record<DealStage, number>`, `rentValueInr: number`.

- [ ] **Step 1: Write the failing unit test** in `earnings-report.spec.ts` inside `describe('buildEarningsReport')`:

```ts
it("live: splits asking value per stage into sale and monthly rent", () => {
    const r = buildEarningsReport(
        input({
            live: [
                liveLead({ stage: "new", isRent: false, amountInr: 9_500_000 }),
                liveLead({ stage: "new", isRent: true, amountInr: 22_000 }),
                liveLead({ stage: "visit", isRent: true, amountInr: 28_000 }),
                liveLead({ stage: "negotiation", isRent: false, amountInr: 37_000_000 }),
            ],
        }),
    );
    expect(r.live.stageSaleValueInr).toEqual({ new: 9_500_000, contacted: 0, visit: 0, negotiation: 37_000_000 });
    expect(r.live.stageMonthlyRentInr).toEqual({ new: 22_000, contacted: 0, visit: 28_000, negotiation: 0 });
    expect(r.live.rentValueInr).toBe(50_000);
    expect(r.live.saleValueInr).toBe(46_500_000);
});
```

Use the spec file's existing builders for input/live leads (rename `input`/`liveLead` to whatever the file already uses).

- [ ] **Step 2: Run** `npx jest src/earnings/earnings-report.spec.ts -t "splits asking value"` — expect FAIL (`undefined`).
- [ ] **Step 3: Implement** the three fields next to `stageCommissionInr`, using `stageRecord` and `input.live` filtered by `isRent`.
- [ ] **Step 4: Run** `npx jest src/earnings` — expect all PASS.
- [ ] **Step 5: E2E assertion.** In `test/earnings.e2e-spec.ts`, in the test that seeds "an owner's listing this broker represents, with one live deal on it", assert `body.live.stageSaleValueInr` / `stageMonthlyRentInr` contain that deal's amount in its stage and `rentValueInr` matches. Run `npm run test:e2e -- earnings` — PASS (needs the test DB the suite already uses).
- [ ] **Step 6: Full backend check** `npm test && npx tsc --noEmit -p tsconfig.json && npx eslint src/earnings` — all clean.

---

### Task 2: Frontend — earnings types, mock parity, dashboard window helper

**Files:**

- Modify: `features/earnings/earnings-math.ts` (`EarningsReport["live"]` type ~line 582; `buildEarningsReport` ~line 815)
- Create: `features/new-dashboard/commission-window.ts`
- Test: `lib/api/earnings.test.ts` (extend), `lib/api/dashboard-commission-window.test.ts` (new)

**Interfaces:**

- Consumes: Task 1 field names.
- Produces:
    - `EarningsReport["live"]` gains `stageSaleValueInr`, `stageMonthlyRentInr` (both `Record<DealStage, number>`), `rentValueInr: number`.
    - `export type CommissionMonths = 3 | 6 | 12;`
    - `export const COMMISSION_HISTORY_MONTHS = 24;`
    - `export function maxCommissionPage(months: CommissionMonths): number` → `24 / months - 1` (3→7, 6→3, 12→1).
    - `export function commissionSelection(months: CommissionMonths, page: number, now: Date): EarningsSelection` → `{ preset: "custom", customFrom, customTo }` where `customFrom` = first day of the IST month `months*(page+1)-1` months before the current IST month, `customTo` = last day of the IST month `months*page` months before it (page 0: `now`).
    - `export const DASHBOARD_DEFAULT_MONTHS: CommissionMonths = 6;`

- [ ] **Step 1: Failing tests** in `lib/api/dashboard-commission-window.test.ts`:

```ts
const NOW = new Date("2026-11-23T09:30:00Z"); // 23 Nov 2026, 3:00 pm IST
test("6 months, page 0 covers Jun–Nov 2026", () => {
    const s = commissionSelection(6, 0, NOW);
    assert.equal(s.preset, "custom");
    assert.equal(istDateKey(s.customFrom!), "2026-06-01");
    assert.equal(istDateKey(s.customTo!), "2026-11-23");
});
test("6 months, page 1 covers Dec 2025–May 2026", () => {
    const s = commissionSelection(6, 1, NOW);
    assert.equal(istDateKey(s.customFrom!), "2025-12-01");
    assert.equal(istDateKey(s.customTo!), "2026-05-31");
});
test("IST month boundary: 1 Dec 00:15 IST is December", () => {
    const s = commissionSelection(3, 0, new Date("2026-11-30T18:45:00Z"));
    assert.equal(istDateKey(s.customFrom!), "2026-10-01");
});
test("paging cap is 24 months", () => {
    assert.deepEqual(
        [3, 6, 12].map((m) => maxCommissionPage(m as CommissionMonths)),
        [7, 3, 1],
    );
});
```

(`istDateKey` from wherever `features/new-site-visits/model.ts` imports it.)

- [ ] **Step 2: Failing test** in `lib/api/earnings.test.ts`: mock mode `buildEarningsReport` over deals in `new` (sale ₹95 L) and `visit` (rent ₹28,000) returns `live.stageSaleValueInr.new === 9_500_000`, `live.stageMonthlyRentInr.visit === 28_000`, `live.rentValueInr === 28_000`; and `mapEarningsReport` passes the three API fields through unchanged.
- [ ] **Step 3: Run** `npx tsx --test lib/api/dashboard-commission-window.test.ts lib/api/earnings.test.ts` — FAIL.
- [ ] **Step 4: Implement** the type fields, the mock computation in `buildEarningsReport`, and `commission-window.ts`. Confirm `resolveEarningsWindow` for `custom` respects `customTo` (end of that IST day); if it clamps or shifts, adjust the helper, not the shared function.
- [ ] **Step 5: Run** the two tests + `npm test` — PASS.

---

### Task 3: Commission earned + Pipeline overview + header "Active deals" on real data

**Files:**

- Create: `features/new-dashboard/use-dashboard-earnings.ts`
- Modify: `features/new-dashboard/commission-earned.tsx`, `features/new-dashboard/work-overview.tsx` (`PipelineOverview`), `features/new-dashboard/new-broker-dashboard.tsx` (stat strip + header line)
- Delete: `features/new-dashboard/mock-commission.ts`; remove `MOCK_PIPELINE`, `MOCK_DEALS` use from `work-overview.tsx`
- Test: `lib/api/dashboard-pipeline-view.test.ts` (new)

**Interfaces:**

- Consumes: Task 2 `commissionSelection`, `DASHBOARD_DEFAULT_MONTHS`, `maxCommissionPage`; `earningsReportQueryOptions(selection, now)`.
- Produces:
    - `useDashboardEarnings(months: CommissionMonths, page: number, now: Date)` → the `useQuery` result over `earningsReportQueryOptions(commissionSelection(months, page, now), now)`, `enabled` when auth hydrated, `placeholderData: keepPreviousData`.
    - `export function pipelineView(live: EarningsReport["live"]): { total: number; saleValueInr: number; rentValueInr: number; stages: { id: DealStage; label: string; count: number; saleValueInr: number; rentValueInr: number; color: string }[] }` (pure, in `use-dashboard-earnings.ts` or a sibling `pipeline-view.ts`). Labels: New, Contacted, Site visit, Negotiation; colors `bg-stage-1..4`.

- [ ] **Step 1: Failing test** `lib/api/dashboard-pipeline-view.test.ts`: from a `live` with `stageCounts {new:10,contacted:7,visit:4,negotiation:3}`, `stageSaleValueInr.new = 23_000_000`, `stageMonthlyRentInr.new = 22_000`, assert `total === 24`, `stages[0]` = `{ id:"new", label:"New", count:10, saleValueInr:23_000_000, rentValueInr:22_000 }`, stage order new→negotiation; and an all-zero `live` gives `total 0` and four zero stages.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** `pipelineView` — PASS.
- [ ] **Step 4: Wire `CommissionEarned`.** `months` state (default 6) and `page` (0..`maxCommissionPage`). Bars from `report.buckets` (`saleInr`, `rentInr`, label from mapped bucket labels, `isToDate` → `*`). Headline = sum of bucket `totalInr`; left panel "<Month> to date" = last bucket `totalInr`, `closed` deals, sale/rent split. Remove "Illustrative analytics" text and the illustrative aria copy. Prev disabled at max page; next disabled at page 0. States: skeleton while `isPending`; inline error + Retry (`refetch`) on `isError`; when `!report.hasResolvedDeals` show "No closed deals yet" + link to `/broker/pipeline`.
- [ ] **Step 5: Wire `PipelineOverview`** to `useDashboardEarnings(DASHBOARD_DEFAULT_MONTHS, 0, now)` → `pipelineView(report.live)`. Gauge caption "Active deals". Hide the "Total monthly rent" column when `rentValueInr === 0` and "Total sale value" when `saleValueInr === 0`; per-stage `/mo` line only when that stage's rent > 0. Format via `lib/format/price` (these are totals, not listing asks). Empty (`total === 0`): "No active deals yet" + "Add client" action. Error + Retry; skeleton.
- [ ] **Step 6: Header.** In `new-broker-dashboard.tsx` the stat strip "Active deals" value and the header line read `useDashboardEarnings(DASHBOARD_DEFAULT_MONTHS, 0, now).data?.live.count` (null while loading/error → existing "—" rendering). Mock mode keeps `view.pipelineCard.activeTotal`.
- [ ] **Step 7: Verify** `npm test && npx tsc --noEmit && npx eslint features/new-dashboard lib/api` — clean.

---

### Task 4: Visit data — richer `BrokerVisit`, `active` tab, dashboard visit queries

**Files:**

- Modify: `lib/api/site-visits.ts` (`BrokerVisit`, `VisitListQuery.tab`, `mapShowing`)
- Create: `features/new-dashboard/use-dashboard-visits.ts`
- Test: `lib/api/site-visits.test.ts` (extend)

**Interfaces:**

- Produces:
    - `BrokerVisit` optional fields: `coverImage?: string`, `amountInr?: number`, `isRent?: boolean`, `commissionPercent?: number | null`, `commissionAmountInr?: number | null`.
    - `VisitListQuery.tab: VisitTab | "active"` (do **not** add `"active"` to `VisitTab`; `counts: Record<VisitTab, number>` stays).
    - `useDashboardVisits(now: Date | null)` → `{ today, needsUpdate, next }`, three `useQuery`s under `[...VISITS_KEY, "list", "dashboard", …]`:
        - `today`: `{ tab: "active", ...visitDateBounds("today", now), sort: "start_asc", limit: 50 }`
        - `needsUpdate`: `{ tab: "needs_update", sort: "start_desc", limit: 20 }`
        - `next`: `{ tab: "upcoming", sort: "start_asc", limit: 1 }`
          All `enabled: hydrated && now && !isMockMode()`; call `useVisitsLive(today.data?.nextChangeAt ?? null, today.dataUpdatedAt)` once.

- [ ] **Step 1: Failing tests** in `lib/api/site-visits.test.ts`:
    - `mapShowing` with `property.photos ["a.jpg","b.jpg"]`, `transactionType "sale"`, `salePrice "9500000"`, `commissionPercent "1"` → `coverImage "a.jpg"`, `amountInr 9_500_000`, `isRent false`, `commissionPercent 1`.
    - rent: `transactionType "rent"`, `monthlyRent "22000"`, `commissionAmount "11000"` → `amountInr 22_000`, `isRent true`, `commissionAmountInr 11_000`.
    - `property: null` → `coverImage`/`amountInr` undefined, no throw.
    - `siteVisitsApi.list({ tab: "active", from: "2026-11-23", to: "2026-11-23" })` sends `tab=active&from=2026-11-23&to=2026-11-23` (stub adapter as `earnings.test.ts` does).
- [ ] **Step 2: Run** `npx tsx --test lib/api/site-visits.test.ts` — FAIL.
- [ ] **Step 3: Implement** in `mapShowing`, reusing the price/commission helpers already in `lib/api/broker-visits-map.ts` (`moneyNumber`, the commission picker near line 150) — export them if needed; do not duplicate.
- [ ] **Step 4: Implement** `use-dashboard-visits.ts`. Remove the now-duplicate `todayVisits` query in `new-broker-dashboard.tsx` and feed the stat strip from `today.data.counts` (upcoming + running + completed + not_attended + today's needs_update) and the needs-update number from `needsUpdate.data.total` (matches the Visits page tab).
- [ ] **Step 5: Run** `npm test && npx tsc --noEmit` — PASS.

---

### Task 5: Today's visits + Your next visit UI on real data, with real actions

**Files:**

- Create: `features/new-dashboard/dashboard-visit.ts`
- Modify: `features/new-dashboard/work-overview.tsx` (`WorkOverview`, `NextVisit`, `TodayVisits`, `VisitCard`)
- Delete: `features/new-dashboard/mock-work-overview.ts` (move any type still needed into `dashboard-visit.ts`)
- Test: `lib/api/dashboard-visit.test.ts` (new)

**Interfaces:**

- Consumes: Task 4 `useDashboardVisits`, `BrokerVisit` fields; `visitState`, `getVisitActions` from `features/new-site-visits/model.ts`; `useVisitMutations` from `features/new-site-visits/use-visits.ts`.
- Produces:
    - `export type DashboardVisitPhase = "upcoming" | "running" | "needs_update";`
    - `export function dashboardVisitPhase(visit: BrokerVisit, now: number): DashboardVisitPhase | null` → `visitState` mapped; `null` for completed / not_attended / cancelled.
    - `export function groupDashboardVisits(today: BrokerVisit[], needsUpdate: BrokerVisit[], now: number): Record<DashboardVisitPhase, BrokerVisit[]>` — upcoming/running from `today`; needs_update = union of `needsUpdate` and today's elapsed, deduped by `id`, newest first.

- [ ] **Step 1: Failing tests** in `lib/api/dashboard-visit.test.ts`: with `now` = 23 Nov 2026 15:00 IST, a visit 12:30–13:15 IST `scheduled` → `needs_update`; 14:45–15:30 → `running`; 16:00 → `upcoming`; `completed` → `null`. `groupDashboardVisits` dedupes a visit present in both lists and puts yesterday's unmarked visit in `needs_update`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** — PASS.
- [ ] **Step 4: Rewire cards.** `VisitCard` takes `BrokerVisit` (+ `phase`); title `propertyTitle`, location `locality, city`, owner `ownerName` (omit row if null), cover `coverImage` via `PropertyCoverImage` placeholder when absent, price via `<PriceWithCommission audience="broker">` only when `amountInr` is set; time range with `formatInTimeZone` in `Asia/Kolkata`. Card link → `/broker/visits?view=detail&visit=<id>` (no `preview=true`). Menu items from `getVisitActions(visit, now)`: Reschedule (exclusive only) → `/broker/visits?view=reschedule&visit=<id>`; **Cancel visit** → `ConfirmDialog` from `components/shared/confirm-dialog.tsx` → `cancel.mutateAsync(id)`; Mark attended / not attended → `setOutcome.mutateAsync({ id, status: "completed" | "no_show" })`. Call client: `tel:` with `clientPhone`, hidden when null.
- [ ] **Step 5: After any mutation success:** `toast.success`, `dispatch(fetchBrokerDashboard({ background: true }))`. `useVisitMutations` already invalidates `[...VISITS_KEY, "list"]`. On failure: `toast.error(error.message)`; no local state change. Delete the local `visits`/`setVisits` preview state and its "in this preview" announcements (keep an `aria-live` announcement with real wording).
- [ ] **Step 6: NextVisit** uses `next.data.items[0]`. Empty: "No upcoming visits" + "Schedule visit" link (`/broker/visits?tab=slots`). Error + Retry; skeleton.
- [ ] **Step 7: TodayVisits** tabs Upcoming / Running / Needs update with counts from `groupDashboardVisits`; footer "N visits need an update" from the same group. Empty per tab ("No visits today · Schedule visit" for Upcoming). Error + Retry on either query; skeleton.
- [ ] **Step 8: Verify** `npm test && npx tsc --noEmit && npx eslint features/new-dashboard` — clean; `grep -r "mock-work-overview\|MOCK_VISITS\|PreviewVisit" features` returns nothing.

---

### Task 6: Your listings + Recent updates off preview

**Files:**

- Modify: `features/new-dashboard/inventory-and-updates.tsx`, `features/new-dashboard/new-broker-dashboard.tsx` (drop `preview`)
- Modify: `features/dashboard/map-dashboard.ts` (`mapActivity`), `features/dashboard/mock-data.ts` (`ActivityItem` gains `category?: string`)
- Test: `lib/api/dashboard-activity.test.ts` (new)

**Interfaces:**

- Produces: `export function activityIcon(category: string | undefined): AppIcon` in `features/new-dashboard/activity-icon.ts` — `calendar`→`CalendarCheck`, `clients`→`UserRoundPlus`, `properties`→`Building2`, `representation`→`Handshake` (or nearest registry icon; add to `icons.tsx` if missing), `team`→`Users`, `profile`→`UserRound`, else `Activity`.

- [ ] **Step 1: Failing tests:** `mapActivity` keeps `category` on each item; `activityIcon("calendar") === CalendarCheck`; `activityIcon("unknown") === Activity`; `activityIcon(undefined) === Activity`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement** — PASS.
- [ ] **Step 4:** Remove the `preview` prop and all `preview` branches (`previewListings`, `previewUpdates`, `removedPreviews`, `draftPreviews`). Under `isMockMode()` keep showing mock listings/updates (move the sample builders behind that flag). Recent updates: `activity.items` sorted desc, first 4, icon from `activityIcon(item.category)`; empty "No recent updates yet". Listings: real `summary` counts and `listings` query; "Showing N of M active listings" with M = `summary.data.published`; skeleton, error + Retry, empty "No published listings · Add listing" / "No drafts".
- [ ] **Step 5: Verify** `npm test && npx tsc --noEmit && npx eslint features/new-dashboard features/dashboard` — clean; `grep -n "preview" features/new-dashboard/*.tsx` shows no data-path uses.

---

### Task 7: Live run-through against the user's running apps

Requires the frontend URL, backend URL and a broker login from the user.

- [ ] **Step 1:** Backend `npm test` and `npm run test:e2e -- earnings`; frontend `npm test`, `npx tsc --noEmit`, `npx eslint .` — record results.
- [ ] **Step 2:** `curl` with the broker token: `/earnings/report?from=…&to=…` returns the three new fields; `/slots/broker/bookings?tab=active&from=<today>&to=<today>` returns 200.
- [ ] **Step 3:** In a browser (desktop 1440px and phone 390px), check every card shows the broker's data; Active deals = Pipeline page live count; visit tab counts = Visits page; commission month total = Earnings page for the same month.
- [ ] **Step 4:** Exercise: commission period 3/6/12 and prev/next to the cap; visit tabs; mark a needs-update visit attended → reload → persisted, counts updated; cancel an upcoming visit → reload → gone; listing tabs; delete a test listing (with user's OK); Recent updates links.
- [ ] **Step 5:** Failure + empty: stop the backend (or block a route) → rewired cards show error + Retry that recovers; a broker with no data (if available) shows empty states.
- [ ] **Step 6:** Report to the user: APIs changed, integrations, test results, anything not verified.
