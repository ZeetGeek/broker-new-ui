# Reuse & Design System

Single source of truth for making things common. `.claude/rules/` and
`.cursor/rules/` only point here.

## Card grid spacing

Use `gap-card-grid` for card grids: 12px below 640px and 16px from 640px upward
at the default root font size. The same gap applies between rows and columns.
The source is `--card-grid-gap` in `app/globals.css`; rem units respect text sizing.
For `WindowVirtualGrid`, pass `gap="card-grid"` so virtual row measurements use
the rendered CSS gap. Loading placeholders must use the same token and columns.
This is the default for `WindowVirtualGrid` and the shared standard for listing,
CRM, visit, dashboard, earnings, and analytics card grids. Keep zero-gap joined
rows, form fields, and card-internal controls on their own spacing scales.

## Profile photo cropping

Use `PhotoCropModal` from `components/shared/photo-crop-modal.tsx` for profile
and contact photo cropping. It owns the circular crop guide, live avatar preview,
Reset action, responsive modal layout, and 512px square PNG output. Pass a local
image URL, original filename, controlled open state, and `onCropped` callback.
The caller owns file selection, object-URL cleanup, and any upload. The previous
`ProfileImageCropper` export is a compatibility alias to this same component.

## Square property cover images

Use `PropertyCoverImage` from `components/shared/property-cover-image.tsx` for
square property photos in compact cards and list rows. It owns the 2px white
frame, shared 12px corners, soft layered shadow, and missing-photo placeholder.
It uses `AppImage` for loading, optimisation, and failed-photo fallback.

Pass `src`, `alt` (empty for decorative images), and `size` in pixels (default 64).
Use `className` for layout and `imageClassName` for crop positioning. When responsive
classes change the rendered frame width, also provide the matching `sizes` value.
Use `priority` only for an image that needs preloading. For responsive CSS modules,
set `--property-cover-size` on the frame and provide matching `sizes`; the `size` prop
provides its default. Optional `children` preserve photo-count badges. Square
thumbnails in dashboards, contacts, visits, selectors, and deal/lead summaries use
this component. Rectangular `PropertyThumb` uses, full property cards, and property
galleries retain their existing components.

## Drawer accordion sections

Use `DrawerSection` from `components/shared/drawer-section.tsx` to group fields
and record details in drawers. Give every group a plain-language `title` and
short `description`. Groups start open and collapse independently using the
heading or chevron, including with a keyboard. Collapsing keeps the contents
mounted so field values are preserved. Header and footer actions stay outside
the sections. Small confirmations and empty/error messages remain compact.

The component owns the headings, description, spacing, dividers and disclosure
icon. `WizardSection` delegates to it for existing property, Client, Owner and
Task forms; its section stack retains the form's established spacing.

For custom or React Hook Form validation, call `revealDrawerSections(form)`
before focusing errors. Native invalid events reveal enclosing sections
automatically. Deep links to section content should reveal that section before
scrolling to it. Do not nest an interactive action inside the disclosure heading.

## Area name colours

Geographic chips (areas, cities, states, and countries) display their labels with
`formatPlaceName` from `lib/format/owner-listings-labels.ts`. This is display-only
title case: keep the original values for saved data, filters, and colour lookup.
`LocalityCombobox` applies it to selected chips in forms and profile editors.

Use `LocalityCombobox` for area-entry fields across contact forms, property forms,
profile editors, and the marketplace's area filter. Use `multiple` for a list of
areas; omit it for a single property or owner's location. Supply `cityId` for API
suggestions, or `options` for preloaded inventory and multi-city preferences.
Marketplace filters must pass `allowCustom={false}`. Keep the marketplace's
country/state/city navigation and search band. Loading uses a black spinner
without a coloured background; selected areas use the shared colour helper below.

Use `areaColorClassName(area)` from `lib/styles/area-color.ts` to assign colours
to any area presentation: a chip, label, row, or another element. The function
returns background and text colour classes without imposing shape or layout.
The same name has the same colour across pages, list orders, and sessions.
Capitalisation, extra spaces, and equivalent Unicode forms do not affect colour.
Each page owns its rendering. Keep plain addresses and location text in their
existing layout unless a colour treatment is requested.

Colours come from a fixed palette; different names can share a colour. These
colours carry no status or priority meaning. Keep the palette order and hash
stable to preserve assignments. Do not assign area colours by list index or
random values.

## List toolbar controls

Use `ListSearchField`, `ListToolbarSelect`, and `ListAddButton` from
`components/shared/list-toolbar.tsx` for list-page search, sort/filter dropdowns,
and primary add actions. They own the shared control face, icons, focus states,
touch sizing, and optional keyboard shortcut badge. Compose only the controls
the page needs; keep tabs, filter sheets, layout, and domain logic on the page.

`ListSearchField` debounces changes by 300ms and follows external filter resets.
Pass `debounceMs={0}` for local filtering or when the page already debounces
requests. Use `fullWidth` inside a page-sized wrapper. Set the placeholder and
accessible label for the current list.

`ListToolbarSelect` takes page-specific `options`, `value`, and `onChange`.
Use `defaultValue` for sort highlighting, `active` for an explicitly highlighted
filter, and `mobileLabel="Sort"` for compact phone labels. It exposes the selected
option as a radio item. A date-range dropdown keeps its date-filter semantics.

`ListAddButton` takes `label`, an optional `icon` (defaults to Plus), an optional
`trailingIcon` for a dropdown cue, an optional `shortcutId`, and normal button props.
It defaults to the accent variant; use
`variant="outline"` for secondary add actions.
The page keeps shortcut handling, action behavior, and breakpoint visibility;
existing phone FABs remain separate. Form selects, autocomplete fields, modal
pickers, and global navigation search retain their own patterns. Marketplace
search bands retain their discovery layout.

## Icon-only actions

Use `IconButton` from `components/shared/icon-button.tsx` for compact icon actions,
including menus, navigation arrows, edit/delete, close, and attachment controls.
It owns the rounded border, subtle shadow, hover/expanded/pressed fill, focus,
disabled and loading states. Do not rebuild the face with ghost buttons or local CSS.

Pass `size="xs" | "sm" | "md" | "lg" | "xl"` (24/32/36/44/48px; default `sm`).
Coarse-pointer targets grow to at least 44px. Use `tone="danger"` for delete/remove,
or `brand`, `success`, `warning`, and `neutral`. `color` accepts a CSS colour and
derives the light background, border and shadow from that same icon colour.
Always provide `aria-label` or `aria-labelledby` and use a Tabler registry icon.
Button props, refs, loading, and Base UI `render` composition pass through.
Keep feature `className` overrides for layout/visibility, rather than restyling the face.

Use `appearance="ghost"` inside an already bordered control, such as a period navigator,
pagination group, input, or filter chip. It keeps the shared sizing, centering, colours,
focus and hover fill, without adding a second border or shadow. Standalone icon
actions use the default `appearance="outline"`.

Use `appearance="inverse"` on dark cards for a translucent face, light icon,
and subtle hover border. Keep the icon fully opaque for contrast.

Text-labelled ghost buttons, calendar date cells, drag handles and segmented
selection controls keep their own semantics and are not icon action buttons.

Inside an existing interactive trigger (such as an accordion header or native
`summary`), use `IconButtonFace` from `components/shared/icon-button-face.tsx`.
It shares the `IconButton` styles and sizes as a decorative span, preserving one
keyboard target and avoiding a nested button.

## Attached client summaries

Use `AttachedClientsSummary` from `components/shared/attached-clients-summary.tsx`
for grouped clients: one client shows an avatar and name; multiple clients show
two avatars followed by the total count. `AttachedBuyersRow` adds the Clients label
and empty/attach state for property cards and previews. Keep individual contact
actions tied to the named person. The draft schema preserves optional avatar URLs.

## Time and date/time pickers

Tasks and visits share `ReminderPicker` from `components/shared/reminder-picker.tsx`
for multiple preset or custom reminders, removable selections and IST previews.
Store offsets as a unique `reminders` array in minutes. The zero offset means
at the task due time or visit start; an empty array means no reminders. Existing
visit preview records migrate their single reminder without changing its timing.

Use `AppTimePicker` from `components/shared/app-time-picker.tsx` for time-only fields.
The compact input-style trigger opens the time columns with Now, Clear and OK.
Values are `HH:mm`; clearing emits an empty string. Now uses IST. Changes commit
with OK; dismissing the popup discards the pending choice.

Use `AppDateTimePicker` from `components/shared/app-date-time-picker.tsx` when a form
collects both a date and a time. Its compact trigger opens the combined calendar
and time columns from `c-time-picker-13`; OK commits the choice. Values are IST
wall-clock strings, `yyyy-MM-ddTHH:mm`; callers
keep their existing UTC conversion when saving. Pass `minuteStep`, `min`, `max`,
and errors to retain the form's restrictions. Tasks use `timeOptional` and
`clearable` to support a date without a time or an unscheduled task. The layout
stacks inside the popup on phones. Published availability/booking slots retain their
slot controls because each choice has its own availability and booking state.

For a time interval on one day, use a separate Date field followed by Start time
and End time fields, both using `AppTimePicker`. Do not combine the date with
only the start time. Date ranges use `AppDateRangeFields` for independently
labelled Start date and End date inputs; invalid reversed ranges cannot apply.

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
    --radius-card: 1.25rem;
    --radius-field: 0.75rem;

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
<p className="body text-ink-muted">3 BHK · Andheri West · 1,240 sq ft</p>
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
| `<PriceWithCommission>` | **Listing ask prices** (sale / monthly rent). Hover tip for brokerage — broker "You get" / owner "Broker gets", or the empty-commission copy. Never reimplement this tip.         |
| `<Price>`               | Non-listing money only: buyer offers, budgets, totals, form previews. INR lakh/crore formatting without a commission tip.                                                         |
| `<PropertyStatusBadge>` | Status → label + color mapping in one place. Adding a status must not mean editing six files.                                                                                     |
| `<PhoneNumber>`         | **Contact masking is a product rule.** Owner contact is hidden until a representation is approved. If masking is written by hand anywhere, that is a data leak waiting to happen. |
| `<DateDisplay>`         | dd/mm/yyyy everywhere, with relative form ("2 days ago") in one place.                                                                                                            |
| `<AreaDisplay>`         | sq ft with thousands separators, carpet vs built-up labelling.                                                                                                                    |
| `<PropertyCard>`        | One card used by browse, my-properties, and the owner list. Three cards means three photo-loading strategies and three inconsistent layouts.                                      |
| `<AppImage>`            | The only raster image primitive. Wraps `next/image` with lazy loading, responsive output, shared quality/placeholder policy, and fallback handling.                               |
| `<EmptyState>`          | Every empty screen must teach the next action. One component, one shape: icon, headline, action.                                                                                  |
| `<UserAvatar>`          | Photo or avvvatars-react shape/character fallback.                                                                                                                                |
| `<VerifiedBadge>`       | The trust signal on the approve screen. Its meaning must never drift.                                                                                                             |
| `<LoadingSkeleton>`     | Per-shape skeletons. No blank white flashes.                                                                                                                                      |
| Icons (`icons.tsx`)     | **One Tabler registry.** Import `WhatsAppIcon` / `CallIcon` / `MailIcon` (and other aliases) from `components/shared/icons` — never `lucide-react` or raw `@tabler/icons-react`.  |

Use `<AppImage>` for every rendered raster photo, including property photos,
avatars, upload previews, and remote media. A `fill` image must sit in a
positioned, dimensioned frame and pass a `sizes` value that matches its real
breakpoints. Use `preload` only for the single likely LCP image; everything
else stays lazy. SVG logos and browser/video metadata attributes are the only
normal exceptions.

Listing asks use the commission-aware component; other money uses `<Price>`.
Both wrap pure formatters:

```tsx
// lib/format/price.ts — pure, testable, no React
export function formatPriceInr(rupees: number): string { ... }

// Listing ask — cards, pipeline, visits, detail, dashboards
import { PriceWithCommission } from "@/components/shared/price-with-commission";
<PriceWithCommission
  amountInr={listing.amountInr}
  isRent={listing.isRent}
  commissionPercent={listing.commissionPercent}
  commissionAmountInr={listing.commissionAmount}
  audience="broker" // or "owner"
  size="lg" // xs | sm | md | lg | xl | 2xl — prefer over type classes in className
  // showEmptyTip show underline tip when commission unset (default true)
  // underline="auto" | "never"
  // tooltipSide="top" | "bottom" | …
/>

// Non-listing money — offers, budgets, totals
import { Price } from "@/components/shared/price";
<Price amountInr={offerInr} isRent={false} />
```

Logic in `lib/`, presentation in the component. The function is unit-testable
with no DOM; pages never call `formatPriceInr` / `formatRentInr` in JSX for a
listing ask.

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
- ❌ Rendering a listing ask with bare `<Price>` or `formatPriceInr` instead of
  `<PriceWithCommission>`
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
4. **`<PriceWithCommission>`, `<Price>`, `<PropertyStatusBadge>`, `<EmptyState>`**
   — listing asks first; then the other three that appear on the first screen.
5. **Everything else** — when the third use appears.

### Surface-pill tabs

Use `SlidingTabs` from `@/components/shared/sliding-tabs` for rounded muted tracks
with a white sliding active pill (dashboard cards, notifications, property entry
mode, pricing switches, earnings, and the Tabs catalog). It is the only surface-pill
implementation; legacy tab modules re-export it.

```tsx
<SlidingTabs
    value={view}
    onValueChange={setView}
    label="Visit status"
    height={36}
    options={[
        { value: "upcoming", label: "Upcoming", count: 5 },
        { value: "running", label: "Running", count: 1 },
        { value: "needs_update", label: "Needs update", count: 2 },
    ]}
/>
```

`height` is the whole horizontal bar height including padding, defaults to 36,
and accepts design pixels as a number or a CSS length such as `"3rem"`. Phone
and coarse-pointer tabs retain a minimum 44px touch target. Counts are optional;
zero is hidden and values above 99 show `99+`. `stretch` fills the available width;
`orientation="vertical"` uses the same height per row. Supply `panelId` and option
`id`s when linking tabs to panels. Arrow keys, Home, End, Enter, and Space work;
reduced motion snaps the pill. Task planner day selectors and notebook tabs use
the compact surface pill. CRM filter chips remain a separate control.
