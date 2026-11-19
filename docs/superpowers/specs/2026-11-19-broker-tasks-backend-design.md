# Broker Tasks — backend + frontend wiring

Date: 2026-11-19
Repos: `broker-backend` (NestJS + Prisma) and `broker-new-ui` (this repo)

## Intent

The broker Tasks screen (`/broker/tasks`, `features/tasks/`) is fully designed
but runs on a browser-only mock: tasks and lists live in `sessionStorage`
(`preview-store.ts`, `notebook-store.ts`) and link pickers use hard-coded
preview catalogs. The goal is a real backend whose schema and API support
everything the design already does, wired into the frontend so the screen
works against real data, then verified end to end.

## Goals

- Persist tasks and the notebook (tabs and lists) per user in PostgreSQL.
- Support every behaviour the UI has today: start/due date+time (IST),
  priority P1–P4 with `priorityAt`, reminders with delivered keys, repeat rules
  with server-side next-occurrence creation and reopen rollback, client/owner/
  property links, planner order and list placement, soft delete + restore,
  To do / Overdue / Completed / Deleted tabs.
- Replace mock catalogs with real link options (Clients, owners, properties the
  broker can actually use).
- Keep UI components essentially unchanged.

## Non-goals

- Server-side reminder delivery (push/scheduler). Reminders keep firing in the
  browser via `task-reminder-listener.tsx`; the server stores delivered keys.
- Sharing tasks across a team / org, assigning tasks to other members.
- Owner-portal tasks.
- Permanent (hard) delete UI.

## Anti-goals

- A bulk "replace all tasks" endpoint (rejected — see Approaches).
- Trusting client-sent ownership; links the caller cannot access must be
  rejected.
- Adding new runtime dependencies.

## Constraints

- Backend rules (`broker-backend/CLAUDE.md`): migration folder for every schema
  change, `ValidationPipe` whitelist (every DTO field decorated), throw
  `HttpException` subclasses, Swagger decorators, thin controllers.
- Frontend rules (`AGENTS.md`, `docs/STRUCTURE.md`): API calls in `lib/api/`,
  feature logic in `features/tasks/`, Tabler icons only.
- User instruction: no code comments in new/changed code; nothing committed.
- Times are IST wall-clock (`Asia/Kolkata`); dates are `YYYY-MM-DD` strings,
  times `HH:mm` strings, on the wire.

## Approaches considered

- **A. Per-task REST API + frontend diff adapter (chosen).** Clean REST
  resources and lifecycle action routes on the backend. `useTasks` keeps its
  `save(tasks)` / `update(updater)` signature but diffs before/after and issues
  only the per-task calls that changed. Small UI diff, clean validated API.
- **B. Bulk sync endpoint.** `PUT /tasks` with the whole array. Smallest
  frontend change, but heavy on cheap phones, last-write-wins across devices,
  weak validation. Rejected.
- **C. Per-task API with UI rewritten to call it directly.** Cleanest end
  state, touches ~10 large components for no extra backend capability.
  Rejected for review size.

User picked A, and picked "backend + wire the frontend" over backend-only.

## Data model (Prisma)

```prisma
enum TaskPriority { low medium high urgent }
enum TaskRepeatUnit { day week month year }

model Task {
  id                     String          @id @db.Uuid
  userId                 String          @map("user_id") @db.Uuid
  title                  String          @db.VarChar(160)
  details                String          @default("") @db.Text
  startDate              DateTime?       @map("start_date") @db.Date
  startTime              String?         @map("start_time") @db.VarChar(5)
  dueDate                DateTime?       @map("due_date") @db.Date
  dueTime                String?         @map("due_time") @db.VarChar(5)
  startReminderEnabledAt DateTime?       @map("start_reminder_enabled_at") @db.Timestamptz
  repeatUnit             TaskRepeatUnit? @map("repeat_unit")
  repeatInterval         Int?            @map("repeat_interval")
  repeatWeekdays         Int[]           @default([]) @map("repeat_weekdays")
  repeatUntil            DateTime?       @map("repeat_until") @db.Date
  repeatAnchor           DateTime?       @map("repeat_anchor") @db.Date
  repeatFromId           String?         @unique @map("repeat_from_id") @db.Uuid
  reminders              Int[]           @default([])
  deliveredReminderKeys  String[]        @default([]) @map("delivered_reminder_keys")
  priority               TaskPriority    @default(low)
  priorityAt             Int?            @map("priority_at")
  clientId               String?         @map("client_id") @db.Uuid
  ownerUserId            String?         @map("owner_user_id") @db.Uuid
  exclusiveOwnerId       String?         @map("exclusive_owner_id") @db.Uuid
  userEditedAt           DateTime        @default(now()) @map("user_edited_at") @db.Timestamptz
  propertyId             String?         @map("property_id") @db.Uuid
  listId                 String?         @map("list_id") @db.Uuid
  plannerOrder           Float?          @map("planner_order")
  completedAt            DateTime?       @map("completed_at") @db.Timestamptz
  deletedAt              DateTime?       @map("deleted_at") @db.Timestamptz
  createdAt              DateTime        @default(now()) @map("created_at") @db.Timestamptz
  updatedAt              DateTime        @updatedAt @map("updated_at") @db.Timestamptz

  user       User      @relation("TaskUser", fields: [userId], references: [id], onDelete: Cascade)
  client     Client?   @relation(fields: [clientId], references: [id], onDelete: SetNull)
  ownerUser  User?     @relation("TaskOwnerUser", fields: [ownerUserId], references: [id], onDelete: SetNull)
  exclusiveOwner ExclusiveOwner? @relation(fields: [exclusiveOwnerId], references: [id], onDelete: SetNull)
  property   Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  list       TaskList? @relation(fields: [listId], references: [id], onDelete: SetNull)
  repeatFrom Task?     @relation("TaskRepeat", fields: [repeatFromId], references: [id], onDelete: SetNull)
  successor  Task?     @relation("TaskRepeat")

  @@index([userId, deletedAt])
  @@map("tasks")
}

model TaskTab {
  id        String     @id @db.Uuid
  userId    String     @map("user_id") @db.Uuid
  name      String     @db.VarChar(80)
  position  Int
  lists     TaskList[]
  user      User       @relation(...)
  @@index([userId])
  @@map("task_tabs")
}

model TaskList {
  id        String  @id @db.Uuid
  userId    String  @map("user_id") @db.Uuid
  tabId     String  @map("tab_id") @db.Uuid
  name      String  @db.VarChar(80)
  position  Int
  isInbox   Boolean @default(false) @map("is_inbox")
  tab       TaskTab @relation(fields: [tabId], references: [id], onDelete: Cascade)
  tasks     Task[]
  user      User    @relation(...)
  @@index([userId])
  @@map("task_lists")
}
```

Notes:

- `id` has no default: the frontend generates UUIDs (`crypto.randomUUID()`),
  which keeps optimistic flows and the diff adapter simple. Server rejects a
  duplicate id with 409.
- Repeat is stored as columns (not JSON) so it is validated and queryable.
- `repeatFromId @unique` enforces at most one successor per occurrence.
- **Owner link supports both kinds (user decision).** `ownerUserId` →
  `users.id` of a platform owner (same id as `ownerUserId` in
  `lib/api/owners.ts`); `exclusiveOwnerId` → the broker's own
  `ExclusiveOwner` contact. At most one is set (service check + SQL `CHECK`
  constraint in the migration). On the wire this is `ownerId` +
  `ownerType: "platform" | "exclusive" | null`; frontend `Task` gains
  `ownerType`, and `link-options.owners` entries carry `type` so the picker and
  quick-add resolve the kind from the chosen id.
- `userEditedAt` (builder call): bumped only by user edits — create, PATCH of
  title/details/dates/times/repeat/reminders/priority/links, and planner moves
  that change `startDate` or `listId`. Not bumped by
  `reminders/delivered`, `deliveredReminderKeys`/`startReminderEnabledAt`
  writes, or `plannerOrder`-only renumbering. Reopen treats a successor as
  untouched when `userEditedAt == createdAt` and it is not completed/deleted.
  The wire `updatedAt` reports `userEditedAt` so the frontend's existing
  `updatedAt !== createdAt` check agrees with the server.
- Ownership is the **calling user** (`req.user.userId`), not
  `AccessContext.dataOwnerUserId`: tasks are private to the person.

## API (`/tasks`, `JwtAuthGuard`, broker role only)

Route gate (builder call): `JwtAuthGuard` + broker-role check, no
`ModuleAccessGuard` and no new `TEAM_MODULES` key — tasks are personal, and
team screens are deferred. Members' link scope follows their own visibility
(see Link checks), not the whole agency's.

Wire shape of a task = frontend `Task` type exactly (`repeat` as
`{ unit, interval, weekdays, until } | null`, dates as strings), plus read-only
`client`, `owner`, `property` summaries (`{ id, name }` / `{ id, title }` or
null).

| Method & path                         | Purpose                                                                                                                                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /tasks`                          | All of the caller's tasks, including completed and deleted (UI filters client-side; planner needs the full set).                                                                                                                  |
| `POST /tasks`                         | Create. Body = task fields incl. `id`.                                                                                                                                                                                            |
| `PATCH /tasks/:id`                    | Partial update of editable fields (title, details, dates/times, repeat, repeatAnchor, reminders, deliveredReminderKeys, startReminderEnabledAt, priority, priorityAt, links, listId, plannerOrder). Not completedAt/deletedAt.    |
| `PATCH /tasks`                        | Bulk partial update `{ items: [{ id, ...fields }] }` in one transaction (planner moves renumber a column).                                                                                                                        |
| `POST /tasks/:id/complete`            | Complete; if repeating and no successor, create next occurrence in the same transaction (port of `lifecycle.ts` + `recurrence.ts`, IST "today"). Body optional `{ nextId }`. Returns `{ tasks: Task[] }` (completed + successor). |
| `POST /tasks/:id/reopen`              | Reopen; delete an untouched successor; 409 with the frontend's message if the successor was changed/completed/deleted. Returns `{ tasks, removedIds }`.                                                                           |
| `DELETE /tasks/:id`                   | Soft delete (`deletedAt = now`).                                                                                                                                                                                                  |
| `POST /tasks/:id/restore`             | Clear `deletedAt`.                                                                                                                                                                                                                |
| `POST /tasks/:id/reminders/delivered` | `{ keys: string[] }` merged (union) into `deliveredReminderKeys`.                                                                                                                                                                 |
| `GET /tasks/notebook`                 | `{ tabs, lists, inboxListId }`; lazily creates "My lists" / "Someday" on first call.                                                                                                                                              |
| `PUT /tasks/notebook`                 | Replace tabs/lists names, order, tab membership and inbox atomically; upsert by id, delete missing (their tasks' `listId` → null, which the UI resolves to inbox). Enforces ≥1 tab, ≥1 list, inbox exists.                        |
| `GET /tasks/link-options`             | `{ clients, owners, properties }` the caller may link — shaped like the current preview catalogs so pickers and quick-add parsing work unchanged.                                                                                 |

Validation mirrors `features/tasks/model.ts` rules: title 1–160 trimmed,
details ≤ `MAX_CHARS.taskDetails`, date/time formats, due ≥ start, time needs
date, reminders need due date+time, ≤ `MAX_TASK_REMINDERS` distinct values in
`0..MAX_REMINDER_MINUTES`, repeat needs a date, weekly needs weekdays,
interval 1–365, until ≥ occurrence date. Cross-field rules run in the service
on the merged (existing + patch) task.

Link checks (on create/patch):

- `clientId` must satisfy `ClientAccessService` visibility for the caller.
- `propertyId` must be visible to the caller via `PropertyAccessService`
  (own inventory and represented listings, already member-scoped); not
  deleted.
- `ownerType: "platform"` → the owner user owns a property the caller can see
  that has an `accepted` representation for the caller's holder broker.
- `ownerType: "exclusive"` → the `ExclusiveOwner` belongs to the caller's
  holder (`brokerId = dataOwnerUserId`) and, for members, is the owner of a
  property visible to them.
  Violations → 400 "Choose an existing Client, owner or property."
  `link-options` is built from the same predicates.

Lost access (builder call): links are only checked when they change. A link
whose access later ends is kept, with its name/title summary (never contact
details), so unrelated edits are not blocked.

## Frontend wiring

- `lib/api/tasks.ts`: typed API functions for the routes above.
- `features/tasks/preview-store.ts` → real store (`task-store.ts`): `useTasks`
  keeps `{ tasks, isLoading, error, save, update, busy }`. `save`/`update`
  compute the next array locally (existing pure helpers), diff by id and send:
    - `completedAt` toggled → `complete` / `reopen` (successor creation or
      removal in the same diff is skipped — server owns it).
    - `deletedAt` toggled → `DELETE` / `restore`.
    - new id → `POST`; other changed fields → `PATCH` (one task) or bulk `PATCH`.
    - Query data is then set from server responses.
- `notebook-store.ts`: `GET`/`PUT /tasks/notebook`.
- `TASK_CLIENTS` / `TASK_OWNERS` / `TASK_PROPERTIES` constants → a
  `useTaskCatalogs()` hook over `GET /tasks/link-options`, used by
  `tasks-page`, `task-form`, `task-detail`, `dashboard-tasks-card`.
- Mock mode (`isMockMode()`) keeps the existing preview store so design mode
  still works.
- "Reset task list" on load error becomes "Try again" (refetch); a server
  load failure is not corrupt local storage.

## Testing

- Backend unit specs in repo style (hand-rolled Prisma mocks): recurrence date
  math, complete/reopen lifecycle, validation, link checks.
- Backend e2e (`test/tasks.e2e-spec.ts`, supertest + real dev DB): seeded
  broker logs in, full CRUD, complete repeating → successor, reopen rollback,
  reopen conflict, delete/restore, reminders delivered, notebook PUT, link
  rejection, cross-user isolation.
- Browser e2e at `http://localhost:3000/broker/tasks` with a throwaway
  Playwright script run via `npx` from the scratchpad (no new repo
  dependency): create, edit, complete, delete/restore, move in planner, lists,
  reload persists.
- `npm run lint:check` (touched files), `npm test`, `npm run build` in backend;
  `npm test`, typecheck/lint in frontend.

Adapter details (builder calls): a diff where `deletedAt` or `completedAt`
toggles calls the action route first, then PATCHes any other changed fields;
the reminder listener's change goes to `reminders/delivered` (plus PATCH of
`startReminderEnabledAt` if it changed). The default notebook fallback while
loading keeps its non-UUID ids only for rendering; nothing is written with
them.

## Left to the builder

- Exact DTO class layout and Swagger annotations.
- Field list of `link-options.properties` beyond what the pickers read.
- Migration folder name/timestamp.
