# Broker Earnings (real data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Earnings page's mock/browser-computed data with a backend report built from locked, date-filterable deal outcomes.

**Architecture:** Each `broker_property_leads` row gets a close snapshot (resolved date, sale/rent, base amount, commission % and ₹) written by every path that closes or reopens a deal. A new `EarningsModule` exposes `GET /earnings/report`, which filters by `resolved_at` in SQL and builds the report with a pure TypeScript function. The frontend resolves the period to dates, calls the endpoint, and renders the existing components.

**Tech Stack:** NestJS 11, Prisma 7 + PostgreSQL, Jest 30 + supertest (backend); Next.js, TanStack Query, `tsx --test` (frontend).

**Spec:** `docs/superpowers/specs/2026-11-20-earnings-backend-design.md` (frontend repo).

**Repos:** backend `D:\Projects\Geek Products\broker-crm\broker-backend` (runs in docker container `broker_backend`, code mounted at `/app`), frontend `D:\Projects\Geek Products\broker-crm\broker-new-ui`.

## Global Constraints

- **Never commit or push** in either repo. The user commits manually. Every "commit" step is "leave uncommitted".
- Broker only. No owner-portal screens, no team screens.
- All money is whole INR. India time = UTC+05:30 fixed (no DST) — `IST_OFFSET_MINUTES = 330`.
- Commission rules (spec): rent → property `commissionAmount` if > 0 else null; sale → `commissionPercent` if > 0 applied to base, else null. Base = `closedAmount` if > 0, else the offer amount when `offerStatus = accepted`, else list price (`listPrice` / sale price / monthly rent by type). Round to whole rupees. Null = unvalued, never ₹0.
- Sale vs rent for a lead: `closedAs` when given for a `both` listing; otherwise rent only when `transactionType = rent`, or when it has a monthly rent > 0 and no sale price > 0.
- Lost reasons: `price | bought_elsewhere | not_responding | changed_mind`; anything else is `other`. Top-level `lostReasonCounts.other` = free-text only; no-reason deals counted only in `lostWithoutReasonCount`. Bucket `lostReasonCounts` fold no-reason into `other`.
- Live stages map API → UI: `new→new, contacted→contacted, site_visit→visit, negotiation→negotiation, offer_made→negotiation`.
- `STALLED_AFTER_DAYS = 14`; stalled = days since last logged call, else since entering the current stage, ≥ 14.
- Bucket rules: ≤ 62 days → week (Monday start); ≤ 36×31 days → month; ≤ 36×92 days → quarter; else year. Max 36 buckets, keep the latest, set `chartTrimmed`. All time charts from the first resolved deal's month, but no later than 5 months before `now`'s month.
- Frontend rules from `AGENTS.md`: Tabler icons via `components/shared/icons`, prices via `lib/format`, `snake_case` only inside `lib/api/`, copy per `docs/MESSAGES.md`.

## Review Focus

1. **A deal reopened and re-sold** — earnings must count it once, at the new date and price (reopen clears the snapshot; resell writes a new one). Test in Task 3.
2. **"All time" for a broker with no resolved deals** — report returns zeros, `previous*` null, buckets for the last 6 months, no crash on `firstResolvedAt = null`. Test in Task 4.
3. **A deal resolved at 23:30 IST on the last day of a month** — it belongs to that month, not the next (IST bucketing, UTC timestamp 18:00Z). Test in Task 4.
4. **Owner edits the listing (commission, type, price) after the sale** — sold-deal numbers unchanged. Test in Task 5 (e2e).
5. **Switching period while a report is loading** — the old report stays on screen dimmed; no blank screen or skeleton flash. Test in Task 7.

---

### Task 1: Close-snapshot columns, migration and backfill

**Files (backend):**

- Modify: `prisma/schema.prisma` (model `BrokerPropertyLead`)
- Create: `prisma/migrations/20261120120000_lead_close_snapshot/migration.sql`

**Interfaces:**

- Produces Prisma fields on `BrokerPropertyLead`: `resolvedAt DateTime? @map("resolved_at") @db.Timestamptz`, `isRentAtClose Boolean? @map("is_rent_at_close")`, `amountInrAtClose BigInt? @map("amount_inr_at_close")`, `commissionPercentAtClose Float? @map("commission_percent_at_close")`, `commissionInrAtClose BigInt? @map("commission_inr_at_close")`, and `@@index([brokerId, stage, resolvedAt])`.

- [ ] **Step 1:** Add the five fields and the index to `BrokerPropertyLead`, with `///` doc comments matching the spec table.
- [ ] **Step 2:** Write `migration.sql`: `ALTER TABLE` adding the columns, `CREATE INDEX`, then the backfill as one `UPDATE … FROM properties` for leads with `stage IN ('closed_won','closed_lost')`:
    - `resolved_at` = `at` of the last `stage_history` element whose `status` = the lead's stage (`jsonb_array_elements … WITH ORDINALITY`, highest ordinality), cast to timestamptz; fallback `updated_at`, then `created_at`.
    - `is_rent_at_close` = the Global Constraints rule (no `closedAs` in backfill).
    - `amount_inr_at_close` = base amount per the Global Constraints rule (null when no amount > 0).
    - `commission_percent_at_close` = property `commission_percent` when sale and > 0, else null.
    - `commission_inr_at_close` = `round(base * pct / 100)` for sale, `commission_amount` for rent when > 0, else null.
    - A SQL comment saying backfilled commission uses the property's commission at migration time.
- [ ] **Step 3:** Apply and regenerate: `docker exec broker_backend sh -c "cd /app && npx prisma migrate deploy && npx prisma generate"`. Expected: "1 migration applied".
- [ ] **Step 4:** Verify the backfill: run a `prisma db execute` / `psql` query counting closed leads with `resolved_at IS NULL`. Expected: 0. Spot-check 3 rows: `resolved_at` equals the last matching `stage_history.at`.
- [ ] **Step 5:** `npx tsc --noEmit` in the backend passes. Leave uncommitted.

---

### Task 2: Close-snapshot helper (pure)

**Files (backend):**

- Create: `src/earnings/lead-close-snapshot.ts`
- Test: `src/earnings/lead-close-snapshot.spec.ts`

**Interfaces:**

- Produces:
    - `export type ClosedAs = 'sale' | 'rent'`
    - `export const LEAD_SNAPSHOT_SELECT` — Prisma `select` for `closedAmount, offerAmount, offerStatus, listPrice, property: { select: { transactionType, salePrice, monthlyRent, commissionPercent, commissionAmount } }`
    - `export type LeadSnapshotSource` — the shape that select returns (`property` may be null)
    - `export type LeadCloseSnapshot = { resolvedAt: Date | null; isRentAtClose: boolean | null; amountInrAtClose: bigint | null; commissionPercentAtClose: number | null; commissionInrAtClose: bigint | null }`
    - `export function leadIsRent(property: LeadSnapshotSource['property'], closedAs?: ClosedAs): boolean`
    - `export function closeSnapshot(source: LeadSnapshotSource, opts: { at: Date; closedAs?: ClosedAs; closedAmount?: bigint | null }): LeadCloseSnapshot` — `opts.closedAmount` overrides `source.closedAmount` (the value being written in the same update)
    - `export const OPEN_SNAPSHOT: LeadCloseSnapshot` — every field null

- [ ] **Step 1: Write failing tests** in `lead-close-snapshot.spec.ts`:
    - `sale with 2% on closed 80,00,000 → amount 8000000n, pct 2, commission 160000n, isRent false`
    - `sale with no closedAmount uses accepted offer 75,00,000 → commission 150000n`; with `offerStatus: 'pending'` it falls back to `listPrice`
    - `sale with commissionPercent 0 or null → pct null, commission null, amount still set`
    - `rent listing with commissionAmount 25000 and rent 30000 → isRent true, amount 30000n, pct null, commission 25000n`
    - `both listing, closedAs 'rent' → isRent true, base = monthlyRent`; `closedAs 'sale'` → sale; no `closedAs` → sale
    - `both listing with only monthlyRent > 0 and no closedAs → rent`
    - `rounds 1.5% of 33,33,333 to 50000n`
    - `resolvedAt === opts.at`; `OPEN_SNAPSHOT` has five null fields
- [ ] **Step 2:** Run `docker exec broker_backend sh -c "cd /app && npx jest src/earnings/lead-close-snapshot.spec.ts"`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `src/earnings/lead-close-snapshot.ts` per Global Constraints. BigInt math: `(base * BigInt(Math.round(pct * 10000)) + 500000n) / 1000000n` keeps rounding exact for up to 4 decimals of percent.
- [ ] **Step 4:** Run the spec again. Expected: PASS. Leave uncommitted.

---

### Task 3: Write the snapshot on every close and reopen; `closedAs`

**Files (backend):**

- Modify: `src/client/dto/update-lead-status.dto.ts` (add `closedAs`)
- Modify: `src/client/client.service.ts` — `updateLeadStatus` (~1108), `closeLeadAsWon` (~1217), `reopenSoldLead` (~1342), `respondToOffer` (~1538)
- Modify: `src/property-sale/property-sale.service.ts` — `closePropertyInTx` (~69)
- Modify: `src/representative/representative.service.ts` — auto-lose loop (~1719)
- Test: `test/earnings.e2e-spec.ts` (created here, extended in Task 5)

**Interfaces:**

- Consumes: `closeSnapshot`, `OPEN_SNAPSHOT`, `LEAD_SNAPSHOT_SELECT`, `leadIsRent`, `ClosedAs` from Task 2.
- Produces: `UpdateLeadStatusDto.closedAs?: 'sale' | 'rent'` (`@IsOptional() @IsIn(['sale','rent'])`, Swagger description "Required when marking a Sale & Rent listing sold: whether it sold or was rented."). Error copy when missing: `Choose whether this property was sold or rented.` (400).

- [ ] **Step 1: Write failing e2e tests** in `test/earnings.e2e-spec.ts`, using the `tasks.e2e-spec.ts` scaffolding (AppModule, ValidationPipe, HttpExceptionFilter, JWT-signed broker token, `run`-suffixed seed rows, cleanup in `afterAll`). Seed one broker user + broker profile, one client, and broker-owned **published** properties (`ownerType: 'broker'`, `ownedByBrokerId` = the broker profile) with leads created through `POST /clients/leads`. Tests:
    - `marking sold writes resolvedAt and a locked commission` — sale property 2%, list 80,00,000; `PATCH /clients/leads/:id/status {status:'closed_won', closedAmount: 7500000}` → row has `resolvedAt` set, `isRentAtClose=false`, `amountInrAtClose=7500000n`, `commissionInrAtClose=150000n`.
    - `other live leads on the sold property get a lost snapshot` — second client's lead on the same property → `closed_lost`, `resolvedAt` set, `commissionInrAtClose` computed from list price.
    - `marking lost writes a snapshot; putting it back on the board clears it` — `closed_lost` then `contacted` → all five columns null.
    - `reopening a sold deal clears the snapshot and re-selling writes a new one` (Review Focus 1) — sell at 70,00,000, move back to `negotiation`, sell at 72,00,000 → one snapshot with amount 7200000n and the later `resolvedAt`.
    - `a Sale & Rent listing needs closedAs` — `transactionType:'both'`, sale 90,00,000 + rent 35,000, commission 2% and ₹30,000: no `closedAs` → 400 with the error copy; `closedAs:'rent', closedAmount:35000` → `isRentAtClose=true`, `commissionInrAtClose=30000n`.
- [ ] **Step 2:** Run `docker exec broker_backend sh -c "cd /app && npx jest --config ./test/jest-e2e.json test/earnings.e2e-spec.ts"`. Expected: FAIL (columns null / no 400).
- [ ] **Step 3:** Add `closedAs` to the DTO. In `closeLeadAsWon`, when the property is `both` and `dto.closedAs` is missing, throw the 400 before the transaction; spread `closeSnapshot(lead, { at: now, closedAs: dto.closedAs, closedAmount })` into the lead update. `findBrokerLead`'s include already selects the property's prices and commission (`leadInclude`); confirm it covers every `LEAD_SNAPSHOT_SELECT` field and add any missing one.
- [ ] **Step 4:** In `updateLeadStatus`'s generic path: `next === 'closed_lost'` → spread `closeSnapshot(lead, { at: now })`; current stage closed and next live → spread `OPEN_SNAPSHOT`. In `reopenSoldLead` spread `OPEN_SNAPSHOT`. In `respondToOffer` when accepted spread `closeSnapshot(lead, { at: now, closedAmount: lead.offerAmount })` (no `closedAs`: offers are on the sale price).
- [ ] **Step 5:** In `closePropertyInTx` and the representative auto-lose loop, extend the `findMany` `select` with `...LEAD_SNAPSHOT_SELECT` and spread `closeSnapshot(lead, { at: now })` into each update.
- [ ] **Step 6:** Run the e2e spec. Expected: PASS. Run the backend unit suite `npx jest` — expected: no new failures vs. before this task (record the baseline first). Leave uncommitted.

---

### Task 4: Report builder (pure) and IST calendar

**Files (backend):**

- Create: `src/earnings/ist-calendar.ts`, `src/earnings/earnings-report.ts`, `src/earnings/earnings-report.types.ts`
- Test: `src/earnings/ist-calendar.spec.ts`, `src/earnings/earnings-report.spec.ts`

**Interfaces:**

- Produces in `earnings-report.types.ts`: the response types exactly as the spec's API section (`EarningsReportResponse`, `EarningsDeal`, `EarningsBucketDto`, `DealStage = 'new'|'contacted'|'visit'|'negotiation'`, `LostReasonKey`, `BucketUnit`), plus inputs:
    - `ResolvedLead = { id; stage: 'closed_won'|'closed_lost'; resolvedAt: Date; createdAt: Date | null; buyerName: string; propertyTitle: string; locality: string; city: string; isRent: boolean; amountInr: number; commissionPercent: number | null; commissionInr: number | null; lostReason: string | null; stageHistory: unknown }`
    - `LiveLead = { id; stage: DealStage; createdAt: Date | null; buyerName; propertyTitle; locality; city; isRent: boolean; amountInr: number; commissionPercent: number | null; commissionAmountInr: number | null; offerAmount: number | null; offerStatus: 'pending'|'accepted'|'rejected'|null; stageHistory: unknown; updatedAt: Date | null }`
- `ist-calendar.ts`: `IST_OFFSET_MINUTES = 330`; `startOfIstBucket(at: Date, unit: BucketUnit): Date`; `addIstBuckets(start: Date, unit: BucketUnit, n: number): Date`; `bucketUnitFor(from: Date, to: Date): BucketUnit`. All return UTC instants of IST boundaries.
- `earnings-report.ts`: `buildEarningsReport(input: { resolved: ResolvedLead[]; previous: ResolvedLead[] | null; live: LiveLead[]; window: { from: Date | null; to: Date }; firstResolvedAt: Date | null; now: Date }): EarningsReportResponse`. `previous` null ⇒ every `previous*` field null. Live commission is computed with the Task 2 rules on current listing values (`LiveLead` carries them).

- [ ] **Step 1: Write failing tests.** `ist-calendar.spec.ts`:
    - `2026-10-31T18:00:00Z (23:30 IST 31 Oct) starts the October month bucket 2026-09-30T18:30:00Z` (Review Focus 3)
    - `week buckets start Monday 00:00 IST`; `quarter of 15 Feb IST starts 1 Jan IST`
    - `bucketUnitFor: 62 days → week, 63 → month, 36*31+1 → quarter, 36*92+1 → year`
      `earnings-report.spec.ts` — port every case from the frontend's `features/earnings/earnings-math.test.ts` that exercises `buildEarningsReport`, rewritten against `ResolvedLead`/`LiveLead` inputs with the same expected numbers, plus:
    - `top-level other counts free text only; no-reason goes to lostWithoutReasonCount; bucket other includes both`
    - `lostFromStages uses the last live stage in stageHistory before closed_lost, mapped to UI names`
    - `all time with no resolved deals → zeros, winRate null, previous null, 6 month buckets` (Review Focus 2)
    - `chart longer than 36 buckets keeps the latest 36 and sets chartTrimmed`
    - `areas group by lower-cased locality|city, most money first`
    - `recentClosed newest 5; live.topDeals top 10 by commission; stalled at 14 days since stage entry`
- [ ] **Step 2:** Run `npx jest src/earnings`. Expected: FAIL.
- [ ] **Step 3:** Implement `ist-calendar.ts` by shifting to IST wall time (`+330 min`), using UTC getters/setters for calendar math, and shifting back.
- [ ] **Step 4:** Implement `buildEarningsReport` as a port of the frontend function (`features/earnings/earnings-math.ts:569-761`), replacing date-fns calls with `ist-calendar.ts`, dropping labels (the frontend adds them), and returning `EarningsDeal` objects (`status: 'closed' | 'lost' | DealStage`).
- [ ] **Step 5:** Run `npx jest src/earnings`. Expected: PASS. Leave uncommitted.

---

### Task 5: `GET /earnings/report`

**Files (backend):**

- Create: `src/earnings/earnings.module.ts`, `src/earnings/earnings.controller.ts`, `src/earnings/earnings.service.ts`, `src/earnings/dto/earnings-report-query.dto.ts`
- Modify: `src/app.module.ts` (import `EarningsModule`), `src/client/client.service.ts` (add `leadScopeWhere`)
- Test: `test/earnings.e2e-spec.ts` (extend)

**Interfaces:**

- Consumes: `buildEarningsReport` and types (Task 4); snapshot columns (Task 1).
- Produces:
    - `ClientService.leadScopeWhere(userId: string): Promise<Prisma.BrokerPropertyLeadWhereInput>` — `{ brokerId: <holder broker profile id>, client: access.listWhere }`, the same scope `listLeadsForBroker` uses. Throws the existing not-a-broker error for owners.
    - `EarningsReportQueryDto { from?: string; to: string; compareFrom?: string; compareTo?: string }` — `@IsISO8601()`; service throws 400 `Choose a valid date range.` when `from > to`, and `Send both comparison dates or neither.` when only one compare param is present.
    - `GET /earnings/report` with `@UseGuards(JwtAuthGuard, ModuleAccessGuard)`, `@RequireAccess('leads', 'view')`, returning `EarningsReportResponse`.
- Queries in `EarningsService.report(userId, query)` (all with the scope `where`): resolved leads with `resolvedAt` in window; resolved leads in compare window (when given); live leads (`stage` not closed or null); `firstResolvedAt` via `aggregate _min resolvedAt` only when `from` is absent. Map rows to `ResolvedLead`/`LiveLead`: locality = title-cased `property.address` trimmed else city (same as frontend `mapLeadToDeal`), buyer name from `client.name` else `buyerName`, sold/lost amounts from the `*_at_close` columns, live amounts from the listing (Global Constraints rule).

- [ ] **Step 1: Write failing e2e tests** (extend the Task 3 file; seed resolved leads directly with `prisma.brokerPropertyLead.update` setting `stage`, `resolvedAt` and snapshot columns to fixed dates, so counts are deterministic):
    - `returns totals for the window and the comparison` — 2 sales (₹1,50,000 + ₹80,000) and 1 rent (₹25,000) in Oct 2026, 1 sale in Sep, 1 lost in Oct → `from=2026-10-01T00:00+05:30, to=2026-10-31T23:59:59.999+05:30, compareFrom=2026-09-01…, compareTo=2026-09-30…` gives `earnedInr 255000, saleEarnedInr 230000, rentEarnedInr 25000, closedCount 3, lostCount 1, winRate 75, previousClosedCount 1`
    - `all time omits from and has null previous fields`
    - `editing the property commission after a sale changes nothing` (Review Focus 4) — update property `commissionPercent` 2 → 5 and `transactionType`; report unchanged
    - `another broker sees none of these deals` — second broker token → `closedCount 0`
    - `an owner token gets 403`
    - `400 when from is after to`; `400 when only compareFrom is sent`
- [ ] **Step 2:** Run the e2e spec. Expected: FAIL (404 route).
- [ ] **Step 3:** Implement DTO, `leadScopeWhere`, service, controller, module; register in `AppModule`. `EarningsModule` imports `ClientModule` (already exports `ClientService`, as `TaskModule` relies on).
- [ ] **Step 4:** Run the e2e spec, then `npx jest` and `npm run lint:check`. Expected: e2e PASS; no new unit failures; no lint errors in `src/earnings`. Leave uncommitted.

---

### Task 6: Frontend API client and mapping

**Files (frontend):**

- Create: `lib/api/earnings.ts`, `lib/api/earnings.test.ts`
- Modify: `features/earnings/earnings-math.ts` (types only: export `EarningsDeal`, change `ValuedDeal.deal` to `EarningsDeal`; export `bucketLabels`; keep `buildEarningsReport` for mock mode and make it emit `EarningsDeal`s via a `toEarningsDeal(deal: DealItem)` helper)

**Interfaces:**

- Consumes: the Task 5 response (camelCase JSON).
- Produces:
    - `type EarningsDeal = { id: string; status: DealStatus; resolvedAt: string | null; buyer: { name: string }; property: { title: string; isRent: boolean; amountInr: number; commissionPercent: number | null; commissionAmountInr: number | null } }` in `earnings-math.ts`
    - `earningsApi.report(input: { window: EarningsWindow; comparison: EarningsComparison | null }, signal?: AbortSignal): Promise<EarningsReport>` — sends `from`, `to`, `compareFrom`, `compareTo` as ISO strings; mock mode runs `buildEarningsReport(MOCK_DEALS…)`.
    - `mapEarningsReport(raw: unknown, input): EarningsReport` (exported for tests) — dates to `Date`, bucket `label`/`longLabel` via `bucketLabels` (plus the "MMM yy" multi-year rule), `lostReasons` rows built from counts with `DEAL_LOST_REASON_LABEL` / `DEAL_LOST_REASON_DETAIL` and "Others" = `other + lostWithoutReasonCount`, `comparison` from the input.

- [ ] **Step 1: Write failing tests** in `lib/api/earnings.test.ts` (adapter-stub pattern from `lib/api/client-rate-limit.test.ts`):
    - `report sends from/to/compareFrom/compareTo as ISO query params`
    - `all time omits from and compare params`
    - `maps buckets to Dates with month labels, and "MMM yy" when spanning two years`
    - `Others row = other + lostWithoutReasonCount; four named reasons always present with zeros`
    - `deal rows keep locked amounts and commissionInr`
- [ ] **Step 2:** Run `npx tsx --test lib/api/earnings.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `lib/api/earnings.ts` and the type changes.
- [ ] **Step 4:** Run the test, `npx tsx --test features/earnings/earnings-math.test.ts`, and `npx tsc --noEmit`. Expected: PASS / no type errors (component errors from the `EarningsDeal` change are fixed in Task 7 — if tsc fails only there, proceed). Leave uncommitted.

---

### Task 7: Earnings page on the real API

**Files (frontend):**

- Modify: `features/earnings/earnings-page.tsx`, `features/earnings/earnings-deal-lists.tsx`, any other earnings component tsc flags after Task 6
- Delete: `features/earnings/sample-earnings.ts` and every import of it / `isSampleDeal`
- Test: `lib/api/earnings.test.ts` (extend)

**Interfaces:**

- Consumes: `earningsApi.report` (Task 6), `resolveEarningsWindow`, `comparisonFor`.

- [ ] **Step 1: Write the failing test** `earnings query keeps the previous report while a new period loads` (Review Focus 5): build `earningsReportQueryOptions(selection)` (exported from `lib/api/earnings.ts`) and assert its `queryKey` includes the window ISO strings and that it sets `placeholderData: keepPreviousData`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `earningsReportQueryOptions(selection: EarningsSelection, now?: Date)`; switch `earnings-page.tsx` to `useQuery(earningsReportQueryOptions(selection))`; while `isPlaceholderData`, render the report with `aria-busy` and `opacity-60` (the list-dimming pattern in `features/new-site-visits/visit-list.tsx`). Empty state when `closedCount + lostCount + live.count === 0` for all time — keep the existing "Your earnings will show here" copy; a period with no deals still renders the report (zeros), not the first-run state.
- [ ] **Step 4:** Update deal-list components to read `EarningsDeal` fields; remove sample-data banner and `isSampleDeal` checks (every deal row links to its deal).
- [ ] **Step 5:** Run `npx tsx --test lib/api/earnings.test.ts`, `npx tsc --noEmit`, `npx eslint features/earnings lib/api/earnings.ts`. Expected: all pass. Leave uncommitted.

---

### Task 8: Sold / Rented choice for "Sale & Rent" listings

**Files (frontend):**

- Modify: `features/pipeline/types.ts` (`DealProperty.saleAndRent?: { salePriceInr: number; monthlyRentInr: number }`), `lib/api/pipeline.ts` (`mapLeadToDeal` sets it when `transactionType === "both"`; `SetStageOptions.closedAs`; `setStage` sends `closedAs` for `closed`), `features/pipeline/final-price-field.tsx` (`dealAsClosed`), `features/pipeline/stage-note-modal.tsx`, `features/pipeline/pipeline-page.tsx:493`
- Test: `lib/api/pipeline-mark-sold.test.ts` (extend)

**Interfaces:**

- Produces: `StageMoveDetails.closedAs?: "sale" | "rent"`; `SetStageOptions.closedAs?: "sale" | "rent"`; `dealAsClosed(deal: DealItem, closedAs: "sale" | "rent"): DealItem` — returns a copy with `property.isRent = closedAs === "rent"`, `property.amountInr` = the matching price, and `offerAmountInr`/`offerStatus` null for rent.

- [ ] **Step 1: Write failing tests:**
    - `setStage to closed sends closedAs when given` → body `{ status: "closed_won", closedAmount: 35000, closedAs: "rent" }`
    - `mapLeadToDeal marks a both listing with saleAndRent` (via `pipelineApi.list` with a stubbed adapter returning one `both` lead)
    - `dealAsClosed("rent") uses the monthly rent and hides the offer; dealAsClosed("sale") uses the sale price`
- [ ] **Step 2:** Run `npx tsx --test lib/api/pipeline-mark-sold.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. In `StageNoteModal`, when `request.status === "closed"` and `deal.property.saleAndRent`, render a required `RadioGroup` of two `ChoiceCard`s above `FinalPriceField` — titles **Sold** / **Rented**, legend **"Did it sell or rent?"**, no preselection, error **"Choose Sold or Rented."** on confirm without a choice. Pass `dealAsClosed(deal, closedAs)` to `FinalPriceField` and `resolveFinalPrice`; reseed the price choice when `closedAs` changes. Include `closedAs` in `onConfirm` details; `pipeline-page.tsx` passes it to `setStage`. Owner-confirm mode (`makeOffer`) is unchanged.
- [ ] **Step 4:** Run the test file, `npx tsc --noEmit`, `npx eslint features/pipeline lib/api/pipeline.ts`. Expected: pass. Leave uncommitted.

---

### Task 9: End-to-end verification on the local stack

- [ ] **Step 1:** Backend: `npx jest` and `npx jest --config ./test/jest-e2e.json` in the container. Expected: earnings specs pass; any other failures match the pre-work baseline.
- [ ] **Step 2:** Frontend: `npm test`, plus `npx tsx --test features/earnings/earnings-math.test.ts`, `npx tsc --noEmit`. Expected: no new failures vs. baseline (6 known failures recorded on 2026-11-20).
- [ ] **Step 3:** With the docker stack and `npm run dev` running, sign in as a seeded broker, mark one sale-only deal sold, one "Sale & Rent" deal rented, and one deal lost. Call `GET https://localhost/earnings/report` for this month and compare against the Earnings page for "This month": earned total, sale/rent split, counts, win rate, recent sales and lost reasons match.
- [ ] **Step 4:** Switch to "All time" and "Last 6 months": the previous report stays dimmed while loading; numbers change accordingly.
- [ ] **Step 5:** Edit the sold property's commission in the listing form, reload Earnings: numbers unchanged.
- [ ] **Step 6:** Report results to the user with any failures verbatim. Leave everything uncommitted.
