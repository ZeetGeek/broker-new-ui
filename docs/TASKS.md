# Broker tasks preview

`/broker/tasks` is the broker's private task workspace. It uses browser-local
sample data; it does not read or write tasks through the API. Changes survive a
refresh in the same tab and are isolated by the signed-in account ID. This is
session storage, not a durable or cross-device task service.

## Behavior

- Create a task with just a name. Its start date defaults to today in India;
  add notes, Low/Normal/High/Urgent priority, a due date/time, repeat rules,
  reminders, and optional Client/owner/property links. The links use sample CRM
  records; expanding their summary does not edit those records.
- View, edit, complete, reopen, reschedule, change a reminder, or delete a task.
  Deletion asks for confirmation, and closing a changed form offers to keep
  editing or discard the draft.
- All tasks shows open tasks; Today and Upcoming narrow the open list. Completed
  has its own tab. Search covers task text and linked Client/owner/property text.
  The Filters panel supplies due-date and linked-record filters, with clearable
  filter chips. Filters intersect the selected tab.
- The default order groups tasks as Overdue, Today, Upcoming, and No due date.
  Completed defaults to latest completion first. Newest, Priority, and Task name
  sorts produce a single ordered list. Due filters always use the original due
  date, including on completed tasks.
- Loading, empty results, missing task links, unavailable storage, and damaged
  saved records have explicit states. A damaged workspace can reset its sample
  tasks; failed saves retain the working data and show an error.

The **My tasks** card at `/broker/new-dashboard` uses the same account-scoped
store and links to task create/detail/edit actions. Completing a task there
updates the workspace. This integration is limited to the dashboard preview:
the existing `/broker/dashboard` remains the normal Dashboard navigation target
and does not use this new task card.

## Dates and reminders

Dates and times use `Asia/Kolkata` (IST), independent of the device timezone.
Overdue means a due date before the current India calendar day. A task due
earlier today stays in Today; its clock time drives reminders. Next 7 days
includes today and the following six India calendar dates.

Start dates can be cleared. Due dates cannot precede the start date. An open
task without a due date appears in Today when its start date is today, Upcoming
when its start is in the future, and No due date after that day has passed.

## Repeating tasks

Repeat choices are daily, weekly, monthly, yearly, every weekday (Monday–Friday),
and custom intervals. Custom repeats support every 1–365 days/weeks/months/years;
weekly repeats let users choose weekdays. Repeats can run indefinitely or end
on a selected date. These are Gregorian calendar repeats in India time.

Completing an occurrence atomically preserves it in Completed and creates one
next occurrence, with the same title, details, priority, linked records, due time,
and reminder offsets. Start/due dates shift together; reminder delivery history
starts fresh. Missed dates are skipped to the next future calendar occurrence.
Monthly and yearly repeats retain their original day through short months and
leap years (31 January → 28 February → 31 March). There is no background task
generator: completion creates the next occurrence in this mock workspace.

Reopening a completed occurrence removes its untouched successor. If that next
task has already been edited or completed, reopening is blocked to protect it.
Editing an active task to Does not repeat stops further generation. Deleting a
task removes only that occurrence; it does not erase completed task history.

Reminders require both a date and a time. A task can have multiple reminders:
at due time, 15 minutes, 1 hour, or 1 day before, plus custom whole-number
minutes, hours, or days (up to 365 days before). Each reminder has its own
removal control and shows its scheduled IST time. Equivalent choices such as
60 minutes and 1 hour are treated as the same reminder. An empty list means
no reminders. New past reminders are rejected; an unchanged historical reminder
does not block editing the task or adding another future reminder. Removing
the date or time clears every dependent reminder.

`TaskReminderListener` lives in the broker shell, so reminders can appear while
the broker is on another route. It checks immediately, every five seconds, and
when the tab becomes visible. Delivery is recorded independently for each due-time/offset pair
before showing an in-app toast with a View task link. The reminders panel lists
Scheduled and Delivered reminders. Completing or deleting a task stops pending
delivery; changing its schedule can make it eligible again. Delivery markers
survive stale form saves; removed or rescheduled reminders discard obsolete
delivery keys. Existing single-reminder session data migrates without dropping
tasks or valid delivery history. This preview has no background push or notification
permission flow: reminders appear while the app is open.

## Reuse and implementation seam

The screen inherits the existing warm canvas, white surfaces, green actions,
fonts, radii, elevation, and motion tokens. It reuses app buttons, inputs,
checkboxes, selects, date picker, status tabs, filter chips, empty/loading states,
modal header/footer, dialog, scroll area, and the shared Tabler icon registry.
The working panel docks on desktop and fills the phone viewport; mobile actions
use the app's 48px control scale. Feature-local CSS modules follow the incumbent
`new-dashboard` and `new-site-visits` implementation and consume existing tokens.
They do not establish a separate theme or change the global design rules.

- `features/tasks/model.ts` owns validation, IST grouping, filtering, sorting,
  and reminder eligibility.
- `features/tasks/recurrence.ts` owns calendar repeat rules and date arithmetic;
  `lifecycle.ts` owns atomic completion/reopening and successor creation.
- `features/tasks/preview-store.ts` owns the versioned, validated session-storage
  adapter and shared React Query state. This is the replacement seam for future
  HTTP task access; account isolation and reminder delivery semantics must be
  enforced by that API when connected.
- `features/tasks/task-reminder-listener.tsx` owns the current in-app delivery
  adapter. A future delivery service can replace it without duplicating task
  rules in list or dashboard components.

## Verification

`lib/tasks/model.test.ts` covers optional/dependent fields, valid dates, India
midnight grouping, seven-day boundaries, intersecting due/link filters,
case-insensitive natural name sorting, completion ordering, and exact reminder
eligibility/deduplication. `lib/tasks/preview-store.test.ts` covers account
isolation, empty lists, damaged records, and reminder/edit races.
`lib/tasks/recurrence.test.ts` covers default India start dates, date validation,
custom weekdays, month/leap-year boundaries, end dates, repeat completion/reopen,
owner filters, and version-two migration into the current version-three envelope.

Browser smoke checks cover create, complete/reopen, edit, reschedule, reminder
setup, search, filters, refresh persistence, shared dashboard state, deletion,
and horizontal overflow at desktop, tablet, and phone widths. Review artifacts
are in `.impeccable/review/tasks-*`.
