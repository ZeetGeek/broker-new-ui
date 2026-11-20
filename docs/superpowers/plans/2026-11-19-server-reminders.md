# Server Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The backend times task and site-visit reminders and delivers each as a notification (bell + live popup); the frontend stops browser-side timing and saves visit reminders.

**Architecture:** Pure reminder computation (`src/reminder/reminder-rules.ts`) yields due keys and the next instant; tasks and showings store `next_reminder_at`, recomputed on writes; `ReminderSchedulerService` ticks every 30 s, claims due rows with a conditional update and calls `NotificationService.notify`. Frontend listens to `notification.created` for `task_reminder` / `visit_reminder` and shows the existing toast.

**Tech Stack:** NestJS 11, Prisma 7, Jest + supertest; Next.js, React Query, socket.io-client, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-server-reminders-design.md`

## Global Constraints

- No code comments in new or changed code. Do not commit or push in either repo.
- No new dependencies. Plain `setInterval`, no `@nestjs/schedule`.
- Every schema change ships a migration folder; never edit existing migrations; never `migrate reset`.
- Keys: task start `start:<startAtISO>`, task due `<dueAtISO>:<minutes>`, visit `<startsAtISO>:<minutes>` (ISO = `Date#toISOString()`).
- Visit default offsets `[30]` when stored empty; explicit empty list from the API → 400 `Keep at least one reminder for this visit.`; max 6 distinct values in `0..525600`.
- Lateness window 60 minutes: older due reminders are marked delivered without notifying.
- Tick every 30 000 ms, batch 200 per kind, never overlapping; disabled when `REMINDERS_ENABLED=false` or `NODE_ENV=test`.
- Notification copy: task title `Task reminder`, visit title `Visit reminder`; task href `/broker/tasks?view=detail&task=<id>`; visit href `/broker/visits`.
- Backend Prettier style; Swagger on new routes; frontend lib/feature boundaries; Tabler icons from the registry only.

## Review Focus

1. **Stale client erasing delivered keys:** a PATCH carrying an older `deliveredReminderKeys` must not remove a server-delivered key (union then filter) — test in Task 3.
2. **Two ticks claiming one row:** only the tick whose conditional update affects 1 row notifies — test in Task 4.
3. **Visit cancelled/completed after `next_reminder_at` was set:** tick clears it without notifying — test in Task 4.
4. **Task moved after a reminder fired:** new keys fire at the new time; old keys don't block them — test in Task 2.
5. **Socket popup while mock mode is on:** mock mode keeps local timing and never subscribes — covered by Task 7 guard.

---

### Task 1: Schema and migration

**Files:**

- Modify: `broker-backend/prisma/schema.prisma`
- Create: `broker-backend/prisma/migrations/20261119150000_server_reminders/migration.sql`

**Interfaces:**

- Produces: `NotificationType.task_reminder`, `NotificationType.visit_reminder`; `Task.nextReminderAt DateTime?` (`@map("next_reminder_at") @db.Timestamptz`, `@@index([nextReminderAt])`); `Showing.reminders Int[] @default([])`, `Showing.deliveredReminderKeys String[] @default([]) @map("delivered_reminder_keys")`, `Showing.nextReminderAt DateTime? @map("next_reminder_at") @db.Timestamptz`, `@@index([nextReminderAt])`.

- [ ] **Step 1:** Edit schema; add the two enum values; also add both strings to the `NotifyInput['type']` union in `src/notification/notification.service.ts`.
- [ ] **Step 2:** Generate SQL with `prisma migrate diff --from-schema <HEAD schema copy> --to-schema prisma/schema.prisma --script` into the migration file. Review: only `ALTER TYPE "NotificationType" ADD VALUE` ×2, three/one added columns, two indexes.
- [ ] **Step 3:** `npx prisma migrate deploy`, `npx prisma generate`, `docker exec broker_backend npx prisma generate`. Expected: migration applied.
- [ ] **Step 4:** `npm run build` → exit 0.

---

### Task 2: Pure reminder rules

**Files:**

- Create: `broker-backend/src/reminder/reminder-rules.ts`
- Test: `broker-backend/src/reminder/reminder-rules.spec.ts`

**Interfaces:**

- Consumes: none (pure).
- Produces:
    ```ts
    export const VISIT_DEFAULT_REMINDERS = [30];
    export const REMINDER_LATENESS_MS = 3_600_000;
    export type DueReminder = { key: string; at: Date; kind: "start" | "due" | "visit"; minutes: number };
    export function istInstant(date: string, time: string): Date;
    export function taskReminderSchedule(task: {
        startDate: string | null;
        startTime: string | null;
        dueDate: string | null;
        dueTime: string | null;
        reminders: number[];
        startReminderEnabledAt: Date | null;
        completedAt: Date | null;
        deletedAt: Date | null;
    }): DueReminder[];
    export function visitReminderSchedule(visit: {
        startsAt: Date;
        reminders: number[];
        status: string | null;
    }): DueReminder[];
    export function effectiveVisitReminders(reminders: number[]): number[];
    export function planDelivery(
        schedule: DueReminder[],
        delivered: string[],
        now: Date,
    ): { fire: DueReminder[]; skip: DueReminder[]; nextAt: Date | null };
    export function keepConfiguredKeys(keys: string[], schedule: DueReminder[]): string[];
    ```
- Rules: schedule is sorted by `at`; empty for closed records (task completed/deleted; visit status not `scheduled`/`confirmed`). Task start reminder only when start date+time set and (`startReminderEnabledAt` null or `at >= startReminderEnabledAt`). `planDelivery`: undelivered with `at <= now` → `fire` if `now - at <= REMINDER_LATENESS_MS`, else `skip`; `nextAt` = earliest undelivered `at > now`.

- [ ] **Step 1: Write failing tests:**
    - `istInstant('2026-11-19','14:52').toISOString()` → `'2026-11-19T09:22:00.000Z'`.
    - task with start 14:51, due 14:52, reminders [0, 15], enabledAt 09:00Z → keys `['2026-11-19T09:07:00.000Z:15','start:2026-11-19T09:21:00.000Z','2026-11-19T09:22:00.000Z:0']` in time order.
    - start reminder dropped when `startReminderEnabledAt` is after start.
    - completed task → `[]`; cancelled visit → `[]`.
    - `effectiveVisitReminders([])` → `[30]`; visit at 10:30Z with `[]` → one key `'…T10:30:00.000Z:30'` at 10:00Z.
    - `planDelivery`: one due 5 min ago → fire; one due 2 h ago → skip; one in future → nextAt; delivered ones ignored.
    - moved task: delivered `['start:OLD']`, schedule with new start → new start key fires (Review Focus 4).
    - `keepConfiguredKeys(['a','start:X'], schedule with start:X)` → `['start:X']`.
- [ ] **Step 2:** `npx jest src/reminder/reminder-rules.spec.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement. Reuse `isTaskDate`/`isTaskTime` from `src/task/task-rules.ts`.
- [ ] **Step 4:** Re-run → PASS.

---

### Task 3: Keep `nextReminderAt` correct on task writes; merge delivered keys

**Files:**

- Modify: `broker-backend/src/task/task.service.ts`, `broker-backend/src/task/task.mapper.ts` (TaskRow gains `nextReminderAt: Date | null`)
- Test: `broker-backend/src/task/task.service.spec.ts`

**Interfaces:**

- Consumes: Task 2 `taskReminderSchedule`, `planDelivery`, `keepConfiguredKeys`.
- Produces: private `reminderColumns(row-like): { nextReminderAt: Date | null }` used in every task write (create, applyUpdate, complete claim + successor create, reopen, remove → null, restore, markDelivered).
- `applyUpdate`: when the patch carries `deliveredReminderKeys`, stored value becomes `keepConfiguredKeys(union(stored, sent), newSchedule)`; `nextReminderAt` from `planDelivery(newSchedule, keys, now).nextAt` — but if any undelivered reminder is already due (≤ now, within lateness) `nextReminderAt` = that earliest due instant so the tick fires it.
- Exact rule for `nextReminderAt` on write: earliest undelivered `at` among the schedule with `now - at <= REMINDER_LATENESS_MS` (i.e. due-but-fresh or future), else null.

- [ ] **Step 1: Write failing tests:**
    - `create with a due time and reminder stores nextReminderAt at the earliest reminder`.
    - `update with a stale deliveredReminderKeys keeps the server-delivered key` (stored `['start:…']`, patch `[]` plus title change → stored still contains it) (Review Focus 1).
    - `remove clears nextReminderAt; restore recomputes it`.
    - `complete clears nextReminderAt on the completed task and sets it on the successor`.
- [ ] **Step 2:** `npx jest src/task/task.service.spec.ts` → the 4 new tests FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx jest src/task` → PASS.

---

### Task 4: Scheduler service and notifications

**Files:**

- Create: `broker-backend/src/reminder/reminder-scheduler.service.ts`, `broker-backend/src/reminder/reminder.module.ts`
- Modify: `broker-backend/src/app.module.ts`
- Test: `broker-backend/src/reminder/reminder-scheduler.service.spec.ts`

**Interfaces:**

- Consumes: Task 2 rules; `NotificationService.notify(NotifyInput)`; `PrismaService`.
- Produces:
    ```ts
    class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
        tick(now?: Date): Promise<{ tasks: number; visits: number }>;
        backfill(now?: Date): Promise<void>;
    }
    ```
- `onModuleInit`: unless disabled, `await backfill()` (non-blocking: `void`), then `setInterval(() => void this.tick(), 30000)`; a `running` flag skips overlapping ticks; errors are caught and logged with Nest `Logger`.
- `tick` for tasks: `findMany({ where: { nextReminderAt: { lte: now } }, orderBy: { nextReminderAt: 'asc' }, take: 200 })`; per row compute schedule + `planDelivery`; `updateMany({ where: { id, nextReminderAt: row.nextReminderAt }, data: { deliveredReminderKeys: [...row.delivered, ...fire.keys, ...skip.keys], nextReminderAt: nextAt } })`; if `count === 1`, `notify` each `fire` item. Same for showings (include `lead.broker.userId`, `lead.client.name`, `property.title`, `visitSlot.startAt`; start = `visitSlot?.startAt ?? scheduledDate`).
- Copy: task body `` `${title} · ${kind==='start' ? 'At task start' : minutes===0 ? 'At due time' : `${label} before due`} · ${istLabel(at-of-event)}` ``; visit body `` `${propertyTitle} with ${clientName} · ${minutes===0 ? 'Starting now' : `In ${label}`} · ${time}` `` — `label` via a small `reminderLabel(minutes)` ("15 min", "1 hour", "1 day", "2 hours 30 min"); time formatted in `Asia/Kolkata` `h:mm a`, task prefix `Today`/`Tomorrow`/`d MMM`.
- `metadata: { reminderKey, kind, minutes, at }`; task `referenceType: 'task'`, visit `referenceType: 'showing'`, `relatedPropertyId`, `relatedLeadId`.
- `backfill`: tasks with `nextReminderAt: null, completedAt: null, deletedAt: null` and (`dueDate >= today-1` or `startDate >= today-1`); showings with `nextReminderAt: null`, status in scheduled/confirmed, `scheduledDate > now`; set computed value (no notify).

- [ ] **Step 1: Write failing tests** (hand-rolled Prisma mock, injected `now`):
    - `tick notifies a due task reminder once and stores the key and next instant`.
    - `tick does not notify when the conditional update loses` (`updateMany` → `{count:0}`) (Review Focus 2).
    - `tick clears a cancelled visit without notifying` (Review Focus 3).
    - `tick sends a visit reminder to the lead's broker with the default 30 minutes`.
    - `tick marks a 2-hour-late reminder delivered without notifying`.
    - `backfill sets nextReminderAt for an upcoming visit with no stored reminders`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; register `ReminderModule` (imports `NotificationModule` if not global — check) in `AppModule`.
- [ ] **Step 4:** `npx jest src/reminder src/task` → PASS; `npm run build` → 0.

---

### Task 5: Visit reminders on the slot API

**Files:**

- Modify: `broker-backend/src/slot/dto/book-exclusive-slot.dto.ts`, `dto/book-slot.dto.ts`, `dto/reschedule-showing.dto.ts`, `src/slot/slot.service.ts`, `src/slot/slot.controller.ts`
- Create: `broker-backend/src/slot/dto/showing-reminders.dto.ts`
- Test: `broker-backend/src/slot/slot-visit-reminders.spec.ts`

**Interfaces:**

- Consumes: Task 2 `visitReminderSchedule`, `planDelivery`, `effectiveVisitReminders`.
- Produces: optional `reminders?: number[]` on the three DTOs (`@IsArray @ArrayMinSize(1) @ArrayMaxSize(6) @IsInt({each}) @Min(0,{each}) @Max(525600,{each})`, `@ArrayUnique`), message for min size `Keep at least one reminder for this visit.`; `ShowingRemindersDto { reminders: number[] }` same rules required; route `PATCH /slots/broker/showings/:showingId/reminders` (`@RequireAccess('calendar','manage')`) → `slotService.updateRemindersForBroker(userId, showingId, reminders)` returning the serialized showing; `serializeShowing` output gains `reminders: effectiveVisitReminders(s.reminders ?? [])`.
- Book (both paths) and reschedule store `reminders ?? []` and `nextReminderAt` computed; reschedule resets `deliveredReminderKeys` to `[]`. `updateRemindersForBroker`: `findBrokerShowing`; status must be scheduled/confirmed else 400 `This visit is no longer upcoming.`; recompute.

- [ ] **Step 1: Write failing tests** (style of `slot-exclusive-open.spec.ts`):
    - `exclusive book stores reminders and nextReminderAt`.
    - `updateRemindersForBroker recomputes nextReminderAt and returns default-applied reminders`.
    - `updateRemindersForBroker rejects a cancelled visit`.
    - DTO: `validate(plainToInstance(ShowingRemindersDto,{reminders:[]}))` has the min-size message.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → only the 4 pre-existing representative failures; `npm run build` → 0.

---

### Task 6: Backend e2e

**Files:**

- Modify: `broker-backend/test/tasks.e2e-spec.ts` (or Create `test/reminders.e2e-spec.ts` reusing its bootstrap)

**Interfaces:**

- Consumes: `app.get(ReminderSchedulerService).tick(now)`.

- [ ] **Step 1:** Tests (set `NODE_ENV=test` already default in jest so interval is off):
    - create a task due `now+5min` (IST date/time strings) with `reminders:[0]`; `tick(new Date(dueAt))` → exactly one `notifications` row `type=task_reminder` for the user; second `tick` same instant → still one.
    - PATCH that task with `deliveredReminderKeys: []` → GET shows the key still present.
- [ ] **Step 2:** `npm run test:e2e -- tasks` → all pass; leftover-data check returns zeros.

---

### Task 7: Frontend — server popups replace browser timing

**Files:**

- Modify: `broker-new-ui/features/tasks/task-reminder-listener.tsx`, `broker-new-ui/lib/notifications/classify.ts` (visual for `task_reminder`)
- Create: `broker-new-ui/features/tasks/reminder-toast.ts` (pure: `reminderToastContent(item: NotificationItem): { kind: 'task'|'visit'; title; line; href; action } | null`)
- Test: `broker-new-ui/lib/tasks/reminder-toast.test.ts`

**Interfaces:**

- Consumes: `NotificationItem` (`lib/api/notifications.ts`), `getNotificationSocket(accessToken)` (`lib/socket/notifications.ts`), `isMockMode()`.
- Produces: `reminderToastContent` returns null for other types; task → action `View task`, href from item; visit → action `View visit`.
- Listener: in mock mode keep the existing local timing path unchanged. In live mode: no `useTasks` timing loop; subscribe `socket.on('notification.created', handler)` / `off` on cleanup; handler shows the existing custom toast markup with `reminderToastContent`, and for `task` invalidates `["tasks", accountId]`. Token source = same as `providers/notification-provider.tsx`.
- `classify.ts`: a `task`/`reminder` key maps to a task/alarm visual (add icon to the registry if needed).

- [ ] **Step 1: Write failing tests:** task item → `{ kind:'task', title:'Task reminder', action:'View task', href:'/broker/tasks?view=detail&task=t1' }`; visit item → `{ kind:'visit', action:'View visit' }`; `system` item → null.
- [ ] **Step 2:** `npx tsx --test lib/tasks/reminder-toast.test.ts` → FAIL.
- [ ] **Step 3:** Implement module and listener changes.
- [ ] **Step 4:** Test → PASS; `npm test` → only the 5 baseline failures; `npx tsc --noEmit` → only the baseline error.

---

### Task 8: Frontend — save visit reminders

**Files:**

- Modify: `broker-new-ui/lib/api/site-visits.ts`, `broker-new-ui/lib/api/broker-visits-map.ts` (ApiShowing `reminders?: number[]`, BrokerVisit `reminders: number[]`), `broker-new-ui/features/new-site-visits/model.ts`, `schedule-form.tsx`, `visit-reminder-picker.tsx`, `use-visits.ts`
- Test: `broker-new-ui/lib/visits/new-site-visits.test.ts`

**Interfaces:**

- Consumes: Task 5 routes.
- Produces: `siteVisitsApi.book({... , reminders })`, `reschedule(id, {..., reminders})`, `updateReminders(id, reminders): Promise<BrokerVisit>`; `EMPTY_DRAFT.reminders = [30]`; `rescheduleDraft` copies `visit.reminders.length ? visit.reminders : [30]`; `mapShowing` sets `reminders: api.reminders?.length ? api.reminders : [30]`; validation error `Keep at least one reminder for this visit.` when empty; picker disables removing the last chip; form edit: if only `reminders` differ from the visit (same start, duration, notes) call `updateReminders`, else `reschedule` with reminders; mutation in `useVisitMutations` invalidates the visits list.
- Remove the "Shown in the form only; not saved yet" type note (it becomes untrue).

- [ ] **Step 1: Write failing tests:** `EMPTY_DRAFT.reminders` deep-equals `[30]`; `rescheduleDraft` of a visit with `reminders:[60,15]` keeps them; `mapShowing` with no reminders → `[30]`; validation of a draft with `reminders: []` reports the min message.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests pass; `npm test` baseline-only failures; `npx tsc --noEmit` baseline-only.

---

### Task 9: Live end-to-end in the browser

**Files:** scratchpad only (`<scratchpad>/tasks-e2e/`).

- [ ] **Step 1:** Restart `broker_backend` container (regenerated client from Task 1). Seed the throwaway broker (`seed.cjs up`), a timed task (start +1 min, due +2 min, reminders [0]) via SQL with `next_reminder_at` computed by calling the backfill (restart triggers it) — or create via UI quick-add with due time.
- [ ] **Step 2:** Playwright: keep `/broker/dashboard` open → both "Task reminder" toasts appear; bell shows two `Task reminder` items; network shows **no** `POST /tasks/:id/reminders/delivered`.
- [ ] **Step 3:** Closed-tab case: seed another task due +2 min, close browser, wait past due, open → bell contains it, no toast storm.
- [ ] **Step 4:** Visit: book a visit on an exclusive listing via UI with "15 min before" (or seed showing via SQL with start +16 min and reminders [15]); observe "Visit reminder" toast + bell item at fire time.
- [ ] **Step 5:** Clean up (`seed.cjs down`, delete seeded showings/notifications); final verification: backend `npm test`, `npm run test:e2e -- tasks`, `npm run build`; frontend `npm test`, `npx tsc --noEmit`.
