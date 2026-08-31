# Keyboard Shortcuts

Single source of truth for keyboard shortcuts. `.claude/rules/` and
`.cursor/rules/` only point here.

Library: **tinykeys** (~650 B).

---

## Framing — read this first

This is a **mobile-first product**. Most users are on inexpensive Android
phones and will never press a key. Shortcuts serve one real case: a broker at a
desk doing CRM work — adding clients, moving pipeline stages, scanning
listings. That is a minority, and shortcuts should be built accordingly.

Two consequences:

1. **A shortcut is never the only way to do something.** Every shortcut has a
   visible button or menu item that does the same thing. If an action has no UI
   equivalent, it does not get a shortcut — it gets a button.
2. **Shortcuts are added deliberately, not everywhere.** Fifteen shortcuts
   nobody remembers is worse than five everyone does.

---

## tinykeys essentials

Facts that determine how you write bindings:

- **`$mod` is the cross-platform modifier** — Meta (⌘) on Mac, Control on
  Windows/Linux. Always use `$mod`, never hardcode `Control` or `Meta`.
- **Bindings match against both `KeyboardEvent.key` and `KeyboardEvent.code`**,
  case-insensitively. `"d"` matches `event.key`; `"KeyD"` matches `event.code`.
  **Prefer the `code` form** (`KeyD`) — it survives non-US keyboard layouts.
- **Sequences are supported**: `"g d"` means press `g` then `d`, and each press
  must land within **1000ms** of the last.
- **It returns an `unsubscribe()` function.** Inside a component, always call it
  from the `useEffect` cleanup, or the binding leaks across navigations.

```tsx
useEffect(() => {
  const unsubscribe = tinykeys(window, { "$mod+KeyK": openPalette });
  return () => unsubscribe();
}, []);
```

### Its built-in overlap behaviour, and the trap in it

tinykeys resolves some overlaps for you. Binding both `$mod+b` and `$mod+KeyB`
fires only one. Binding `"g a"` and `"a"` means typing `g` then `a` triggers
only the sequence.

That is convenient and also a trap: **a single-letter binding can be silently
shadowed by a sequence starting with the same letter.** If `g` opens a
sequence, plain `g` is no longer reliably available. Pick one or the other,
never both.

---

## The registry — how overlaps get prevented

**Every shortcut is declared in `config/shortcuts.ts`. No exceptions.**

Shortcuts scattered inline across components is how conflicts happen, because
nobody can see the whole set at once. One file means a conflict is visible on
one screen — and can be checked automatically.

```ts
// config/shortcuts.ts
export type Scope = "global" | "list" | "form" | "dialog";

export interface Shortcut {
  id: string;
  keys: string;        // tinykeys binding — prefer the `code` form
  label: string;       // shown in the help sheet
  group: string;       // help sheet section
  scope: Scope;
}

export const SHORTCUTS = [
  { id: "palette", keys: "$mod+KeyK", label: "Search",          group: "General", scope: "global" },
  { id: "help",    keys: "Shift+Slash", label: "Shortcuts",     group: "General", scope: "global" },
  { id: "goDash",  keys: "g d",       label: "Dashboard",       group: "Go to",   scope: "global" },
  // …
] as const satisfies readonly Shortcut[];
```

### Dev-time collision check

Run this at module load in development. It catches the mistake at the moment
it's made, not weeks later when a user reports that one key does two things.

```ts
if (process.env.NODE_ENV !== "production") {
  const seen = new Map<string, string>();
  for (const s of SHORTCUTS) {
    // "global" collides with every scope; others only collide within themselves
    const keysInScope = s.scope === "global" ? ["*"] : [s.scope, "*"];
    for (const scope of keysInScope) {
      const k = `${scope}:${s.keys.toLowerCase()}`;
      if (seen.has(k)) {
        throw new Error(`Shortcut conflict: "${s.keys}" used by ${seen.get(k)} and ${s.id}`);
      }
      seen.set(k, s.id);
    }
  }

  // A single letter is unreachable if a sequence starts with it
  const firstKeys = new Set(
    SHORTCUTS.filter(s => s.keys.includes(" ")).map(s => s.keys.split(" ")[0].toLowerCase())
  );
  for (const s of SHORTCUTS) {
    if (!s.keys.includes(" ") && firstKeys.has(s.keys.toLowerCase())) {
      throw new Error(`Shortcut "${s.keys}" (${s.id}) is shadowed by a sequence starting with it`);
    }
  }
}
```

The help sheet also renders from `SHORTCUTS`, so documentation can never drift
from behaviour.

---

## Scopes — when a binding is live

| Scope | Active when | Unregisters when |
|---|---|---|
| `global` | Anywhere in the app | Never |
| `list` | A list/table has roving focus | Focus leaves the list |
| `form` | Focus is inside a form | Form unmounts |
| `dialog` | A dialog is open | Dialog closes |

**A dialog suspends non-dialog shortcuts.** While a modal is open, only its own
bindings and `Escape` fire. Navigating away underneath an open dialog is
disorienting.

**Route-scoped bindings unregister on navigation.** This is what the
`unsubscribe()` return value is for.

---

## The guard — never fire while typing

**tinykeys does not do this for you.** Without a guard, a broker typing a
client's name triggers every single-letter shortcut in the app.

```ts
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox" ||
    el.closest("[contenteditable='true']") !== null
  );
}
```

Rules:

- **Single-key and sequence shortcuts never fire in an editable target.**
- **`$mod` combos may fire** — `$mod+Enter` to submit a form is the point.
- **`Escape` always fires**, editable or not. It is the universal way out.
- Check `event.repeat` and ignore held keys for actions that shouldn't repeat.

---

## Reserved — never bind these

Overriding a browser or OS shortcut is hostile, and users blame your app.

| Never | Why |
|---|---|
| `$mod+T` `$mod+W` `$mod+N` `$mod+Q` | Tab/window/app management |
| `$mod+R` `F5` | Reload |
| `$mod+L` | Address bar |
| `$mod+F` | Browser find — users rely on it |
| `$mod+P` `$mod+S` `$mod+D` | Print, save, bookmark |
| `$mod+Shift+T` `$mod+Shift+N` | Reopen tab, incognito |
| `$mod+1`…`$mod+9` | Tab switching |
| `F1`–`F12` | Browser and OS functions |
| `Tab`, `Shift+Tab` | Focus traversal — never intercept |
| `Space`, arrows alone | Scrolling |
| `$mod+C/V/X/A/Z` | Clipboard and undo |

`$mod+K` is safe and is the near-universal convention for a command palette.

---

## The shortcut map

Deliberately short. Add to it only when a real user asks.

### Global

| Keys | Action |
|---|---|
| `$mod+K` | Open search / command palette |
| `?` (`Shift+Slash`) | Show shortcuts |
| `Escape` | Close the topmost layer |

### Go to — sequences

Sequences avoid the reserved-key problem entirely and are self-documenting.
These map to the existing nav.

| Keys | Action |
|---|---|
| `g d` | Dashboard |
| `g p` | Properties |
| `g c` | Clients |
| `g v` | Visits |
| `g r` | Referrals |

### Lists — only with roving focus

| Keys | Action |
|---|---|
| `j` / `ArrowDown` | Next item |
| `k` / `ArrowUp` | Previous item |
| `Enter` | Open selected |

### Forms

| Keys | Action |
|---|---|
| `$mod+Enter` | Submit |
| `Escape` | Cancel / close |

---

## Where shortcuts do NOT belong

| Action | Why not |
|---|---|
| **Approve / reject a broker request** | The owner's single most consequential decision. Their own screen is "one screen, one decision" by design. A keystroke away from approving a stranger is wrong. |
| **Delete anything** | Destructive. Requires a named confirmation, which a shortcut bypasses. |
| **Publish a listing** | Consequential and public. |
| Any action not visible on the current screen | A shortcut for something the user cannot see is a hidden feature, not a fast path. |
| Any action a user does once a week | Not worth the key or the memory. |

An action earns a shortcut when it is **frequent, visible, and cheap to
reverse.** All three.

---

## Accessibility

**WCAG 2.1 SC 2.1.4 — Character Key Shortcuts.** If a shortcut uses a single
character with no modifier, at least one must be true: it can be turned off, it
can be remapped, or it is only active when the relevant component has focus.

Speech-input users trigger stray characters constantly, so this is a real
failure mode, not a formality.

The map above satisfies it by scoping: `j` / `k` only fire when a list has
focus. `g` sequences are two-press, which is outside the single-character rule.
If a bare single-key global shortcut is ever added, it needs an off switch.

Also:

- Shortcuts never replace focus management. `Tab` order must work on its own.
- `Escape` closes the topmost layer only — one press, one layer.
- Radix/shadcn dialogs already handle `Escape`. Do not bind it again on top,
  or one press closes two things.

---

## Discoverability

A shortcut nobody knows about does not exist.

- **`?` opens the help sheet**, rendered from `SHORTCUTS`
- **Show the hint where the action lives** — in menu items and tooltips, as a
  `<kbd>` chip, exactly as the search box already shows `Ctrl K`
- **Never show hints on touch devices** — no keyboard, so the chip is noise

### Platform display

`$mod` renders differently per platform, and getting it wrong looks careless.

| Binding | Mac | Windows / Linux |
|---|---|---|
| `$mod+KeyK` | ⌘K | Ctrl K |
| `Shift+Slash` | ? | ? |

Detect once, format everywhere, from one helper.

---

## Never do

- ❌ A shortcut declared outside `config/shortcuts.ts`
- ❌ Hardcoding `Control` or `Meta` instead of `$mod`
- ❌ Binding without calling `unsubscribe()` in cleanup
- ❌ Firing a single-key shortcut while the user is typing
- ❌ Overriding a browser or OS shortcut
- ❌ A shortcut with no visible UI equivalent
- ❌ A shortcut for a destructive or consequential action
- ❌ Binding `Escape` on top of a Radix dialog
- ❌ Both a single letter and a sequence starting with that letter
- ❌ Showing `<kbd>` hints on touch devices
- ❌ A shortcut that exists but appears nowhere in the help sheet

---

## Before adding a shortcut

- [ ] Declared in `config/shortcuts.ts`, dev collision check passes
- [ ] Uses `$mod`, and the `code` form (`KeyD`) not the bare letter
- [ ] Not in the reserved list
- [ ] Correct scope, and unregisters when that scope ends
- [ ] Guarded against editable targets
- [ ] The action has a visible button or menu item too
- [ ] Frequent, visible, and cheap to reverse
- [ ] Appears in the `?` help sheet
- [ ] Tested on both Mac and Windows
