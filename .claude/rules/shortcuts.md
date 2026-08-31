---
paths:
  - "app/**/*.{ts,tsx}"
  - "components/**/*.{ts,tsx}"
  - "features/**/*.{ts,tsx}"
  - "hooks/**/*.ts"
  - "config/shortcuts.ts"
---

# Keyboard shortcuts

Read `docs/SHORTCUTS.md` before adding, changing, or binding any shortcut. It
is the authority. Library is **tinykeys**.

Seven rules restated because they are the ones that cause conflicts and bugs:

1. **Every shortcut is declared in `config/shortcuts.ts`.** No inline bindings
   anywhere. One file is the only way a conflict is visible — and it runs a
   dev-time collision check that throws on duplicates.
2. **Always `$mod`, never hardcoded `Control` or `Meta`.** tinykeys maps `$mod`
   to ⌘ on Mac and Ctrl elsewhere.
3. **Prefer the `code` form** — `"$mod+KeyK"`, not `"$mod+k"`. It survives
   non-US keyboard layouts.
4. **Always call the returned `unsubscribe()` in the `useEffect` cleanup**, or
   bindings leak across navigations.
5. **Guard against editable targets.** tinykeys does NOT do this. Without the
   guard, a broker typing a client's name fires every single-letter shortcut.
   `$mod` combos may still fire; `Escape` always fires.
6. **Never override browser or OS keys** — `$mod+T/W/N/R/L/F/P/S/D`, `$mod+1-9`,
   F-keys, Tab, Space, arrows alone.
7. **Never a shortcut without a visible UI equivalent**, and never one for a
   destructive or consequential action. Approve/reject and delete stay
   click-only.

An action earns a shortcut only when it is **frequent, visible, and cheap to
reverse** — all three. This is a mobile-first product; shortcuts serve the
minority desktop case and are added deliberately, not everywhere.

Watch the shadowing trap: binding both a single letter and a sequence starting
with that letter makes the single letter unreachable.

Everything else — the registry pattern and collision check, scope table, the
shortcut map, WCAG 2.1.4 single-character rule, and platform display — is in
`docs/SHORTCUTS.md`.
