---
version: 1
slug: "features-tasks-tasks-page-tsx"
primary_target: "features/tasks/tasks-page.tsx"
related_targets:
  - "features/tasks/task-planner.tsx"
  - "features/tasks/task-list.tsx"
  - "features/tasks/planner.module.css"
---

# Tasks planner

Mode: Operate. Brokers plan private follow-ups on phones and desktop.

## Approved direction

The user pins the existing portal header, rotating task summary, Filters button,
search, sort and Add task controls. There is no sidebar. Views are To do
(unfinished tasks), Completed, and Deleted. Newly completed tasks show their
checkmark and strikethrough in To do for two seconds, then disappear from that
view. Save completion immediately; keep the brief feedback local to the UI.

Below the toolbar, use the TeuxDeux day planner as the visual reference:
https://teuxdeux.com/home. Flat white paper, ruled task lines, small uppercase
dates, weekday headings, five date columns by default, quiet hover
controls, inline task entry and editing, compact date navigation, and an
undated Someday area beneath. Keep the app's green accent and existing header
identity. Three and seven columns are optional desktop views; phones show a
single day with date navigation and visible touch controls.

Use the shared theme fonts throughout: DM Sans (`--font-sans`) for task text
and controls, and Bricolage Grotesque (`--font-heading`) for headings. Do not
load a separate planner font or override body text with Arial.

## Behavior and constraints

Task creation, details, editing, deletion, reminders, tabs, search, filters, and
sorting use local workspace state. These interactions must not change the URL
or add browser history entries. Existing incoming task links still initialize
the intended dialog and linked-record prefill.

Task titles lead. Full text and linked Client, Owner, property, priority,
recurrence, and reminder details remain accessible from the actions menu and
the details drawer. Long task titles wrap within the day column, and rows grow
to show the full text, including long words without spaces.

Unfinished overdue tasks stay in their original due-date columns; they never
automatically move into Today. Dragging between days explicitly changes the
schedule; reordering within a day preserves deadlines. Deletion is recoverable
and stops reminders. Restore keeps linked data and completion state and skips
missed reminders. Deleted tasks are excluded from dashboard counts.

The existing browser-local mock adapter remains the persistence layer. No API
or backend support is implied. Existing saved tasks retain compatibility.

## Quality bar

Match the reference's quiet paper-list density and typography below the pinned
header. Preserve keyboard support, 44px phone targets, touch drag handles,
reduced-motion behavior and the existing task operations. Do not reintroduce
wide CRM record columns, empty linked-record placeholders, a sidebar, or
large task cards.
