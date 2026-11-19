# Server-side reminders for tasks and site visits

Date: 2026-11-19
Repos: `broker-backend` (NestJS + Prisma) and `broker-new-ui` (this repo)
Builds on: `2026-11-19-broker-tasks-backend-design.md`

## Intent

Phase 1 launches the broker CRM. Brokers must get reminders on time even when
the Tasks screen is not open. Today task reminders are timed by a browser
listener (`features/tasks/task-reminder-listener.tsx`) and site-visit
reminders are not delivered at all (the visit form's Reminders picker is not
even sent to the API). The backend will time both, and each reminder becomes a
normal notification: it appears in the notification bell/history and pops up
live, the same way task reminders pop up today.

## Goals

- Task reminders (task start + each "before due" offset) fired by the server,
  exactly once, even if no tab is open; seen in the bell next time the app opens.
- Site-visit reminders for the broker: the offsets chosen on the visit form; if
  none chosen, **30 minutes before** the visit start (user decision).
- Live popup when a reminder fires while the app is open: the existing in-app
  toast style ("Task reminder" / "Visit reminder" + link) plus the existing
  browser popup from `providers/notification-provider.tsx`.
- Visit form reminders are saved on book and reschedule and shown again when
  the visit is edited.
- Remove browser-side reminder timing so nothing fires twice.

## Non-goals

- Push to a closed app/phone (web push, FCM), email, SMS, WhatsApp (deferred).
- Owner-side visit reminders.
- A settings screen for default lead times.
- Team-member routing of visit reminders (team screens are deferred).

## Anti-goals

- Duplicate notifications for one reminder (two servers, two ticks, retries).
- A burst of stale reminders after downtime.
- New runtime dependencies.

## Constraints

- Backend rules (`broker-backend/CLAUDE.md`): migration folder for every schema
  change, HttpException-only errors, Swagger on routes, thin controllers.
- Frontend rules (`AGENTS.md`, `.claude/rules/*`): API code in `lib/api/`,
  feature code in `features/`, Tabler icons via the registry, toasts only for
  transient success/info (a reminder popup is informational, as today).
- No code comments; nothing committed (user instruction).
- Times are IST wall clock for tasks (`startDate`/`startTime`, `dueDate`/
  `dueTime`); visit start is the `Showing`'s `visitSlot.startAt ??
scheduledDate` instant.

## Approaches considered

- **A. Stored "next reminder at" per record + 1-minute tick (chosen).** Each
  task and showing stores the instant of its earliest undelivered reminder;
  writes recompute it; an in-process timer picks rows whose instant has passed.
  Cheap indexed lookup regardless of data size; costs write-path upkeep.
- **B. Full scan each minute.** No new column; load all open future tasks and
  visits and compute in code. Least code but degrades with data (offsets reach
  365 days, so the scan can't be narrowed). Rejected.
- **C. Same as A on `@nestjs/schedule`.** Same behaviour, adds a dependency.
  Rejected (no new dependencies without need).

User picked A.

## Data model

Migration `<ts>_server_reminders`:

- `enum NotificationType` gains `task_reminder`, `visit_reminder`.
- `tasks.next_reminder_at TIMESTAMPTZ NULL` + index `(next_reminder_at)`.
- `showings.reminders INTEGER[] NOT NULL DEFAULT '{}'`,
  `showings.delivered_reminder_keys TEXT[] NOT NULL DEFAULT '{}'`,
  `showings.next_reminder_at TIMESTAMPTZ NULL` + index `(next_reminder_at)`.

Reminder keys reuse the frontend's formats so existing UI keeps working:

- Task start: `start:<startAtISO>`; task due offset: `<dueAtISO>:<minutes>`
  (same as `features/tasks/model.ts`).
- Visit: `<startsAtISO>:<minutes>` (same as `features/new-site-visits/model.ts`).
  Because keys embed the scheduled instant, moving/rescheduling naturally makes
  new keys and old delivered keys stop matching.

## Reminder rules

Task (open = not completed, not deleted):

- Start reminder at `startDate+startTime` IST, only if that instant is ≥
  `startReminderEnabledAt` when set (mirrors `taskDueReminders`).
- Each `reminders[]` offset at `dueAt − minutes` where `dueAt` =
  `dueDate+dueTime` IST.
- Already-delivered keys are skipped.

Visit (status `scheduled` or `confirmed`):

- **Always at least one reminder (user decision).** Offsets = `reminders[]`,
  or `[30]` when empty (covers existing rows). The form starts with
  "30 min before" selected and does not allow removing the last reminder; the
  API rejects an explicit empty list with 400
  `Keep at least one reminder for this visit.`
- Each at `startsAt − minutes`.

`nextReminderAt` = earliest instant among undelivered eligible reminders, or
null if none / record not open.

Lateness: when the tick finds a reminder more than **60 minutes** late (e.g.
after downtime, or a "1 day before" reminder added 2 hours before due), it is
marked delivered without notifying. Within 60 minutes it fires.
(Builder's call recorded here: 60 min.)

## Scheduler

- `ReminderSchedulerService` (backend, `src/reminder/`), started on module init
  with `setInterval` every 30 s, stopped on destroy. Disabled when
  `REMINDERS_ENABLED=false` or `NODE_ENV=test`; a tick never overlaps itself.
- Each tick: up to 200 tasks and 200 showings with
  `next_reminder_at <= now()`, oldest first. For each row: re-read it, compute
  due keys and the next instant, then a conditional update
  `WHERE id = ? AND next_reminder_at = <value read>` that writes the merged
  delivered keys and new `next_reminder_at`. Only if exactly one row updated
  does it call `NotificationService.notify` for each due (non-stale) key. This
  makes delivery at-most-once across overlapping ticks or multiple servers.
- Startup backfill: once at boot, compute `next_reminder_at` for open tasks
  and scheduled/confirmed future showings whose value is null.

Write-path upkeep:

- `TaskService`: every create/update/bulk/complete/successor/reopen/remove/
  restore/markDelivered recomputes `nextReminderAt` for the rows it writes.
- `SlotService`: broker book (exclusive and owner-slot), reschedule set
  `reminders` and recompute; cancel/outcome/owner status changes may leave it
  — the tick re-checks status and clears it without notifying.

## Notifications

`NotificationService.notify` with:

- Task: `type: task_reminder`, recipient = task `userId`, `title: 'Task
reminder'`, `body: '<task title> · <At task start | 15 min before due …> ·
<Today, 2:52 PM>'`, `href: /broker/tasks?view=detail&task=<id>`,
  `referenceType: 'task'`, `referenceId: <task id>`,
  `metadata: { reminderKey, kind: 'start'|'due', minutes, at }`.
- Visit: `type: visit_reminder`, recipient = `showing.lead.broker.userId`
  (same recipient as existing broker visit notifications), `title: 'Visit
reminder'`, `body: '<property title> with <client name> · <in 30 min | now>
· <4:00 PM>'`, `href: /broker/visits`, `referenceType: 'showing'`,
  `referenceId`, `relatedPropertyId`, `relatedLeadId`,
  `metadata: { reminderKey, minutes, at }`.

## API changes

- `POST /slots/broker/exclusive/book`, `POST /slots/:id/book` (broker) and
  `PATCH /slots/broker/showings/:id/reschedule` accept optional
  `reminders: int[]` (≤ 6, distinct, 0..525600).
- New `PATCH /slots/broker/showings/:id/reminders` with `{ reminders }`
  (1–6 values) for the broker who owns the visit's lead, any visit type,
  status scheduled/confirmed only; recomputes `next_reminder_at`. (Builder
  call: reschedule refuses owner-slot visits and always moves the time, so
  reminders need their own route.)
- Broker showing responses include `reminders`, with the default applied
  (`[30]` when stored empty), so the form shows what will fire.
- Task API: `deliveredReminderKeys` written by a client is **merged** with the
  stored keys (union) and then filtered to keys still configured for the
  task's current schedule, so a stale client can never erase a server-delivered
  key (builder call; keeps "exactly once"). `POST /tasks/:id/reminders/delivered`
  stays but the frontend stops calling it for timing.

## Frontend

- `features/tasks/task-reminder-listener.tsx`: no more client-side timing. It
  listens for `notification.created` (via the existing notification socket /
  provider) with type `task_reminder` or `visit_reminder` and shows the same
  custom toast it shows today ("Task reminder" / "Visit reminder", body line,
  "View task" / "View visit"). On `task_reminder` it invalidates the tasks
  query so delivered state refreshes. Mock mode keeps the old local timing.
- `lib/api/site-visits.ts` `book`/`reschedule` send `reminders`; new
  `updateReminders(id, reminders)`; mapping reads them back into
  `BrokerVisit.reminders`. The schedule form starts with `[30]` for a new
  visit, pre-fills stored reminders when editing, blocks removing the last
  one, and when editing with only reminders changed calls `updateReminders`
  instead of `reschedule`.
- Notification bell: `task_reminder`/`visit_reminder` get an icon/visual and
  pass `isLaunchEventVisible`.

## Rollout

Ship backend and frontend together (builder call). The scheduler is on by
default (`REMINDERS_ENABLED` unset = on); the new frontend stops browser
timing in live mode. Deploying only one side would double or drop reminders.

## Testing

- Backend unit: reminder computation (task start gating, due offsets, visit
  default 30, lateness), tick (conditional update wins once; loses → no
  notify; cancelled/completed → cleared, no notify), write-path recompute.
- Backend e2e: create task due shortly with reminder → run one tick via the
  service with an injected clock → notification row exists once; second tick
  → still one. Visit booked with/without reminders → stored and default 30.
- Browser: real dev stack; task reminder and visit reminder arrive as toast
  and in the bell with the tab open; with the tab closed at fire time, the
  notification is in the bell after reopening; no duplicate toast.

## Left to the builder

- File layout inside `src/reminder/` and DTO details.
- Exact toast/notification copy beyond the patterns above.
- Migration folder timestamp.
