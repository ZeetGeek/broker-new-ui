# Keyboard shortcuts

The app is mobile-first, but brokers doing CRM work at a desk need fast,
predictable keyboard access. Shortcuts accelerate visible actions; they never
replace the normal UI.

## Source of truth

All shortcut definitions live in `lib/shortcuts.ts`.

- `BROKER_SHORTCUTS` is the broker registry.
- `OWNER_SHORTCUTS` is separate so broker changes cannot silently rewrite the
  owner portal.
- `useGlobalShortcuts` binds portal navigation and quick actions from the registry.
  Quick actions use `workflowHref` to open existing forms through the shared
  workflow host over the current page.
- `useShortcut` registers page and form bindings from the registry.
- `ShortcutsCheatsheet`, menu hints, button badges, and tooltips render from the
  same definitions.

Never hard-code a product shortcut inside a component.

## Broker map

### General

| Keys     | Action                                                                             |
| -------- | ---------------------------------------------------------------------------------- |
| `?`      | Open keyboard shortcuts                                                            |
| `Escape` | Close the topmost menu, drawer, or dialog through that component's native behavior |

### Go to

Press the keys one after another: `G`, then `D` opens Dashboard. Finish typing
before using a navigation shortcut. If a menu, dropdown, or dialog is open,
press `Escape` to close it first, then start the shortcut sequence. Nested
overlays may need more than one `Escape`; forms may ask you to confirm
discarding unsaved changes.

| Keys  | Destination                          |
| ----- | ------------------------------------ |
| `G D` | Dashboard                            |
| `G C` | Clients                              |
| `G L` | My Listings                          |
| `G P` | Pipeline                             |
| `G V` | Visits                               |
| `G T` | Tasks                                |
| `G E` | Earnings                             |
| `G M` | Marketplace, when enabled            |
| `G R` | Requests & Invitations, when enabled |
| `G N` | Notifications                        |
| `G S` | Saved properties                     |
| `G U` | My profile                           |
| `G F` | Referrals, when enabled              |

### Quick actions

Available from every broker page. Each shortcut opens the existing form over
the current page; saving or closing it keeps you on that page. Finish typing
and close any open menu or dialog before starting a quick action.

| Keys  | Action         |
| ----- | -------------- |
| `A C` | Add client     |
| `A O` | Add owner      |
| `A L` | Add listing    |
| `A V` | Schedule visit |
| `A T` | Add task       |

### Forms

| Keys                 | Action                                                     |
| -------------------- | ---------------------------------------------------------- |
| `Ctrl/⌘ Enter`       | Save a contact form or continue a property form            |
| `Ctrl/⌘ Shift Enter` | Save and add another contact when that action is available |

`Ctrl/⌘ Enter` never publishes a listing. Publish, delete, approve, reject, and
direct logout remain button-only because they are consequential.

## Runtime rules

1. Navigation, quick actions, and page shortcuts do not fire from inputs, textareas, selects,
   contenteditable regions, or ARIA textboxes.
2. Repeated, composing, or already-handled key events are ignored.
3. An open dialog or alert dialog suspends global and page shortcuts. Only the
   active form's own registered shortcuts and native `Escape` behavior remain.
   Menus and select dropdowns own letter keys for type-to-select. Keep global
   listeners in the bubbling phase so they respect these components' keyboard
   handling. Do not bypass it with a blanket capture listener.
4. Navigation and quick actions register once in the portal shell. Page and
   form bindings unsubscribe when their page unmounts; do not register a
   global quick action a second time on its list or dashboard page.
5. Create actions use two-key `A …` sequences, so there are no bare character
   shortcuts across a whole page.
6. Letter bindings use `KeyboardEvent.code` names (`KeyG KeyD`) so the same
   physical shortcut remains stable across keyboard layouts.
7. Shortcut hints are hidden on coarse-pointer devices.

## Reserved and prohibited

Do not bind browser, operating-system, editing, or destructive commands:

- `Ctrl/⌘ T`, `W`, `N`, `Q`, `R`, `L`, `F`, `P`, `S`, `D`
- `Ctrl/⌘ C`, `V`, `X`, `A`, `Z`
- `Ctrl/⌘ 1` through `9`
- `F1` through `F12`
- `Tab`, `Shift Tab`, Space, or arrows as global commands
- delete, publish, approve, reject, or direct logout

## Adding a shortcut

Before adding one:

- Confirm the action is frequent, visible, and cheap to reverse.
- Add one definition to the appropriate portal registry.
- Register behavior with `useGlobalShortcuts` or `useShortcut`.
- Add its ID to the current-page context list when it is not global.
- Show the hint on the equivalent button, menu item, or tooltip.
- Verify typing and dialogs suppress it.
- Verify menus and select dropdowns retain type-to-select, and a fresh
  navigation sequence works after closing them with `Escape` (once focus is
  outside editable fields).
- Add or update a regression test in `lib/shortcuts.test.ts`.
