# Visits on the real API (broker)

Date: 2026-11-18 · Size: project · Repos: `broker-new-ui` (this) and `broker-backend`

Supersedes the "Visits is not changed" note in
`2026-11-18-pipeline-schedule-visit-design.md`. The pipeline link built there is
kept as is; this work makes Visits read it.

## Intent

The broker Visits screen (`/broker/visits`, `features/new-site-visits/`) is a
design preview: it saves to browser storage and picks from sample clients and
properties. Brokers need it to be real:

- book a visit on their **exclusive listings** for a client with an open deal,
- arrive from a Pipeline **Site visit** card with client and property already
  chosen, and book in a few taps,
- reschedule, cancel, and record what happened,
- find visits with filters, search and sort that are actually correct,
- see the list change live: a visit moves from **Upcoming** to **Running** when
  its start time arrives, and changes made elsewhere show without a refresh.

Users are non-technical, on cheap Android phones. Simple and understandable
beats complete.

## Goals

1. Schedule a visit on an exclusive listing: client → property → length
   (30 min / 45 min / 1 hour, required chip) → date → a free start time.
2. Pipeline link `/broker/visits?schedule=1&clientId=…&propertyId=…&leadId=…`
   opens the schedule form with client and property filled.
3. Reschedule an exclusive-listing visit (new length / date / time, same record).
4. Cancel a visit. Mark a started visit **Completed** or **Not attended**, and
   correct that later (switch between the two).
5. Server-side tabs, filters, search, sort and paging.
6. Real-time: live push on every visit change + automatic tab moves as time
   passes.
7. The same validation rules on server and screen.

## Non-goals

- **Reminders.** Leave the reminder UI and code as they are; do not send them
  to the API, do not remove them. To be implemented later.
- Booking from Visits on owner-listed (represented) properties — see Open
  question 1.
- Changing the client or property of an existing visit (cancel and book again).
- Deleting visits (cancel replaces delete).
- Visit history timeline (the backend has none; the detail view drops it).
- Owner Visits screen changes, beyond keeping it working.
- The old broker page `/broker/old-visits` (`features/site-visits/`) gets no new
  features but must keep working against the changed backend.

## Anti-goals

- A broker typing a free-form time and only learning on submit it is taken.
- Any mismatch between what the tab says and what the visit's time says
  (e.g. a visit sitting in Upcoming after it started).
- Re-entering client or property data that already exists in the deal.

## Constraints

- Backend: NestJS + Prisma + PostgreSQL, `broker-backend/src/slot/`. Frontend:
  Next.js, TanStack Query, socket.io client.
- All times are IST (Asia/Kolkata). Visit hours **10:00–19:00 IST**, bookable
  **today through 13 days ahead** (existing `EXCLUSIVE_MAX_DAYS = 14`).
- AGENTS.md rules: Tabler icons via `components/shared/icons.tsx`, "Client"
  wording, CRM list filter chrome (Filters sheet with only the dims the page
  needs), `docs/STRUCTURE.md` placement, never edit `components/ui/`.
- The user commits manually — no commits.

## Approaches

**Where filtering, search, sort run**

- **Server (chosen).** Bookings endpoint takes tab, date range, client,
  property, search, sort, page. Correct at any volume, light on cheap phones.
- Browser: load the date range and filter locally like the preview. Less backend
  work, but slows on cheap phones and silently truncates past the 1000-row cap.

**Real time**

- **Live push (chosen)** over the existing `/notifications` socket.io gateway
  (`NotificationGateway.emitToUser`, user rooms) plus a timer for time-based tab
  moves.
- Polling every 30 s: simpler, but late and uses mobile data all day.

## Design

### Backend (`broker-backend`)

**1. Store the end time.** Add `endAt DateTime? @map("end_at") @db.Timestamptz`
to `Showing`. Migration backfills: `visit_slots.end_at` when the showing has a
slot, else `scheduled_date + 30 min`. All new showings write `endAt` (owner-slot
bookings copy the slot's end). Overlap checks
(`assertNoExclusiveOverlap`, `assertBrokerScheduleFree`, and the exclusive free
time grid) use `endAt` instead of assuming 30 minutes. Serialized showings
expose `endAt`.

**2. Length.** One shared rule: `durationMinutes ∈ {30, 45, 60}`.
`BookExclusiveSlotDto` and the reschedule DTO take `startAt` + `durationMinutes`
(server computes `endAt`; reject a mismatching `endAt` if still sent).
`assertExclusiveSlotWindow` validates: start on a 30-minute step from 10:00 IST,
`start + duration ≤ 19:00 IST`, start in the future, date within the 14-day
window.

**3. Free start times.** `GET /slots/broker/exclusive/open` takes
`durationMinutes` (default 30) and returns, per property, the start times on the
30-minute grid where a visit of that length fits and does not overlap any
scheduled/confirmed visit on the property, **any of the broker's own visits**,
or (when `leadId` is given) **any visit of that client elsewhere** — the same
three checks booking runs, so a chip shown is a chip that books (anti-goal 1).
Also accepts `excludeShowingId` so a reschedule doesn't collide with itself.
_(Our call, from the reviewer: property-only chips would let a broker tap a
time that then fails with `BROKER_TIME_CONFLICT` / `LEAD_TIME_CONFLICT`.)_ The response keeps `leadOptions`
(client ↔ property ↔ lead mapping) — the screen uses it to fill the client and
property pickers and to find the `leadId` to book with.

**4. Reschedule.** `PATCH /slots/broker/showings/:id/reschedule`
`{ startAt, durationMinutes, notes? }`. Allowed only when the showing belongs to
the broker, is on the broker's exclusive listing (`visitSlotId` null and the
property is `ownerType = broker` owned by them), status is
scheduled/confirmed, and it has not been marked. A visit already in Needs update
(ended, not marked) may be rescheduled. Same validation and overlap checks as
booking, excluding itself. Updates `scheduledDate`, `endAt`, `notes`.

**5. Outcome.** `PATCH /slots/broker/showings/:id/outcome`
`{ status: "completed" | "no_show" }`. Allowed once the visit has started (start
≤ now), on scheduled/confirmed, and also switching completed ↔ no_show. Not on
cancelled. **It changes the visit's status only** — it does not move the deal's
pipeline stage, add notes, or create follow-ups. _(Our call: pipeline stage
names are an open question in AGENTS.md, so automatic stage moves wait.)_

**6. Bookings list.** `GET /slots/broker/bookings` gains:

| Param                                | Values                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `tab`                                | `upcoming` · `running` · `needs_update` · `completed` · `not_attended` · `cancelled` |
| `clientId`                           | client id (`clients.id`)                                                             |
| `leadId`                             | deal id (`broker_property_leads.id`) — used by the pipeline link                     |
| `propertyId`, `from`, `to`, `search` | existing                                                                             |
| `sort`                               | `start_asc` · `start_desc` · `booked_desc`                                           |

Tabs are computed from status + `now` in SQL:

- upcoming: status scheduled/confirmed, `scheduledDate > now`
- running: status scheduled/confirmed, `scheduledDate ≤ now < endAt`
- needs_update: status scheduled/confirmed, `endAt ≤ now`
- completed: `completed` · not_attended: `no_show` · cancelled: `cancelled`

Search also covers property address and client phone. Default sort when `sort`
is absent: `start_asc` for upcoming/running/needs_update, `start_desc` for the
rest. The response adds:

- `counts`: number of visits per tab for the current filters minus `tab`
  (for tab badges),
- `nextChangeAt`: the earliest future `scheduledDate` or `endAt` among the
  broker's scheduled/confirmed visits (ignores filters), or `null`.

The existing `status` param keeps working for the old page.

**7. Live push.** New event `visit.changed`, payload `{ id, propertyId }`,
emitted with `NotificationGateway.emitToUser` to the broker's user and — for
owner-listed properties — the owner's user, after: book (both kinds),
reschedule, cancel (broker or owner), outcome, owner confirm. Add the constant
next to the others in `notification.constants.ts`.

**8. Tests.** Extend the existing `slot-*.spec.ts` style: length rules and the
19:00 cap, overlap using real `endAt` (45-min visit blocks the next 30-min
start), reschedule excluding itself, outcome only after start, tab
boundaries.

### Frontend (`broker-new-ui`)

**API layer.** A typed client for the endpoints above (book, reschedule,
cancel, outcome, list, free times) mapping API showings to the screen's visit
shape. Reuse or extend `lib/api/broker-visits.ts` / `broker-visits-map.ts`
where they already fit; keep the old page's functions working.

**Data.** `useQuery` keyed on `[visits, tab, filters, search, sort, page]`.
Replaces `visitPreviewStore`. The sample data stays only if something else
imports it.

**Real time.**

- Subscribe to `visit.changed` on the notification socket (follow
  `features/chat/chat-modal.tsx`'s use of `getNotificationSocket`), and
  invalidate visit queries.
- Set a timer to `nextChangeAt`; when it fires, invalidate visit queries. Re-arm
  from each response. This moves a visit Upcoming → Running → Needs update
  without a refresh.
- Also invalidate on window focus / socket reconnect (missed events while the
  phone slept).
- The 15 s clock that already exists keeps per-row labels ("starts in 5 min")
  fresh.

**Schedule form** (simplified):

1. **Client** — clients that have an open deal on one of the broker's
   exclusive listings (from `leadOptions`).
2. **Property** — that client's exclusive listings with an open deal. Auto-
   selected when there's exactly one.
3. **Length** — chips 30 min · 45 min · 1 hour. Required; nothing is
   preselected on a new visit. Start-time chips appear only after a length is
   chosen; submitting without one shows "Choose how long the visit is."
4. **Date** — next 14 days.
5. **Start time** — chips of free times from the server for that property,
   length and date. Re-fetched when length/date change. Empty state: "No free
   times this day — try another date."
6. **Notes** — optional.

The form validates the same rules client-side (length chosen, time chosen,
in the future, within the window). On a server conflict (409/400 with
`LEAD_TIME_CONFLICT` / `BROKER_TIME_CONFLICT`), show its message and refresh
the time chips.

**Reschedule** uses the same form with client and property locked, current
length preselected, and the visit's own time treated as free.

**Pipeline link.** On load, `schedule=1` opens the form; `leadId` (preferred)
or `clientId` + `propertyId` select the matching `leadOptions` entry. If none
matches (deal closed, not an exclusive listing, or not this broker's), open
the empty form with a short message: "This deal can't be booked here." Remove
the params from the URL once read so a refresh doesn't reopen it.

**Detail and actions** (per tab):

- Upcoming: Reschedule, Cancel
- Running / Needs update: Completed, Not attended, Reschedule, Cancel
- Completed / Not attended: switch to the other outcome
- Cancelled: view only
- Owner-listed visits: no Reschedule.

Show "Waiting for owner" on owner-listed visits with status `scheduled`.

**Filters.** Replace the full listings sheet (`VisitFiltersDialog` →
`OwnerListingsFilterSheet`) with a small Filters sheet: date range, client,
property. Tabs stay as the status control. Add a sort control (Soonest first ·
Latest first · Recently booked). Search box sends `search` after a short
debounce.

## Builder's calls

- Backfill and any fallback both use 30 minutes when a showing has no slot
  (the serializer's current 45-minute fallback is changed to match).
- The old page's booking call keeps working: the exclusive book DTO accepts the
  old `endAt` and derives `durationMinutes` from it when that is absent.
- Reschedule also re-checks that the deal is still open and the listing is
  still bookable.
- Exact file split, query-key names, debounce length.
- Copy wording, as long as it is plain and uses "Client".
- Layout of chips on a 360 px screen.

### Pipeline card (`features/pipeline/stage-blocks/visit-stage-block.tsx`)

- **Owner-listed deals (decided: hide).** Show "Schedule visit" and the
  reschedule pencil only when `deal.property.isExclusiveProperty` is true. On
  other Site visit cards, keep the booked date/time line (if any) with no
  scheduling action.
- **Booked visit → reschedule (decided).** The pencil keeps the same link
  (`scheduleVisitHref`, no pipeline change). Visits resolves it: when
  `leadId` has a scheduled/confirmed visit that has not been marked (upcoming,
  running or needs update), open the **reschedule** form for the earliest one;
  otherwise open the new-visit form prefilled. The lookup uses the bookings
  list with a `leadId` filter (add `leadId` to `GET /slots/broker/bookings`).
  So "Schedule visit" on a deal that already has a visit also lands on
  reschedule — one deal, one active visit, no accidental doubles.

## Open questions

None.
