# Broker Tasks Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist broker tasks and task lists in `broker-backend` with an API that supports every behaviour of `/broker/tasks`, and wire the frontend to it.

**Architecture:** New Nest `TaskModule` (`src/task/`) with pure rule functions (validation, IST dates, recurrence), a link-access service built on the existing Client/Property/Representation access services, a task service and a notebook service. Frontend keeps the `useTasks` / `useTaskNotebook` hook signatures; a pure diff function turns "before/after task arrays" into API calls.

**Tech Stack:** NestJS 11, Prisma 7 (PostgreSQL), class-validator, Jest + supertest; Next.js, React Query, axios `apiFetch`, `node:test` via `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-broker-tasks-backend-design.md`

## Global Constraints

- **No code comments** in any new or changed code (user instruction).
- **Do not commit or push** in either repo. Leave every change uncommitted for the user to review.
- Backend root: `D:\Projects\Geek Products\broker-crm\broker-backend`. Frontend root: `D:\Projects\Geek Products\broker-crm\broker-new-ui`.
- No new dependencies in either `package.json`. Playwright is used only via `npx` from the scratchpad.
- Every schema change ships a migration folder under `prisma/migrations/`; never edit existing migrations; never `db push` alone; never `migrate reset`.
- Wire formats: dates `YYYY-MM-DD`, times `HH:mm`, timezone `Asia/Kolkata`, timestamps ISO-8601.
- Limits (copy from frontend): title 1–160 chars trimmed; details ≤ 1000 chars; ≤ 5 distinct reminders each an integer in `0..525600`; repeat interval 1–365; notebook names 1–80 chars trimmed.
- Link-rejection message: `Choose an existing Client, owner or property.`
- Reopen-conflict message: `The next occurrence has already been changed. Keep this occurrence completed and work on the next task.`
- Tasks belong to `req.user.userId` (not the data owner). Routes use `JwtAuthGuard` + broker-role check; no `ModuleAccessGuard`, no new `TEAM_MODULES` key.
- Backend: Prettier style (single quotes, trailing commas, 80 cols), Swagger decorators on every route, throw `HttpException` subclasses only.
- Frontend: API code in `lib/api/`, feature logic in `features/tasks/`, Tabler icons via `@/components/shared/icons`, tests in `lib/tasks/*.test.ts`.

## Review Focus

1. **Two-tab race on complete:** completing an already-completed task (stale tab) must be a no-op returning current state, not create a second successor (`repeatFromId @unique` + check) — test in Task 4.
2. **Patch that breaks a cross-field rule only after merge:** e.g. PATCH `dueDate` earlier than existing `startDate`, or remove `dueTime` while reminders exist → 400 — test in Task 4.
3. **Another user's task id:** every `/tasks/:id` route returns 404 for a task owned by someone else (never 403 or success) — test in Task 6.
4. **Notebook PUT deleting the list a task sits in:** task's `listId` becomes null, task survives — test in Task 5.
5. **Frontend diff on reopen of a repeating task:** the locally-removed successor must not be sent as a DELETE; server reports `removedIds` — test in Task 7.

---

### Task 1: Schema and migration

**Files:**

- Modify: `broker-backend/prisma/schema.prisma`
- Create: `broker-backend/prisma/migrations/20261119120000_tasks/migration.sql`

**Interfaces:**

- Produces: Prisma models `Task`, `TaskTab`, `TaskList`; enums `TaskPriority { low medium high urgent }`, `TaskRepeatUnit { day week month year }`; back-relations on `User` (`tasks` "TaskUser", `ownerTasks` "TaskOwnerUser", `taskTabs`, `taskLists`), `Client.tasks`, `Property.tasks`, `ExclusiveOwner.tasks`.

- [ ] **Step 1:** Add the models exactly as in the spec's Data model section (including `exclusiveOwnerId` and `userEditedAt`). `TaskTab`/`TaskList` `user` relations use `onDelete: Cascade`. Add `@@index([userId, deletedAt])` on Task, `@@index([userId])` on TaskTab/TaskList.
- [ ] **Step 2:** Generate SQL: copy the current schema from git (`git show HEAD:prisma/schema.prisma > <scratchpad>/old.prisma`), run `npx prisma migrate diff --from-schema <scratchpad>/old.prisma --to-schema prisma/schema.prisma --script > prisma/migrations/20261119120000_tasks/migration.sql`. Append:
    ```sql
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_single_owner_link" CHECK ("owner_user_id" IS NULL OR "exclusive_owner_id" IS NULL);
    ```
    Review that the SQL only creates the two enums, three tables, indexes and FKs.
- [ ] **Step 3:** Apply: `npx prisma migrate deploy` then `npx prisma generate`. Expected: "1 migration applied"; `generated/prisma` contains `Task`.
- [ ] **Step 4:** `npm run build`. Expected: exit 0.

---

### Task 2: Pure task rules (validation, IST dates, recurrence)

**Files:**

- Create: `broker-backend/src/task/task-rules.ts`
- Test: `broker-backend/src/task/task-rules.spec.ts`

**Interfaces:**

- Produces:
    ```ts
    export type TaskRepeat = {
        unit: "day" | "week" | "month" | "year";
        interval: number;
        weekdays: number[];
        until: string | null;
    };
    export type TaskSchedule = {
        startDate: string | null;
        startTime: string | null;
        dueDate: string | null;
        dueTime: string | null;
        reminders: number[];
        repeat: TaskRepeat | null;
        title: string;
        details: string;
    };
    export const TASK_LIMITS: { title: 160; details: 1000; reminders: 5; reminderMinutes: 525600; repeatInterval: 365 };
    export function isTaskDate(value: string): boolean;
    export function isTaskTime(value: string): boolean;
    export function istDateKey(at: Date): string;
    export function taskScheduleError(task: TaskSchedule): string | null;
    export function nextRepeatDate(anchor: string, after: string, rule: TaskRepeat): string | null;
    export function shiftTaskDate(date: string, days: number): string | null;
    export function nextTaskDates(
        task: {
            startDate: string | null;
            dueDate: string | null;
            repeat: TaskRepeat | null;
            repeatAnchor: string | null;
        },
        now: Date,
    ): { startDate: string | null; dueDate: string | null; repeatAnchor: string } | null;
    ```
- `nextRepeatDate`, `shiftTaskDate`, `nextTaskDates` are straight ports of `broker-new-ui/features/tasks/recurrence.ts` and `lifecycle.ts#nextTaskDates`. `taskScheduleError` returns the first violated rule from `features/tasks/model.ts` `taskSchema` refinements plus limits (messages copied from that file / `validateTaskDraft`).

- [ ] **Step 1: Write failing tests** in `task-rules.spec.ts`:
    ```ts
    it("rolls month repeats to month end and back", () => {
        const rule = { unit: "month", interval: 1, weekdays: [], until: null } as const;
        expect(nextRepeatDate("2026-01-31", "2026-01-31", rule)).toBe("2026-02-28");
        expect(nextRepeatDate("2026-01-31", "2026-02-28", rule)).toBe("2026-03-31");
    });
    it("weekly picks the next listed weekday", () => {
        expect(
            nextRepeatDate("2026-11-16", "2026-11-16", { unit: "week", interval: 1, weekdays: [1, 3], until: null }),
        ).toBe("2026-11-18");
    });
    it("stops after until", () => {
        expect(
            nextRepeatDate("2026-11-16", "2026-11-16", { unit: "day", interval: 1, weekdays: [], until: "2026-11-16" }),
        ).toBeNull();
    });
    it("istDateKey uses Asia/Kolkata", () => {
        expect(istDateKey(new Date("2026-11-18T19:00:00Z"))).toBe("2026-11-19");
    });
    it("nextTaskDates shifts start with due and keeps anchor", () => {
        expect(
            nextTaskDates(
                {
                    startDate: "2026-11-17",
                    dueDate: "2026-11-18",
                    repeat: { unit: "day", interval: 2, weekdays: [], until: null },
                    repeatAnchor: null,
                },
                new Date("2026-11-18T06:00:00Z"),
            ),
        ).toEqual({ startDate: "2026-11-19", dueDate: "2026-11-20", repeatAnchor: "2026-11-18" });
    });
    it.each([
        [{ dueTime: "10:00", dueDate: null }, "A time needs a due date."],
        [{ startDate: "2026-11-20", dueDate: "2026-11-19" }, "Due date must be on or after start date."],
        [{ reminders: [15], dueDate: "2026-11-20", dueTime: null }, "A reminder needs a due date and time."],
        [{ reminders: [15, 15], dueDate: "2026-11-20", dueTime: "10:00" }, "Choose each reminder only once."],
        [
            { repeat: { unit: "week", interval: 1, weekdays: [], until: null }, startDate: "2026-11-20" },
            "Choose at least one weekday for a weekly repeat.",
        ],
        [{ title: "   " }, "Give your task a name."],
    ])("rejects %o", (patch, message) => {
        expect(taskScheduleError({ ...BASE, ...patch })).toBe(message);
    });
    it("accepts a valid task", () => expect(taskScheduleError(BASE)).toBeNull());
    ```
    `BASE` = `{ title: 'Call', details: '', startDate: '2026-11-19', startTime: '09:00', dueDate: null, dueTime: null, reminders: [], repeat: null }`.
- [ ] **Step 2:** `npx jest src/task/task-rules.spec.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement `task-rules.ts`. `istDateKey` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })`.
- [ ] **Step 4:** `npx jest src/task/task-rules.spec.ts` → PASS.

---

### Task 3: Link access service and link options

**Files:**

- Create: `broker-backend/src/task/task-link.service.ts`
- Test: `broker-backend/src/task/task-link.service.spec.ts`

**Interfaces:**

- Consumes: `ClientAccessService.resolve(userId) → { listWhere, holderUserId }` (from `ClientModule`), `PropertyAccessService.resolve(userId) → { where, holderUserId, branchMemberIds, isAccountHolder }` (from `PropertySaleModule`), `RepresentationAccessService.resolve(userId) → { where, agencyBrokerId }` (from `RepresentativeModule`).
- Produces:
    ```ts
    export type TaskLinks = {
        clientId?: string | null;
        propertyId?: string | null;
        ownerId?: string | null;
        ownerType?: "platform" | "exclusive" | null;
    };
    export type TaskLinkOptions = {
        clients: { id: string; name: string; type: string; requirement: string; phoneDigits: string }[];
        owners: { id: string; name: string; type: "platform" | "exclusive" }[];
        properties: {
            id: string;
            title: string;
            locality: string;
            city: string;
            address: string;
            configLabel: string;
            imageUrl?: string;
        }[];
    };
    class TaskLinkService {
        linkOptions(userId: string): Promise<TaskLinkOptions>;
        assertLinks(userId: string, links: TaskLinks): Promise<void>;
    }
    ```
- Visible properties = `property.where` (held, member-scoped) OR `id in` propertyIds of `propertyRepresentation` matching `AND[rep.where, { status: 'accepted', brokerId: rep.agencyBrokerId }]`. Platform owners = distinct `users` owning (via `Owner.userId`) those represented properties. Exclusive owners = `exclusiveOwner` with `brokerId = holderUserId`; for a non-account-holder, also `properties: { some: property.where }`.
- `assertLinks` checks only keys present and non-null; throws `BadRequestException('Choose an existing Client, owner or property.')`. `ownerId` without valid `ownerType` → same 400.
- Client `type` = capitalised `clientType` or `'Client'`; `requirement` = `[bhk ? `${bhk} BHK` : '', preferredLocalities[0]].filter(Boolean).join(' in ')`; `phoneDigits` = phone digits only. Property `configLabel` = `[bhkConfig label, subtype label].join(' ')`, `locality` = `address ?? ''`, `imageUrl` = `photos[0]`.

- [ ] **Step 1: Write failing tests** (hand-rolled Prisma mocks, style of `src/slot/*.spec.ts`):
    - `assertLinks accepts a client inside listWhere` — `prisma.client.count` resolves 1 → resolves.
    - `assertLinks rejects a client outside listWhere` — count 0 → rejects with message above; assert `count` was called with `where: { AND: [listWhere, { id }] }`.
    - `assertLinks rejects ownerId with ownerType null`.
    - `assertLinks rejects an exclusive owner held by another broker` — `exclusiveOwner.count` 0.
    - `assertLinks skips undefined keys` — no prisma calls when `{}`.
    - `linkOptions maps a client to the picker shape` — `{ clientType: 'buyer', bhk: 3, preferredLocalities: ['Vesu'], phone: '+91 98765 43210' }` → `{ type: 'Buyer', requirement: '3 BHK in Vesu', phoneDigits: '919876543210' }`.
- [ ] **Step 2:** `npx jest src/task/task-link.service.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Re-run → PASS.

---

### Task 4: Task service, DTOs, controller, module

**Files:**

- Create: `broker-backend/src/task/task.service.ts`, `task.controller.ts`, `task.module.ts`, `task.mapper.ts`, `dto/task-fields.dto.ts`, `dto/create-task.dto.ts`, `dto/update-task.dto.ts`, `dto/bulk-update-tasks.dto.ts`, `dto/complete-task.dto.ts`, `dto/reminders-delivered.dto.ts`
- Modify: `broker-backend/src/app.module.ts` (import `TaskModule`)
- Test: `broker-backend/src/task/task.service.spec.ts`

**Interfaces:**

- Consumes: Task 2 functions; `TaskLinkService.assertLinks`.
- Produces (wire type, returned by every task route):
    ```ts
    export type TaskView = {
        id: string;
        title: string;
        details: string;
        startDate: string | null;
        startTime: string | null;
        startReminderEnabledAt?: string;
        repeat: TaskRepeat | null;
        repeatAnchor: string | null;
        repeatFromId: string | null;
        dueDate: string | null;
        dueTime: string | null;
        reminders: number[];
        clientId: string | null;
        ownerId: string | null;
        ownerType: "platform" | "exclusive" | null;
        propertyId: string | null;
        client: { id: string; name: string } | null;
        owner: { id: string; name: string } | null;
        property: { id: string; title: string } | null;
        completedAt: string | null;
        deletedAt: string | null;
        plannerOrder?: number;
        listId: string | null;
        createdAt: string;
        updatedAt: string;
        priority: "low" | "medium" | "high" | "urgent";
        priorityAt: number | null;
        deliveredReminderKeys: string[];
    };
    ```
    `updatedAt` = `userEditedAt.toISOString()`. `plannerOrder` and `startReminderEnabledAt` omitted when null.
- Service methods (all take `userId` first):
  `list(): TaskView[]` (order `createdAt asc`), `create(dto): TaskView`, `update(id, dto): TaskView`, `bulkUpdate(items): TaskView[]`, `complete(id, nextId?): { tasks: TaskView[] }`, `reopen(id): { tasks: TaskView[]; removedIds: string[] }`, `remove(id): TaskView`, `restore(id): TaskView`, `markDelivered(id, keys): TaskView`.
- Routes (`@Controller('tasks')`, `@UseGuards(JwtAuthGuard)`, broker check: `req.user.role !== 'broker'` → `ForbiddenException`): `GET /tasks`, `POST /tasks`, `PATCH /tasks` (body `{ items: ({ id } & UpdateTaskDto)[] }`, 1–200 items), `PATCH /tasks/:id`, `DELETE /tasks/:id`, `POST /tasks/:id/complete` (body `{ nextId?: uuid }`), `POST /tasks/:id/reopen`, `POST /tasks/:id/restore`, `POST /tasks/:id/reminders/delivered` (body `{ keys: string[] }`, 1–50 non-empty). Static routes (`notebook`, `link-options`) are declared before `:id` routes. All `:id` use `ParseUUIDPipe`.
- DTO fields (`UpdateTaskDto` all optional; `CreateTaskDto` adds required `id: uuid`, `title`): `title`, `details`, `startDate`, `startTime`, `dueDate`, `dueTime` (nullable strings matching `^\d{4}-\d{2}-\d{2}$` / `^([01]\d|2[0-3]):[0-5]\d$`), `repeat` (nested `RepeatDto` or null), `repeatAnchor`, `reminders: int[]`, `deliveredReminderKeys: string[]`, `startReminderEnabledAt: ISO|null`, `priority` enum, `priorityAt: int ≥0|null`, `clientId`, `propertyId`, `ownerId` (uuid|null), `ownerType` (`platform|exclusive|null`), `listId` (uuid|null), `plannerOrder` (finite number|null). Nullable fields use `@ValidateIf((_, v) => v !== null)`.
- Rules:
    - Not-found and other user's task → `NotFoundException('Task not found')`.
    - `update` merges dto onto stored task, runs `taskScheduleError`; error → `BadRequestException(message)`. Links checked only for keys whose value differs from stored. `listId` must belong to the user (else 400 `List not found`). Bumps `userEditedAt` unless the changed keys ⊆ {`deliveredReminderKeys`, `startReminderEnabledAt`, `plannerOrder`}.
    - Deleted tasks: `update` → 409 `Restore this task before changing it.`
    - `create` duplicate id → `ConflictException('A task with this id already exists.')`. `userEditedAt = createdAt`.
    - `complete`: if already completed → return current task (+ existing successor) unchanged. Else in `$transaction`: set `completedAt`; if `nextTaskDates` non-null and no row has `repeatFromId = id`, create successor copying fields, `id = nextId ?? randomUUID()`, `repeatFromId = id`, `deliveredReminderKeys = []`, `completedAt = null`, `createdAt = userEditedAt = now`.
    - `reopen`: not completed → return as-is. Successor exists and (`completedAt` or `deletedAt` or `userEditedAt > createdAt`) → `ConflictException(<reopen-conflict message>)`. Else delete successor, clear `completedAt`, return `removedIds`.
    - `remove` sets `deletedAt`; `restore` clears it. Both no-op if already in that state.
    - `markDelivered` unions keys, does not bump `userEditedAt`.
    - `bulkUpdate` runs every item's update inside one `$transaction`; any failure rolls back all.

- [ ] **Step 1: Write failing tests** in `task.service.spec.ts` (mock `prisma.task.*`, `prisma.$transaction` invoking its callback with the same mock, mock `TaskLinkService`):
    - `create stores userEditedAt equal to createdAt and returns updatedAt == createdAt`.
    - `update rejects dueDate before existing startDate` → 400 `Due date must be on or after start date.`
    - `update rejects clearing dueTime while reminders exist` → 400 `A reminder needs a due date and time.`
    - `update does not re-check an unchanged clientId` — `assertLinks` called with `{}`.
    - `update with only plannerOrder keeps userEditedAt`.
    - `update of another user's task → 404` (findFirst returns null for `{ id, userId }`).
    - `complete on a daily repeating task creates one successor with repeatFromId and nextId`.
    - `complete on an already completed task creates nothing` (Review Focus 1).
    - `reopen removes an untouched successor and returns removedIds`.
    - `reopen with an edited successor throws the reopen-conflict message`.
    - `markDelivered unions keys and keeps userEditedAt`.
- [ ] **Step 2:** `npx jest src/task/task.service.spec.ts` → FAIL.
- [ ] **Step 3:** Implement mapper, DTOs, service, controller, module (`imports: [ClientModule, PropertySaleModule, RepresentativeModule]`, providers `TaskService`, `TaskLinkService`, `TaskNotebookService` placeholder added in Task 5). Add `TaskModule` to `AppModule`.
- [ ] **Step 4:** `npx jest src/task` → PASS; `npm run build` → exit 0.

---

### Task 5: Notebook service and routes

**Files:**

- Create: `broker-backend/src/task/task-notebook.service.ts`, `dto/notebook.dto.ts`
- Modify: `broker-backend/src/task/task.controller.ts`, `task.module.ts`, `task.service.ts` (link-options route lives in controller; calls `TaskLinkService.linkOptions`)
- Test: `broker-backend/src/task/task-notebook.service.spec.ts`

**Interfaces:**

- Produces:
    ```ts
    export type TaskNotebookView = {
        tabs: { id: string; name: string }[];
        lists: { id: string; tabId: string; name: string }[];
        inboxListId: string;
    };
    class TaskNotebookService {
        get(userId): Promise<TaskNotebookView>;
        replace(userId, dto: TaskNotebookView): Promise<TaskNotebookView>;
    }
    ```
- Routes: `GET /tasks/notebook`, `PUT /tasks/notebook`, `GET /tasks/link-options` (returns `TaskLinkOptions`).
- `get` with no tabs creates tab "My lists" and inbox list "Someday" (`isInbox: true`) in a transaction. Order by `position`.
- `replace` validates: ids are UUIDs and unique, names 1–80 trimmed, ≥1 tab, ≥1 list, every list's tabId in tabs, inboxListId in lists, every id either new or already the user's (else 400 `List not found`). Transaction: delete user's lists/tabs not in payload (FK `SetNull` clears task `listId`), upsert tabs/lists with `position` = array index, set `isInbox` only on `inboxListId`.

- [ ] **Step 1: Write failing tests:**
    - `get creates My lists / Someday on first call`.
    - `replace rejects a list whose tab is missing` → 400.
    - `replace rejects an id owned by another user` → 400 `List not found`.
    - `replace deletes lists missing from the payload` — asserts `taskList.deleteMany` called with `{ userId, id: { notIn: [...] } }` (Review Focus 4; e2e confirms the task's `listId` becomes null).
    - `replace writes positions in payload order and one inbox`.
- [ ] **Step 2:** `npx jest src/task/task-notebook.service.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx jest src/task` → PASS; `npm test` → PASS; `npm run build` → exit 0; `npx eslint src/task` → no errors in new files.

---

### Task 6: Backend e2e

**Files:**

- Create: `broker-backend/test/tasks.e2e-spec.ts`

**Interfaces:**

- Consumes: all routes above; real `AppModule` + dev DB from `.env`; `ValidationPipe` configured as in `src/main.ts` (`whitelist`, `forbidNonWhitelisted`, `transform`).

- [ ] **Step 1: Write the spec.** `beforeAll`: create two broker users directly via `PrismaService` (`users` + `brokers` rows, emails `tasks-e2e-<random>@example.test`), mint access tokens with `JwtService.sign({ sub, email, role })` matching the JWT strategy's payload; create one `Client` for broker A and one for broker B. `afterAll`: delete created tasks, task lists/tabs, clients, brokers, users. Tests:
    - create → list contains it with `updatedAt === createdAt`.
    - PATCH title + priority → returned; PATCH `dueDate` before `startDate` → 400.
    - link broker A's client → 200 with `client.name`; link broker B's client → 400 with the link message.
    - complete a daily repeating task → `tasks.length === 2`, successor `repeatFromId` equals id; complete again → still one successor.
    - reopen → `removedIds` contains successor id; GET no longer has it.
    - complete, PATCH successor title, reopen → 409 with the reopen-conflict message.
    - DELETE → `deletedAt` set; PATCH while deleted → 409; restore → `deletedAt` null.
    - reminders/delivered twice with overlapping keys → union, `updatedAt` unchanged.
    - bulk PATCH two `plannerOrder`s → both updated; bulk with one invalid item → 400 and neither changed.
    - notebook GET creates defaults; PUT adds a list; task moved into it via PATCH `listId`; PUT without that list → task `listId` null.
    - broker B: GET `/tasks` excludes A's tasks; PATCH / DELETE / complete on A's task id → 404 (Review Focus 3).
    - unknown body field → 400.
    - `GET /tasks/link-options` for A includes A's client, not B's.
- [ ] **Step 2:** `npm run test:e2e -- tasks` → all PASS. Fix code (not tests) on failure, re-run.

---

### Task 7: Frontend API module and diff function

**Files:**

- Create: `broker-new-ui/lib/api/tasks.ts`, `broker-new-ui/features/tasks/task-sync.ts`
- Modify: `broker-new-ui/features/tasks/model.ts` (add `ownerType: z.enum(["platform","exclusive"]).nullable().optional()` to `taskSchema`)
- Test: `broker-new-ui/lib/tasks/task-sync.test.ts`

**Interfaces:**

- Produces in `lib/api/tasks.ts` (`apiFetch`, JSON body):
    ```ts
    export type TaskLinkOptions = /* same shape as backend Task 3 */;
    export type TaskNotebookDto = { tabs: {id,name}[]; lists: {id,tabId,name}[]; inboxListId: string };
    export const tasksApi: {
      list(): Promise<Task[]>; create(task: TaskWrite & { id: string }): Promise<Task>;
      update(id: string, patch: TaskWrite): Promise<Task>; bulkUpdate(items: (TaskWrite & { id: string })[]): Promise<Task[]>;
      complete(id: string, nextId?: string): Promise<{ tasks: Task[] }>; reopen(id: string): Promise<{ tasks: Task[]; removedIds: string[] }>;
      remove(id: string): Promise<Task>; restore(id: string): Promise<Task>; delivered(id: string, keys: string[]): Promise<Task>;
      notebook(): Promise<TaskNotebookDto>; replaceNotebook(n: TaskNotebookDto): Promise<TaskNotebookDto>; linkOptions(): Promise<TaskLinkOptions>;
    };
    ```
    `TaskWrite` = `Partial<Pick<Task, editable fields listed in backend Task 4 DTO>>`. Responses are parsed with `taskSchema` after dropping `client/owner/property` summaries.
- Produces in `task-sync.ts`:
    ```ts
    export type TaskOp =
        | { kind: "create"; task: Task }
        | { kind: "complete"; id: string; nextId?: string }
        | { kind: "reopen"; id: string }
        | { kind: "remove"; id: string }
        | { kind: "restore"; id: string }
        | { kind: "delivered"; id: string; keys: string[] }
        | { kind: "patch"; items: ({ id: string } & TaskWrite)[] };
    export function diffTasks(before: Task[], after: Task[]): TaskOp[];
    export async function applyTaskOps(ops: TaskOp[], current: Task[]): Promise<Task[]>;
    ```
- `diffTasks` rules: new id whose `repeatFromId` points at a task that is newly completed in this diff → folded into that `complete` as `nextId`, not a create. Removed id whose `repeatFromId` points at a task being reopened → skipped. Lifecycle ops (`complete`/`reopen`/`remove`/`restore`) come first. New entries in `deliveredReminderKeys` (and no other change except optionally `startReminderEnabledAt`) → `delivered` op (+ patch for `startReminderEnabledAt` if changed). Remaining field changes (excluding `completedAt`, `deletedAt`, `updatedAt`, `createdAt`, `deliveredReminderKeys` additions) → one `patch` op carrying only changed keys for all tasks. Other removed ids → `remove`.
- `applyTaskOps` runs ops in order, calls `tasksApi`, merges results into `current` (replace by id, drop `removedIds`) and returns the new array.

- [ ] **Step 1: Write failing tests** in `lib/tasks/task-sync.test.ts` using `setTaskCompleted`, `setTaskDeleted`, `movePlannerTask` on `sampleTasks(now)`:
    - `completing a repeating task yields one complete op with nextId and no create`.
    - `reopening a repeating task yields one reopen op and no remove` (Review Focus 5).
    - `deleting yields remove; restoring yields restore plus a patch for deliveredReminderKeys only if other fields changed`.
    - `a planner move yields a single patch op containing every renumbered task with only plannerOrder/startDate/listId keys`.
    - `a reminder delivery yields one delivered op with only the new keys`.
    - `a brand-new task yields create`.
    - `no change yields []`.
- [ ] **Step 2:** `npx tsx --test lib/tasks/task-sync.test.ts` → FAIL.
- [ ] **Step 3:** Implement `lib/api/tasks.ts` and `features/tasks/task-sync.ts`.
- [ ] **Step 4:** Re-run → PASS; `npm test` → PASS (existing task tests unaffected by `ownerType`).

---

### Task 8: Wire stores, catalogs and the page

**Files:**

- Create: `broker-new-ui/features/tasks/task-store.ts`, `broker-new-ui/features/tasks/task-catalogs.ts`
- Modify: `features/tasks/notebook-store.ts`, `tasks-page.tsx`, `task-form.tsx`, `task-detail.tsx`, `dashboard-tasks-card.tsx`, `task-reminder-listener.tsx`, `quick-add-composer.tsx` (only if it imports catalogs), `preview-store.ts` (keep for mock mode; stop exporting `useTasks`)

**Interfaces:**

- Consumes: Task 7 `tasksApi`, `diffTasks`, `applyTaskOps`.
- Produces:
    ```ts
    export function useTasks(accountId: string): {
        tasks: Task[];
        isLoading: boolean;
        error: Error | null;
        save(next: Task[]): Promise<void>;
        update(fn: TaskUpdater): Promise<void>;
        refetch(): Promise<unknown>;
        busy: boolean;
    };
    export type TaskCatalogs = TaskLinkOptions;
    export function useTaskCatalogs(): TaskCatalogs;
    ```
- `task-store.ts`: when `isMockMode()`, delegate to `taskPreviewStore` exactly as today. Otherwise query key `["tasks", accountId]` → `tasksApi.list()`; mutation computes `after = updater(current)` (or `next`), `ops = diffTasks(current, after)`, `applyTaskOps(ops, current)`, then `setQueryData`; on error, invalidate the query and rethrow. Mutations serialised via a shared `mutationKey` (as today).
- `useTaskCatalogs`: mock mode → `{ clients: TASK_CLIENTS, owners: TASK_OWNERS.map(o => ({ ...o, type: "platform" })), properties: TASK_PROPERTIES }`; else `useQuery(["task-link-options"], tasksApi.linkOptions, { staleTime: 60_000 })`, default empty arrays.
- Replace every `TASK_CLIENTS` / `TASK_OWNERS` / `TASK_PROPERTIES` read in the listed components with `useTaskCatalogs()` values. Where a task is saved with an `ownerId`, set `ownerType` from `catalogs.owners.find(o => o.id === ownerId)?.type ?? null` (in `tasks-page.tsx#saveDraft` and the quick-add path that sets `ownerId`).
- `notebook-store.ts`: mock mode keeps `notebookPreviewStore`; else query `tasksApi.notebook()`, mutation `replaceNotebook(updater(current))`.
- `tasks-page.tsx` load-error block: button label `Try again`, calls `refetch()`; copy `Your tasks couldn’t be loaded. Check your connection and try again.` Remove `reset` usage.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** `npx tsc --noEmit` → no errors; `npm run lint` (or project lint script) on touched files → clean; `npm test` → PASS.
- [ ] **Step 3:** `grep -rn "TASK_CLIENTS\|TASK_OWNERS\|TASK_PROPERTIES" features app --include=*.tsx` → only `task-catalogs.ts` / `preview-store.ts`.

---

### Task 9: Browser end-to-end

**Files:**

- Create (scratchpad only, not in either repo): `<scratchpad>/tasks-e2e/run.mjs`

**Interfaces:**

- Consumes: backend running (`npm run start:dev` or existing docker container) reachable at the frontend's `NEXT_PUBLIC_API_URL`; frontend `npm run dev` on `http://localhost:3000`; a seeded broker account (from `prisma/seed-accounts.ts`) with `USE_MOCK_DATA` off.

- [ ] **Step 1:** Write `run.mjs` with `playwright` (via `npx -y playwright@1.65.1` install of chromium) that: logs in as the seeded broker; opens `/broker/tasks`; quick-adds `E2E call Aarav tomorrow p2`; asserts the row appears; reloads and asserts it persists; opens it, edits the title, saves, asserts; completes it, switches to Completed tab, asserts present; reopens; deletes, checks Deleted tab, restores; creates a list in the planner notebook, reloads, asserts the list persists; screenshots each stage into `<scratchpad>/tasks-e2e/`.
- [ ] **Step 2:** Run it. Expected: all assertions pass; also verify via `GET /tasks` (curl with the same token) that the task exists server-side.
- [ ] **Step 3:** Remove test data created by the run (DELETE then leave soft-deleted, or delete rows via Prisma script in scratchpad).
- [ ] **Step 4:** Final verification: backend `npm test`, `npm run test:e2e -- tasks`, `npm run build`, `npx eslint src/task test/tasks.e2e-spec.ts`; frontend `npm test`, `npx tsc --noEmit`. Report results and the list of modified files in both repos. Do not commit.
