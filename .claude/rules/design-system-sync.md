---
paths:
    - "app/globals.css"
    - "features/design-system/**/*.{ts,tsx}"
    - "docs/DESIGN.md"
    - "lib/fonts.ts"
---

# Design system sync

Read `docs/DESIGN-SYSTEM-SYNC.md` before adding or changing a colour, type
step, shadow, radius, or font. It is the authority on which files must be
touched together so `app/globals.css`, the `/design-system` reference pages,
and `docs/DESIGN.md` never drift apart.

A token has already drifted once on this project: `font-display` was used as
a Tailwind class across seven files with no matching `--font-display` CSS
variable in `globals.css`, so it silently did nothing. This rule exists to
stop that happening again.

Four rules restated here because they are the expensive ones to get wrong:

1. **A colour or shadow needs the variable in both `:root` and its
   `@theme inline` passthrough in `app/globals.css`.** Tailwind v4 only
   generates a utility class (`bg-{name}`, `shadow-{name}`) from the
   `@theme inline` registration. A bare `:root` custom property with no
   `@theme inline` line produces a class that resolves to nothing — no error,
   no warning, the element just doesn't get the style.
2. **Every token edit touches `features/design-system/theme/*.ts` too**
   (`color-tokens.ts`, `type-scale.ts`, `shadow-tokens.ts`). That data powers
   the `/design-system` reference route. If it's not updated, that page starts
   lying about what the app actually renders.
3. **`docs/DESIGN.md` gets the value and its usage rule, not just the value.**
   A colour with a reserved meaning (`urgent`, `danger`) or a required pairing
   (a badge background always pairs with one specific text colour) needs that
   constraint written down, not just the hex.
4. **Before adding a new colour, font face, or shadow step, re-read
   `docs/DESIGN.md` §1.1 and §8.** One hue family, one neutral family, two
   signal colours, two font faces, five shadow steps — on purpose. A new one
   is very likely wrong; confirm with the user before adding it.

Verifying sync after a change means checking all three files agree — the
type checker will not catch a variable that exists in one file and not
another, only a browser check (or the `/design-system` page itself) will.

Everything else — the step-by-step for colours/type/shadows/fonts, the new
font-face procedure, and the full anti-pattern list — is in
`docs/DESIGN-SYSTEM-SYNC.md`.
