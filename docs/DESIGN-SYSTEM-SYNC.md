# Design system sync

Single source of truth for how a design token travels through this codebase.
`.claude/rules/` and `.cursor/rules/` only point here.

This file is procedure, not values. Colour hexes, type scale, shadow formulas,
and the reasoning behind them live in `docs/DESIGN.md` — this file exists so
that document and the code never drift apart again. (They already drifted
once: `font-display` was used across seven files with no matching
`--font-display` CSS variable, silently falling back to the browser default.
That is the bug this file prevents.)

---

## The four places a token lives

Every design token — colour, type step, shadow, radius, spacing — exists in
**up to four places**. Adding one means touching all four that apply; skipping
one is how the reference page lies about what the app actually renders.

```
1. app/globals.css        the CSS variable, under @theme or @theme inline
                           ↓ generates
2. Tailwind utility        the class Tailwind derives from the variable name
                           (--color-brand → bg-brand/text-brand/border-brand,
                            --shadow-md → shadow-md, --font-heading → font-heading)
                           ↓ documented by
3. features/design-system/theme/*.ts   the data array powering /design-system
                           ↓ explained by
4. docs/DESIGN.md          the human-readable rule: what it means, when to use it
```

**Step 2 needs no file edit** — Tailwind v4 generates the utility class
automatically from the `@theme` variable name. It is listed because it is the
step that silently fails if step 1 is named wrong, which is exactly what
happened with `font-display`/`font-heading`.

---

## Adding a colour

1. `app/globals.css` — add `--color-{name}: #HEX;` inside `:root`, **and** a
   matching passthrough line inside `@theme inline` (`--color-{name}:
var(--color-{name});`). Tailwind v4 only generates utilities for variables
   registered in `@theme` / `@theme inline`, not bare `:root` custom
   properties. This project's colours are declared in `:root` then re-declared
   in `@theme inline` — miss the second one and `bg-{name}` silently doesn't
   exist.
2. `features/design-system/theme/color-tokens.ts` — add a `ColorToken` entry
   to the matching `ColorGroup` (or a new group, if it's a genuinely new
   family — see the one-hue-family rule below before doing that).
3. `docs/DESIGN.md` §1.2 — add it to the relevant token block, and to §1.3 if
   it carries a reserved meaning (like `urgent` or `danger` do).
4. Check `docs/DESIGN.md` §1.1 first: **one hue family (green), one warm
   neutral family, two reserved signal colours (urgent, danger), one
   highlight. Nothing else.** A new colour is very likely wrong. If the need
   is real, that's a conversation with the user before it's a code change —
   this rule is deliberate, not an oversight.

## Adding a type step

1. `app/globals.css` — type steps are Tailwind arbitrary values and inline
   styles in this codebase (see `type-scale-row.tsx`), not CSS variables. No
   globals.css edit for a new _step_. A new **face** (a third font beyond
   Bricolage Grotesque / DM Sans) does need a globals.css change — see below.
2. `features/design-system/theme/type-scale.ts` — add a `TypeScaleStep` to
   `HEADING_SCALE`, `BODY_SCALE`, or `SPECIAL_SCALE`. Every field is required:
   `mobilePx`/`desktopPx` (mobile-first, always both), `tracking` (negative on
   display sizes, per DESIGN.md §2.2), `face` (`"display"` or `"sans"` — there
   are only two).
3. `docs/DESIGN.md` §2.2 — add the row to the scale table with the same
   numbers. They must match exactly; this table is what a developer reads
   before touching a font-size anywhere in the app.

### Adding a new font (rare, high-friction on purpose)

1. `lib/fonts.ts` — add the `next/font/google` import and a `variable:
"--font-{name}"` — this is the only place a font is imported. Never a
   `<link>` tag, never a second `next/font` call elsewhere.
2. `app/globals.css` `@theme inline` — add `--font-{name}: var(--font-{name});`
   so the `font-{name}` Tailwind utility exists. If the new face is meant to
   be reached via a different class name than its variable (the way
   `font-display` aliases to `--font-heading`), add that alias line too and
   say so in the `lib/fonts.ts` comment — see that file for the existing
   example.
3. `docs/DESIGN.md` §2.1 — add the row to the faces table.

## Adding a shadow (or radius, spacing)

1. `app/globals.css` — add the `--shadow-{name}` (or `--radius-{name}`) both
   in `:root` and its `@theme inline` passthrough, same as colours.
2. `features/design-system/theme/shadow-tokens.ts` — add a `ShadowToken`
   entry with the literal `css` string spelled out (not just the variable
   name) — the reference page exists so a developer can see the actual
   `box-shadow` value without opening globals.css.
3. `docs/DESIGN.md` §3.2/§3.3 — add the row. Re-read the elevation rule first:
   ink-tinted only, layered (near shadow + soft diffuse shadow), low opacity,
   never on a dark attention card, never stacked more than one step deep on
   the same element. A shadow that doesn't fit that formula is very likely
   wrong — see anti-patterns in DESIGN.md §8.

There is currently no `/design-system` page for radius or spacing tokens. If
adding a new radius or spacing value, at minimum update `docs/DESIGN.md`
§3.1/§3.2 — building the reference page is optional, not required, until one
exists to keep in sync.

---

## New component patterns (not raw tokens)

A reusable visual pattern — a new badge variant, a new card layout, a new
empty-state shape — is documented differently: add it to `docs/DESIGN.md` §4
(Component patterns) as prose + a small ASCII/table sketch, the way the
existing entries (`4.1 Card`, `4.3 Buttons`, `4.5 Property card`, …) are
written. It does not need a globals.css or theme/*.ts entry unless it
introduces a genuinely new token — most patterns are compositions of tokens
that already exist.

---

## Verifying sync — the actual check

After any token change, confirm all four of these agree before calling it
done:

1. `app/globals.css` — the variable exists in both `:root` and
   `@theme inline` (or just `@theme inline` for computed values like the
   `--radius-*` scale).
2. The Tailwind utility resolves — grep the codebase for the class name you
   expect (`bg-{name}`, `text-{name}`, `shadow-{name}`, `font-{name}`) and
   confirm at least one real usage renders it, or spot-check in the browser.
   A class with no backing variable fails silently: no error, no warning, the
   element just doesn't get the style.
3. `features/design-system/theme/*.ts` — the token is listed and its hex/CSS
   string matches globals.css exactly, not approximately.
4. `docs/DESIGN.md` — the value and its usage rule are written down. If the
   token carries a reserved meaning (colour) or a required pairing (e.g. a
   badge background always pairs with one specific text colour), that
   constraint is stated, not just the raw value.

`npx tsc --noEmit` catches a typo'd import or a malformed `TypeScaleStep`, but
it will not catch a CSS variable that exists in one file and not the other —
that mismatch is invisible to the type checker and only shows up as a class
that quietly does nothing. Visual check in the browser (or the `/design-system`
route itself) is the only real proof.

---

## Anti-patterns

- ❌ Adding a Tailwind utility usage (`font-display`, `bg-warm-gray`, whatever)
  without first confirming the backing `--variable` exists in `@theme` /
  `@theme inline`. This is exactly how the `font-display` bug happened.
- ❌ Editing `features/design-system/theme/*.ts` with a value that doesn't
  match `globals.css` — the reference page becomes a second, competing
  source of truth instead of a mirror of one.
- ❌ Adding a colour, shadow, or radius value inline in a component
  (`style={{ boxShadow: "..." }}`, a hex in `className`) instead of a token.
  If it's worth using once, it's worth naming; if it's truly one-off, it
  isn't a design system concern.
- ❌ A new hue, a new font face, or a sixth shadow step added without
  re-reading `docs/DESIGN.md` §1.1 / §8 first. These constraints are
  deliberate restraint, not gaps waiting to be filled.
- ❌ Updating `docs/DESIGN.md` and skipping `globals.css`, or the reverse.
  Whichever one is stale becomes the one someone trusts by accident.
