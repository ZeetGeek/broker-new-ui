# Visits on the real API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make broker Visits real: book / reschedule / cancel / mark visits on exclusive listings with 30/45/60-minute lengths, server-side tabs-filters-search-sort, live updates, and a Pipeline link that lands on the right form.

**Architecture:** Backend adds `showings.end_at`, pure visit rules in `src/slot/visit-rules.ts`, reschedule/outcome endpoints, a richer bookings list, and a `visit.changed` socket event. Frontend replaces the browser-storage preview in `features/new-site-visits/` with a typed client (`lib/api/site-visits.ts`), TanStack Query hooks that refetch on socket events and at `nextChangeAt`, and a chip-based schedule form.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL, Jest (backend); Next.js, TanStack Query, socket.io-client, `tsx --test` (frontend).

**Spec:** `docs/superpowers/specs/2026-11-18-visits-slot-api-design.md`

Paths: **BE** = `D:\Projects\Geek Products\broker-crm\broker-backend`, **FE** = `D:\Projects\Geek Products\broker-crm\broker-new-ui`.

## Global Constraints

- All times IST (Asia/Kolkata). Visit hours 10:00–19:00 IST; bookable today through today + 13 days.
- Lengths: exactly `30 | 45 | 60` minutes. Start times on a 30-minute grid from 10:00; `start + length ≤ 19:00`.
- Reminders: do not change reminder UI/code; never send reminders to the API.
- UI copy says "Client", plain language. Icons only from `@/components/shared/icons`. Never edit `components/ui/`.
- **No commits** — the user commits manually. Every "Commit" step in this plan is replaced by "leave changes uncommitted".
- The old page `/broker/old-visits` must keep working (its booking call sends `startAt` + `endAt`).
- Socket event name: `visit.changed`, payload `{ id: string; propertyId: string }`.

## Review Focus

1. A 45-min visit at 10:00 must block the 10:30 start chip on the same property, for the same broker, and for the same client elsewhere — Task 2/3 tests.
2. A visit crossing its start time while the screen is open must move Upcoming → Running with no user action (timer at `nextChangeAt`) — Task 9 test on `msUntil`.
3. Rescheduling a visit to a time overlapping only its own old time must succeed — Task 4 test.
4. Pipeline link for a deal whose lead is closed / not exclusive / not this broker's must open an empty form with "This deal can't be booked here." — Task 8 test.
5. Old visits with no `end_at` (pre-migration rows) must still land in the right tab — Task 1 backfill + Task 5 test for null `endAt` fallback.

---

## Backend

### Task 1: `showings.end_at` column

**Files:**

- Modify: `BE/prisma/schema.prisma` (model `Showing`, ~line 756)
- Create: `BE/prisma/migrations/20261118120000_showing_end_at/migration.sql`
- Modify: `BE/src/slot/slot.service.ts` — both `showing.create` calls (~538, ~1292), `serializeShowing` (~2240), `showingInclude` unaffected

**Interfaces:**

- Produces: `Showing.endAt: Date | null` (Prisma), serialized showing gains `endAt: Date` (always set: `s.endAt ?? s.visitSlot?.endAt ?? scheduledDate + 30 min`).

- [ ] **Step 1:** Add `endAt DateTime? @map("end_at") @db.Timestamptz` to `Showing`, plus `@@index([scheduledDate])`.
- [ ] **Step 2:** Migration SQL:
    ```sql
    ALTER TABLE "showings" ADD COLUMN "end_at" TIMESTAMPTZ;
    UPDATE "showings" s SET "end_at" = vs."end_at" FROM "visit_slots" vs WHERE s."visit_slot_id" = vs."id";
    UPDATE "showings" SET "end_at" = "scheduled_date" + INTERVAL '30 minutes' WHERE "end_at" IS NULL;
    CREATE INDEX "showings_scheduled_date_idx" ON "showings"("scheduled_date");
    ```
- [ ] **Step 3:** Owner-slot booking writes `endAt: slot.endAt`; exclusive booking writes `endAt`. `serializeShowing` uses the fallback above (drop the 45-minute fallback) and returns `endAt`; `durationMin` derives from it.
- [ ] **Step 4:** Run `npx prisma generate` then `npx prisma migrate deploy` (against the dev DB from `.env`); `npx tsc --noEmit -p tsconfig.json`. Expected: no errors. If the DB is unreachable, report it and continue with generate + typecheck.

### Task 2: Pure visit rules

**Files:**

- Create: `BE/src/slot/visit-rules.ts`
- Test: `BE/src/slot/visit-rules.spec.ts`

**Interfaces (Produces):**

```ts
export const VISIT_DURATIONS = [30, 45, 60] as const;
export type VisitDuration = (typeof VISIT_DURATIONS)[number];
export const VISIT_DAY_START_MIN = 600,
    VISIT_DAY_END_MIN = 1140,
    VISIT_STEP_MIN = 30,
    VISIT_MAX_DAYS = 14;
export type Interval = { start: number; end: number }; // epoch ms
export function istDateKey(d: Date): string; // YYYY-MM-DD
export function istWallClock(dateKey: string, minutes: number): Date;
export function addIstDays(dateKey: string, days: number): string;
/** Returns a user-facing error string, or null when valid. */
export function visitWindowError(startAt: Date, durationMinutes: number, now: Date): string | null;
export function freeStartTimes(dateKey: string, durationMinutes: VisitDuration, busy: Interval[], now: Date): Date[];
export function overlaps(a: Interval, b: Interval): boolean; // touching edges do not overlap
export type VisitTab = "upcoming" | "running" | "needs_update" | "completed" | "not_attended" | "cancelled" | "active";
export function visitTabWhere(tab: VisitTab, now: Date): Prisma.ShowingWhereInput;
export type VisitSort = "start_asc" | "start_desc" | "booked_desc";
export function visitOrderBy(tab: VisitTab | undefined, sort?: VisitSort): Prisma.ShowingOrderByWithRelationInput[];
export function nextChangeAt(rows: Array<{ scheduledDate: Date; endAt: Date | null }>, now: Date): Date | null;
```

Error strings (exact): `"Choose 30 min, 45 min or 1 hour."`, `"Pick a time in the future."`, `"Visits run between 10:00 and 19:00."`, `"Pick one of the open visit times."`, `"Visits can be booked up to 14 days ahead."`.

Tab where: `active` = status in scheduled/confirmed; `upcoming` = active ∧ `scheduledDate > now`; `running` = active ∧ `scheduledDate ≤ now` ∧ `endAt > now`; `needs_update` = active ∧ `endAt ≤ now`; `completed`/`not_attended`(`no_show`)/`cancelled` by status. Default order: `start_asc` for active/upcoming/running/needs_update/undefined, else `start_desc`; tie-break `{ id: 'asc' }`.

- [ ] **Step 1: Failing tests** (`now` fixed at `2026-11-18T04:30:00Z` = 10:00 IST):
    - `visitWindowError(istWallClock('2026-11-18', 630), 45, now)` → null; `(…, 1080, 60)` (18:00) → null; `(…, 1110, 45)` (18:30) → "Visits run between 10:00 and 19:00."; `(…, 645, 30)` (10:45) → "Pick one of the open visit times."; duration 40 → "Choose 30 min, 45 min or 1 hour."; start at now → "Pick a time in the future."; `addIstDays(today, 14)` at 11:00 → "Visits can be booked up to 14 days ahead."
    - `freeStartTimes('2026-11-18', 30, [], now)` excludes 10:00 (not future) and has first `10:30` IST, last `18:30`; with 60 last is `18:00`.
    - busy 10:00–10:45 on `2026-11-19`: `freeStartTimes('2026-11-19', 30, busy, now)` excludes 10:00 and 10:30, includes 11:00; with busy 10:30–11:00 and duration 60, 10:00 is excluded.
    - `overlaps({start:0,end:10},{start:10,end:20})` → false.
    - `nextChangeAt([{scheduledDate: +5min, endAt: +35min}, {scheduledDate: -10min, endAt: +2min}], now)` → `+2min`; all past → null; `endAt: null` treated as `scheduledDate + 30 min`.
    - `visitOrderBy('completed')` → `[{ scheduledDate: 'desc' }, { id: 'asc' }]`; `visitOrderBy('upcoming','booked_desc')` → `[{ createdAt: 'desc' }, { id: 'asc' }]`.
    - `visitTabWhere('running', now)` deep-equals `{ status: { in: ['scheduled','confirmed'] }, scheduledDate: { lte: now }, endAt: { gt: now } }`.
- [ ] **Step 2:** `npx jest src/slot/visit-rules.spec.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement. Move `istDateKey`/`istWallClock`/`addIstDays` logic out of `SlotService` (have the service call these).
- [ ] **Step 4:** Same command → PASS.

### Task 3: Book with a length; free times that really book

**Files:**

- Modify: `BE/src/slot/dto/book-exclusive-slot.dto.ts`, `BE/src/slot/dto/list-query.dto.ts` (`ListBrokerOpenSlotsQueryDto`)
- Modify: `BE/src/slot/slot.service.ts` — `bookExclusiveForBroker`, `assertExclusiveSlotWindow` (replace with `visitWindowError`), `assertNoExclusiveOverlap`, `assertBrokerScheduleFree`, `listExclusiveOpenSlotsForBroker`
- Test: `BE/src/slot/slot-exclusive-duration.spec.ts` (mock-Prisma style of `slot-exclusive-open.spec.ts`)

**Interfaces:**

- Consumes: Task 2 rules.
- Produces: `BookExclusiveSlotDto { propertyId; leadId; startAt; durationMinutes?: 30|45|60; endAt?: string; notes? }` — `durationMinutes` wins; else derived from `endAt - startAt`; neither → 400 "Choose 30 min, 45 min or 1 hour.". `ListBrokerOpenSlotsQueryDto` gains `durationMinutes?: 30|45|60` (default 30) and `excludeShowingId?: uuid`.
- Overlap helpers take `(…, startAt, endAt, excludeShowingId?: string)` and compare with each showing's `endAt ?? visitSlot.endAt ?? +30min`. Their windows widen to `scheduledDate > startAt - 60min` (max length).
- `listExclusiveOpenSlotsForBroker`: busy intervals per property = that property's active showings ∪ all broker's active showings ∪ (when `leadId` given) that lead's client's active showings via `lead: { clientId, brokerId }`; minus `excludeShowingId`. Use `freeStartTimes`; each returned slot has `endAt = startAt + durationMinutes`.

- [ ] **Step 1: Failing tests:** booking 45 min at 10:00 tomorrow returns a showing created with `endAt` 10:45; booking with `durationMinutes: 40` → BadRequest "Choose 30 min, 45 min or 1 hour."; legacy body with `endAt` = start + 30 → accepted; existing confirmed showing 10:00–10:45 on the property makes `bookExclusive` at 10:30 throw "already booked"; free-time list with `durationMinutes=60` and a broker visit elsewhere 11:00–11:30 omits 10:30 and 11:00; `excludeShowingId` of that visit restores them; with `leadId` the client's visit elsewhere at 12:00–12:30 omits 12:00.
- [ ] **Step 2:** `npx jest src/slot` → new tests FAIL, old pass.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx jest src/slot` → all PASS (update `slot-broker-overlap.spec.ts` only where it hard-codes 30-min assumptions).

### Task 4: Reschedule and outcome endpoints

**Files:**

- Create: `BE/src/slot/dto/reschedule-showing.dto.ts`, `BE/src/slot/dto/showing-outcome.dto.ts`
- Modify: `BE/src/slot/slot.controller.ts` (broker section, before `:id/book`), `BE/src/slot/slot.service.ts`
- Test: `BE/src/slot/slot-reschedule-outcome.spec.ts`

**Interfaces (Produces):**

- `PATCH /slots/broker/showings/:showingId/reschedule` body `RescheduleShowingDto { startAt: ISO; durationMinutes: 30|45|60; notes?: string }` → serialized showing. `@RequireAccess('calendar','manage')`.
- `PATCH /slots/broker/showings/:showingId/outcome` body `ShowingOutcomeDto { status: 'completed' | 'no_show' }` → serialized showing.
- `SlotService.rescheduleForBroker(userId, brokerProfileId, showingId, dto)`, `SlotService.setOutcomeForBroker(userId, showingId, status)`.

Rules: reschedule — owned by broker (`lead.broker.userId`), `visitSlotId` null and property `ownerType='broker'` and `ownedByBrokerId = brokerProfileId` (else 400 "Only visits on your own listings can be moved. Cancel this one and book again."), status scheduled/confirmed (else 400 "This visit can't be moved any more."), lead not closed_won/closed_lost, listing published and not sold/unavailable, `visitWindowError`, overlap checks with `excludeShowingId = showingId`. Updates `scheduledDate`, `endAt`, `notes` (when given); activity log `slot_rescheduled`. Outcome — owned by broker; status scheduled/confirmed/completed/no_show (cancelled → 400 "A cancelled visit can't be marked."); `scheduledDate ≤ now` else 400 "You can mark this once the visit has started."; activity log `visit_outcome`.

- [ ] **Step 1: Failing tests:** reschedule own exclusive visit 10:00–10:30 → 10:15 is rejected "Pick one of the open visit times."; → 10:00 for 45 min succeeds even though it overlaps its own old time; reschedule on owner-slot visit → 400 message above; reschedule cancelled → 400; another broker's visit → 403; outcome before start → 400; outcome `no_show` on started confirmed → update called with `status: 'no_show'`; switch completed → no_show allowed; cancelled → 400.
- [ ] **Step 2:** `npx jest src/slot/slot-reschedule-outcome.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** → PASS.

### Task 5: Bookings list — tabs, client/deal filters, sort, counts, options, nextChangeAt

**Files:**

- Modify: `BE/src/slot/dto/list-query.dto.ts` (`ListBrokerBookingsQueryDto`), `BE/src/slot/slot.service.ts` (`listBookingsForBroker`)
- Test: `BE/src/slot/slot-broker-bookings.spec.ts`

**Interfaces (Produces):** query adds `tab?: VisitTab`, `clientId?: uuid`, `leadId?: uuid`, `sort?: VisitSort`. Response:

```ts
{ items: SerializedShowing[]; total; page; limit; totalPages;
  counts: Record<'upcoming'|'running'|'needs_update'|'completed'|'not_attended'|'cancelled', number>;
  clientOptions: Array<{ id: string; name: string }>;     // distinct clients across ALL the broker's showings, by name
  propertyOptions: Array<{ id: string; title: string }>;  // distinct properties across ALL the broker's showings, by title
  nextChangeAt: string | null }
```

`counts` use every filter except `tab`/`status`. `nextChangeAt` ignores filters (broker's active showings with `scheduledDate > now OR endAt > now`, select both, then `nextChangeAt`). Search ORs add `property.address` and `lead.client.phone`. `status` param still works when `tab` absent. One `now = new Date()` per request.

- [ ] **Step 1: Failing tests:** `tab=running` passes `visitTabWhere('running', now)` merged into `where`; `clientId` → `lead: { broker: { userId }, clientId }`; `leadId` → `leadId`; `sort=booked_desc` → `orderBy` from `visitOrderBy`; no sort + `tab=completed` → `scheduledDate desc`; response has `counts.running` from the mocked count, `nextChangeAt` ISO string; search "98765" includes a `lead.client.phone contains` clause; a showing with `endAt: null` in the nextChangeAt rows uses +30 min.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run → PASS.

### Task 6: Live push `visit.changed`

**Files:**

- Modify: `BE/src/notification/notification.constants.ts` (add `export const VISIT_CHANGED_EVENT = 'visit.changed';`)
- Modify: `BE/src/slot/slot.service.ts` (inject `NotificationGateway`; add `private async emitVisitChanged(showingId: string)`)
- Test: `BE/src/slot/slot-visit-events.spec.ts`

`emitVisitChanged` loads the showing's `propertyId`, `lead.broker.userId`, `property.ownedByOwner.userId` and calls `gateway.emitToUser(userId, VISIT_CHANGED_EVENT, { id, propertyId })` for each distinct user. Never throws (catch + log). Called after: `bookForBroker`, `bookExclusiveForBroker`, `rescheduleForBroker`, `setOutcomeForBroker`, `cancelBookingForBroker`, `updateShowingStatusForOwner`.

- [ ] **Step 1:** Failing test: exclusive booking and cancel each call `emitToUser(brokerUserId, 'visit.changed', { id, propertyId })` once; owner-listed cancel also emits to the owner user; a gateway throw does not fail the booking.
- [ ] **Step 2–4:** run FAIL → implement (update existing spec `makeService` helpers to pass a gateway mock) → `npx jest` (whole backend suite) PASS, `npx tsc --noEmit` clean, `npm run lint` clean on touched files.

---

## Frontend

### Task 7: Typed API client

**Files:**

- Create: `FE/lib/api/site-visits.ts`
- Test: `FE/lib/api/site-visits.test.ts`

**Interfaces (Produces):**

```ts
export type VisitTab = "upcoming" | "running" | "needs_update" | "completed" | "not_attended" | "cancelled";
export type VisitSort = "start_asc" | "start_desc" | "booked_desc";
export type VisitDuration = 30 | 45 | 60;
export type BrokerVisit = {
    id: string;
    leadId: string;
    clientId: string;
    clientName: string;
    clientPhone: string | null;
    propertyId: string;
    propertyTitle: string;
    locality: string;
    city: string;
    isExclusive: boolean;
    startsAt: string;
    endsAt: string;
    durationMinutes: number;
    status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
    notes: string;
    bookedAt: string;
    updatedAt: string;
};
export type VisitListQuery = {
    tab: VisitTab;
    search?: string;
    clientId?: string;
    propertyId?: string;
    leadId?: string;
    from?: string;
    to?: string;
    sort?: VisitSort;
    page?: number;
    limit?: number;
};
export type VisitListPage = {
    items: BrokerVisit[];
    total: number;
    page: number;
    totalPages: number;
    counts: Record<VisitTab, number>;
    clientOptions: { id: string; name: string }[];
    propertyOptions: { id: string; title: string }[];
    nextChangeAt: string | null;
};
export type BookableLead = {
    leadId: string;
    clientId: string;
    clientName: string;
    propertyId: string;
    propertyTitle: string;
};
export type FreeTimes = { leads: BookableLead[]; starts: string[] }; // ISO starts for one property+date
export function visitListParams(q: VisitListQuery): URLSearchParams; // omits empty values; trims search
export function mapShowing(api: ApiShowing): BrokerVisit;
export const siteVisitsApi: {
    list(q: VisitListQuery): Promise<VisitListPage>;
    activeForLead(leadId: string): Promise<BrokerVisit | null>; // tab=active&leadId&sort=start_asc&limit=1 (backend accepts 'active')
    bookable(): Promise<BookableLead[]>; // GET /slots/broker/exclusive/open → leadOptions
    freeTimes(a: {
        propertyId: string;
        leadId?: string;
        date: string;
        durationMinutes: VisitDuration;
        excludeShowingId?: string;
    }): Promise<string[]>; // from=to=date; flattens slots[].startAt for that property
    book(a: {
        propertyId: string;
        leadId: string;
        startAt: string;
        durationMinutes: VisitDuration;
        notes?: string;
    }): Promise<void>;
    reschedule(
        id: string,
        a: { startAt: string; durationMinutes: VisitDuration; notes?: string },
    ): Promise<BrokerVisit>;
    cancel(id: string): Promise<void>;
    setOutcome(id: string, status: "completed" | "no_show"): Promise<BrokerVisit>;
};
```

Use `apiFetch` from `@/lib/api/client`. `ApiShowing` is the local raw type of the Task 1/5 serializer. `locality` = first comma part of `address`, else `city`. `isExclusive` = `listingSource === 'exclusive'`. API errors surface `ApiError.message` unchanged (server copy is user-facing).

- [ ] **Step 1: Failing tests:** `visitListParams({tab:'upcoming', search:'  ravi ', clientId:''})` → `tab=upcoming&search=ravi` only; `mapShowing` of a fixture with `endAt` 10:45 → `durationMinutes: 45`, `locality` from address, `clientName` fallback `"Client"` when client null; `mapShowing` with `listingSource:'platform'` → `isExclusive:false`.
- [ ] **Step 2:** `npx tsx --test lib/api/site-visits.test.ts` → FAIL. **Step 3:** implement. **Step 4:** → PASS.

### Task 8: Visit model rewrite (pure)

**Files:**

- Modify: `FE/features/new-site-visits/model.ts`
- Modify: `FE/lib/visits/new-site-visits.test.ts` (replace preview-store / free-time tests; keep reminder tests that still apply to helpers left untouched)

**Interfaces (Produces):**

```ts
export type VisitState = "upcoming" | "running" | "needs_update" | "completed" | "not_attended" | "cancelled";
export function visitState(v: Pick<BrokerVisit, "status" | "startsAt" | "endsAt">, now: number): VisitState;
export type VisitActionKind = "reschedule" | "cancel" | "completed" | "not_attended" | "view";
export function getVisitActions(v: BrokerVisit, now: number): VisitActionKind[];
export type VisitDraft = {
    leadId: string;
    clientId: string;
    propertyId: string;
    durationMinutes: VisitDuration | null;
    date: string;
    startAt: string;
    notes: string;
    reminders: number[];
};
export function validateVisitDraft(d: VisitDraft, now: number): Partial<Record<keyof VisitDraft, string>>;
export type ScheduleIntent = { leadId?: string; clientId?: string; propertyId?: string };
export function parseScheduleIntent(p: URLSearchParams): ScheduleIntent | null; // null unless schedule=1
export function matchIntent(intent: ScheduleIntent, leads: BookableLead[]): BookableLead | null; // leadId first, then client+property
export function bookableDates(now: number): string[]; // 14 IST date keys from today
export const DURATION_CHIPS: { value: VisitDuration; label: string }[]; // "30 min","45 min","1 hour"
```

Actions: upcoming → reschedule, cancel; running/needs_update → completed, not_attended, reschedule, cancel; completed → not_attended; not_attended → completed; cancelled → view. Drop `reschedule` when `!isExclusive`. Validation messages: clientId "Choose a client.", propertyId "Choose a property.", durationMinutes "Choose how long the visit is.", date "Choose a visit date.", startAt "Choose a start time." / "Pick a time in the future.", notes over `MAX_CHARS.visitNote` existing text. Keep `VISIT_TABS` (add `cancelled`), `STATE_LABELS`, `DATE_RANGES`, `visitDateBounds`, reminder helpers. Remove `SiteVisit`, `validateDraft`, `newVisitDraft`, `repeatVisitDraft`, `draftTimes`, conflict logic.

- [ ] **Step 1: Failing tests:** state boundaries (start exactly now → running; end exactly now → needs_update; status completed in the future stays completed); actions table above incl. no reschedule on platform visit; `validateVisitDraft` with null duration → "Choose how long the visit is."; `parseScheduleIntent(new URLSearchParams('schedule=1&leadId=l1'))` → `{leadId:'l1'}`, without `schedule=1` → null; `matchIntent({leadId:'x'}, leads)` → null (Review Focus 4); `matchIntent({clientId:'c1',propertyId:'p1'}, leads)` → that lead; `bookableDates(now)` length 14, first = today IST.
- [ ] **Step 2–4:** `npx tsx --test lib/visits/new-site-visits.test.ts` FAIL → implement → PASS.

### Task 9: Data hooks + real time

**Files:**

- Create: `FE/features/new-site-visits/use-visits.ts`
- Create: `FE/lib/visits/next-change.ts`, test `FE/lib/visits/next-change.test.ts`

**Interfaces (Produces):**

```ts
// lib/visits/next-change.ts
export function msUntil(nextChangeAt: string | null, now: number): number | null; // null when absent; min 1000; max 2_147_483_000 (setTimeout cap)
// use-visits.ts
export const VISITS_KEY = ["broker-visits"] as const;
export function useVisitList(q: VisitListQuery): UseInfiniteQueryResult<VisitListPage>; // key [...VISITS_KEY,"list",q], limit 20
export function useBookableLeads(): UseQueryResult<BookableLead[]>; // key [...VISITS_KEY,"bookable"]
export function useFreeTimes(a: Parameters<typeof siteVisitsApi.freeTimes>[0] | null): UseQueryResult<string[]>;
export function useVisitsLive(nextChangeAt: string | null): void;
export function useVisitMutations(): { book; reschedule; cancel; setOutcome }; // each invalidates VISITS_KEY on settle
```

`useVisitsLive`: reads the access token from the Redux auth slice (same source `features/chat/chat-modal.tsx` uses), `getNotificationSocket(token)`, `socket.on('visit.changed', invalidate)` and `socket.on('connect', invalidate)`, cleanup with `off`; `setTimeout(invalidate, msUntil(nextChangeAt, Date.now()))` re-armed when `nextChangeAt` changes; `refetchOnWindowFocus: true` on list queries.

- [ ] **Step 1: Failing test:** `msUntil(null, 0)` → null; `msUntil(new Date(5000).toISOString(), 0)` → 5000; past time → 1000; 60 days ahead → 2_147_483_000.
- [ ] **Step 2–4:** `npx tsx --test lib/visits/next-change.test.ts` FAIL → implement both files → PASS; `npx tsc --noEmit` clean.

### Task 10: Schedule / reschedule form

**Files:**

- Modify: `FE/features/new-site-visits/schedule-form.tsx`, `FE/features/new-site-visits/visit-pickers.tsx`
- Create (if `schedule-form.tsx` passes ~250 lines): `FE/features/new-site-visits/time-chips.tsx`

**Interfaces:**

- Consumes: Tasks 7–9.
- Produces: `ScheduleForm({ visit?: BrokerVisit; intent?: BookableLead | null; intentMissed?: boolean; onDone: (id?: string) => void; onBack: () => void })`.

Order: Client → Property (only that client's `BookableLead`s; auto-pick when one) → Length chips (none preselected for new; visit's length for reschedule) → Date chips/picker from `bookableDates` → Start-time chips from `useFreeTimes` (shown only after length+date; reschedule passes `excludeShowingId`; empty: "No free times this day — try another date.") → Notes. Reminder picker stays rendered exactly as today and is not sent. Reschedule locks client + property (read-only text). `intentMissed` shows "This deal can't be booked here." above the form. On submit error, show `ApiError.message` and refetch free times. `VisitEntityCombobox` takes `options: {value,label}[]` instead of reading preview data. Clearing client clears property/time; changing length/date clears start time.

- [ ] **Step 1:** Implement. **Step 2:** `npx tsc --noEmit` and `npx eslint features/new-site-visits` clean.
- [ ] **Step 3:** Manual check in Task 12.

### Task 11: Page, list, detail, filters, sort, pipeline intent

**Files:**

- Modify: `FE/features/new-site-visits/new-site-visits-page.tsx`, `visit-list.tsx`, `visit-detail.tsx`, `visit-filters.tsx`, `visit-actions.ts`, `visit-status.tsx`
- Delete: `FE/features/new-site-visits/preview-store.ts` (only if nothing else imports it — check with grep)

Page state: `tab` (default upcoming), `search` (debounced 300 ms before entering the query), `filters {client, property, range, from, to}`, `sort?: VisitSort`. Query = `useVisitList({ tab, search, clientId, propertyId, from, to, sort })` where `from/to` come from `visitDateBounds(range, now)`; default range per tab stays as today (upcoming next7, running today, else past30 — `all` sends none). Tabs show `counts`. "Show more" calls `fetchNextPage`. `useVisitsLive(firstPage.nextChangeAt)`.

Filters sheet (`VisitFiltersDialog` rewritten, no `OwnerListingsFilterSheet`): client select (`clientOptions`), property select (`propertyOptions`), date range (existing `DATE_RANGES` + `VisitDateRangeDialog`). Sort control next to search: "Soonest first" (`start_asc`), "Latest first" (`start_desc`), "Recently booked" (`booked_desc`); unset = server default. Clear resets all.

Detail: actions from `getVisitActions`; Cancel and outcome use the existing `AttendanceConfirmation` confirm step; remove Delete, history list, and "schedule another" stays (opens form with the same client+property as intent). Show "Waiting for owner" when `status === 'scheduled' && !isExclusive`. Rows/detail read names from `BrokerVisit`, not preview lists.

Pipeline intent: on mount, `parseScheduleIntent(useSearchParams())`; if present and `leadId` → `siteVisitsApi.activeForLead(leadId)`; found → open reschedule form for it; else open new form with `matchIntent(intent, bookable)` (null → `intentMissed`). Then `router.replace('/broker/visits')`.

- [ ] **Step 1:** Implement. **Step 2:** `npx tsc --noEmit`, `npx eslint features/new-site-visits app/(role)/broker/visits`, `npm test` all PASS.

### Task 12: Pipeline card + end-to-end check

**Files:**

- Modify: `FE/features/pipeline/stage-blocks/visit-stage-block.tsx`

- [ ] **Step 1:** Render the "Schedule visit" button and reschedule pencil only when `deal.property.isExclusiveProperty`; otherwise keep the date line / "No visit booked yet" with no action.
- [ ] **Step 2:** Full checks: FE `npm test`, `npx tsc --noEmit`, `npm run lint`; BE `npx jest`, `npx tsc --noEmit`.
- [ ] **Step 3:** Run both apps (BE `npm run start:dev`, FE `npm run dev`) and, as a broker with an exclusive listing and an open deal: book 45 min → appears in Upcoming; the 30-min chip right after it is gone; reschedule it; open Pipeline Site visit card → lands on reschedule; in a second tab cancel → first tab updates without refresh; book a visit ~2 minutes ahead and watch it move to Running unaided. Report anything that couldn't be run (DB, credentials) honestly.
