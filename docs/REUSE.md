# Reuse & Design System

Single source of truth for making things common. `.claude/rules/` and
`.cursor/rules/` only point here.

---

## First, a correction worth making

This project is Tailwind CSS v4 with CSS-first configuration in
`app/globals.css`. Do not add a second styling system for components, tokens,
or layout.

The one exception is the type scale: named classes live in `app/common.scss`
(`.display-1`, `.h1`, `.body`, …) so a heading is one class everywhere. That
file is for type steps only — do not grow it into a dumping ground for cards,
buttons, or colours. Those stay tokens, `@utility`, or React components.

Everything else you'd want SCSS for has a Tailwind v4 equivalent:

| What you want        | SCSS way         | Here              |
| -------------------- | ---------------- | ----------------- |
| Reusable values      | `$brand-color`   | `@theme` tokens   |
| Type step            | `.h1 { ... }`    | `app/common.scss` |
| Other reusable class | `.card { ... }`  | `@utility`        |
| Reusable UI block    | `.property-card` | A React component |
| Variants             | Modifier classes | CVA               |

---

## The four layers of reuse

Pick the lowest layer that solves the problem. Reaching too high creates
abstractions nobody can unpick.

```
1. TOKENS      — a value used everywhere        → @theme
2. UTILITIES   — a style combo used everywhere  → @utility; type steps → common.scss
3. COMPONENTS  — markup + behaviour             → React component
4. LOGIC       — a rule used everywhere         → lib/ function or hook
```

A color is a token, not a component. A price display is a component, not a
utility. Getting this wrong is the main way design systems rot.

---

## Layer 1 — Design tokens

Everything visual traces back to `app/globals.css`. Change a value there and it
propagates everywhere, with no find-and-replace.

```css
@import "tailwindcss";

@theme {
    /* Brand — the product name is a placeholder, but the palette need not be */
    --color-brand-50: oklch(0.97 0.02 250);
    --color-brand-500: oklch(0.6 0.18 250);
    --color-brand-600: oklch(0.53 0.18 250);
    --color-brand-900: oklch(0.3 0.12 250);

    /* Semantic — meaning, not appearance */
    --color-success: oklch(0.65 0.17 145);
    --color-warning: oklch(0.75 0.16 75);
    --color-danger: oklch(0.6 0.2 25);
    --color-info: oklch(0.65 0.15 240);

    /* Property status — ONE definition, used by badges, cards, filters */
    --color-status-available: var(--color-success);
    --color-status-under-offer: var(--color-warning);
    --color-status-sold: oklch(0.55 0.02 250);
    --color-status-rented: var(--color-info);

    /* Shape */
    --radius-card: 0.75rem;
    --radius-field: 0.5rem;

    --shadow-card: 0 1px 3px oklch(0 0 0 / 0.08);
    --shadow-card-hover: 0 4px 12px oklch(0 0 0 / 0.12);
}
```

Every token here generates utilities automatically — `bg-brand-500`,
`text-success`, `rounded-card`, `shadow-card`.

Three rules:

- **Name by meaning, never appearance.** `--color-danger`, not `--color-red`.
  When the danger color becomes orange, `text-red` reads as a lie.
- **Never a raw hex in a component.** `bg-[#2563eb]` is a token that escaped.
  If a color is worth using, it is worth naming.
- **Build on shadcn's variables, don't replace them.** shadcn already defines
  `--color-background`, `--color-foreground`, `--color-primary`, and friends.
  Map brand tokens onto those rather than introducing a parallel palette.

---

## Layer 2 — Typography as utilities

Define the type scale **once** in `app/common.scss`. Then a heading is one
class, everywhere. Colour is not in the class (except `.eyebrow`) — add
`text-ink`, `text-white`, or `text-ink-muted` beside it.

```tsx
<h1 className="h1 text-ink">12 requests. 3 waiting on you.</h1>
<p className="body text-ink-muted">3 BHK · Vesu · 1,240 sq ft</p>
<p className="eyebrow">Next showing</p>
```

| Need                | Class                                    |
| ------------------- | ---------------------------------------- |
| Hero / marketing    | `.display-1` `.display-2` `.display-3`   |
| Headings            | `.h1` `.h2` `.h3` `.h4` `.h5` `.h6`      |
| Body                | `.body-lg` `.body` `.body-sm` `.body-xs` |
| Label above a value | `.eyebrow`                               |

Not `text-[28px] md:text-[40px] font-bold tracking-tight leading-[1.08]`
copied into forty files. When the heading scale changes, it changes in one
place.

**Semantic HTML is separate from visual size.** `.h1` is a look, not a heading
level. A card title styled `.h3` may still need to be an `<h2>` for the
document outline. See `app/AGENTS.md` — one `<h1>` per page.

---

## Layer 3 — Layout utilities

Only for genuinely repeated layout patterns. Keep this list short.

```css
@utility page-container {
    width: 100%;
    max-width: 72rem;
    margin-inline: auto;
    padding-inline: 1rem;
}

@utility card-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* Mobile: users are one-handed on cheap Android phones */
@utility touch-target {
    min-height: 44px;
    min-inline-size: 44px;
}

@utility safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

`touch-target` and `safe-bottom` matter more than they look. Every interactive
element on mobile needs a 44px hit area, and the bottom nav must clear the
home indicator. Encoding both as utilities means nobody has to remember.

---

## Layer 4 — Domain components (the highest-value layer here)

This is where reuse actually pays on this platform. Each of these exists
**exactly once** and is used everywhere the concept appears.

| Component               | Why it must be one component                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Price>`               | INR lakh/crore formatting. Appears on cards, forms, pipeline, share page, dashboards. Duplicated, one place will eventually render `₹4500000`.                                    |
| `<PropertyStatusBadge>` | Status → label + color mapping in one place. Adding a status must not mean editing six files.                                                                                     |
| `<PhoneNumber>`         | **Contact masking is a product rule.** Owner contact is hidden until a representation is approved. If masking is written by hand anywhere, that is a data leak waiting to happen. |
| `<DateDisplay>`         | dd/mm/yyyy everywhere, with relative form ("2 days ago") in one place.                                                                                                            |
| `<AreaDisplay>`         | sq ft with thousands separators, carpet vs built-up labelling.                                                                                                                    |
| `<PropertyCard>`        | One card used by browse, my-properties, and the owner list. Three cards means three photo-loading strategies and three inconsistent layouts.                                      |
| `<EmptyState>`          | Every empty screen must teach the next action. One component, one shape: icon, headline, action.                                                                                  |
| `<UserAvatar>`          | Photo, initials fallback, verified badge.                                                                                                                                         |
| `<VerifiedBadge>`       | The trust signal on the approve screen. Its meaning must never drift.                                                                                                             |
| `<LoadingSkeleton>`     | Per-shape skeletons. No blank white flashes.                                                                                                                                      |

The `<Price>` pattern generalizes to all of them — a thin component wrapping a
pure function:

```tsx
// lib/format/price.ts — pure, testable, no React
export function formatPriceInr(rupees: number): string { ... }

// components/shared/price.tsx — the only thing pages import
export function Price({ amountInr, size = "default" }: PriceProps) {
  return <span className={size === "lg" ? "text-price-lg" : "text-price"}>
    {formatPriceInr(amountInr)}
  </span>;
}
```

Logic in `lib/`, presentation in the component. The function is unit-testable
with no DOM; the component is the only thing pages ever touch.

---

## Layer 5 — Variants with CVA

When one component needs several looks, use `class-variance-authority` — the
same tool shadcn already uses. Not boolean props.

```tsx
const badge = cva("inline-flex items-center rounded-md px-2.5 py-0.5 text-caption font-medium", {
    variants: {
        status: {
            available: "bg-status-available/10 text-status-available",
            underOffer: "bg-status-under-offer/10 text-status-under-offer",
            sold: "bg-status-sold/10 text-status-sold",
            rented: "bg-status-rented/10 text-status-rented",
        },
    },
    defaultVariants: { status: "available" },
});
```

**Boolean props do not scale.** `<Badge isLarge isOutlined isDanger />` allows
combinations nobody designed and nobody tested. A `variant` union permits only
what exists.

Always merge incoming classes with `cn()` so a caller can adjust spacing
without a new variant:

```tsx
<div className={cn(badge({ status }), className)} />
```

---

## Layer 6 — Non-visual reuse

Reuse is not only components. These are equally important and more often
duplicated:

| Kind             | Lives in                  | Example                                                     |
| ---------------- | ------------------------- | ----------------------------------------------------------- |
| Formatting       | `lib/format/`             | `formatPriceInr`, `formatPhoneIn`, `formatDateIn`           |
| Validation       | `lib/validation/`         | One zod schema used by **both** the form and the API call   |
| Constants        | `config/constants.ts`     | `PIPELINE_STAGES`, `MAX_PHOTOS_PER_PROPERTY`, `BHK_OPTIONS` |
| Data access      | `lib/api/`                | One `getProperties()`, not a fetch in each page             |
| Shared behaviour | `hooks/` or `features/*/` | `useDebouncedValue`, `usePropertyFilters`                   |

**The zod schema is the sharpest example.** Define the property form schema
once; use it for client-side validation and for typing the API payload. Two
schemas drift, and the drift surfaces as a server rejection the user cannot
understand.

`PIPELINE_STAGES` is the other one. Stage names appear in the pipeline board,
filters, the mobile tab strip, and analytics. Hardcoding them in four places
guarantees they disagree eventually.

---

## When NOT to make something common

Premature abstraction is more expensive than duplication. It is harder to
reverse, and it produces components with fourteen props that serve nobody.

**The rule of three:** the first use is a component. The second is a
coincidence. The third is a pattern — abstract then, not before.

Signs an abstraction went too early:

- More than ~6 props, several of them booleans
- A `variant` prop with a value used exactly once
- Props that only exist to switch off a feature for one caller
- Needing to read the component's source to use it correctly

Two similar-looking things that change for different reasons should stay
separate. An owner's property card and a broker's property card may look alike
today and diverge completely once approval state and contact masking land.

---

## Never do

- ❌ SCSS files besides `app/common.scss`, or CSS Modules, alongside Tailwind
- ❌ Non-type styles dumped into `app/common.scss` — cards, buttons, colours stay out
- ❌ `@apply` piling a dozen utilities into `.btn-primary` — that recreates the
  unmaintainable CSS Tailwind exists to avoid. Make a component instead.
- ❌ A raw hex or arbitrary value where a token exists — `bg-[#2563eb]`
- ❌ Formatting a price, phone, or date inline instead of using the component
- ❌ Copying a card's markup into a second page "just to change one thing"
- ❌ Editing `components/ui/` to change a shadcn primitive — wrap it instead
- ❌ Boolean props where a `variant` union belongs
- ❌ A component that takes `className` but ignores it — always merge with `cn()`
- ❌ Two zod schemas for the same shape

---

## Build order

Do not build a design system up front for screens that don't exist. In order:

1. **Tokens in `globals.css`** — colors, radii, shadows. Cheapest now, most
   painful to retrofit, because retrofitting means touching every component.
2. **Type scale classes in `app/common.scss`** — the moment there is a second
   heading. One class per step; do not copy font-size stacks.
3. **`lib/format/`** — `formatPriceInr` before the first price is rendered
   anywhere. This one is genuinely urgent; INR formatting duplicated even twice
   is how `₹4500000` reaches a screen.
4. **`<Price>`, `<PropertyStatusBadge>`, `<EmptyState>`** — the first three
   components worth having, because all three appear on the very first screen.
5. **Everything else** — when the third use appears.
