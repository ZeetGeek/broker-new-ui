# Design Rules

Single source of truth for visual design on this project. `.claude/rules/` and
`.cursor/rules/` only point here.

Target: **Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 (CSS-first) + shadcn/ui**.

Token definitions live in `app/globals.css` under `@theme`. This document explains
what the tokens mean and when to use them. If the two disagree, `globals.css` is
wrong and should be corrected to match this file.

---

## Why this matters more here than on a typical web app

The reference design for this product is a warm, flat, single-hue dashboard. It works
because of restraint, not because of decoration. Three consequences drive every rule below:

1. **The owner approving a broker is the highest-stakes click in the product.** That
   screen has to read as trustworthy in under two seconds on a cheap phone. Trust here
   comes from clarity and hierarchy, not from badges, gradients, or colour.
2. **Users are on inexpensive Android phones over Indian mobile data, often 4G.**
   Every screen is designed at 360px first and adapted upward. A three-column desktop
   dashboard is a desktop enhancement, never the starting layout.
3. **Property photos are user-uploaded and inconsistent.** The visual system must hold
   up when the photo is dark, blurry, portrait, or missing entirely. Photos are content,
   never part of the palette.

---

## 1. Colour

### 1.1 The rule

One hue family (green) at three depths, one warm neutral family, and three reserved
signal colours. Nothing else. No blue, no purple, no second brand colour, ever.

Rough on-screen proportion, excluding photos:

| Band               | Share   | What                                              |
| ------------------ | ------- | ------------------------------------------------- |
| Warm neutral       | ~60–70% | Page canvas, card surfaces, body text             |
| Dark green / ink   | ~20%    | Primary buttons, attention cards, progress strip  |
| Mid green          | ~10%    | Prices, match scores, verified badges, active nav |
| Highlight + urgent | <5%     | One highlight per card maximum; urgency only      |

The 60-30-10 rule is the starting scaffold. The bright end runs tighter than 10% here
on purpose — a lime chip that appears twice on a screen means nothing.

### 1.2 Tokens

Neutrals are **warm**, never pure white or cool gray. This is the single biggest reason
the design does not read as a default shadcn scaffold. Do not replace `--color-canvas`
with `#FFFFFF` or a `gray-50`.

```
canvas          #EFEAE0   page background (warm cream)
surface         #FFFFFF   cards, sitting on canvas
surface-muted   #F7F4EE   inset strips inside a card
border          #E4DED2   hairline dividers, 1px
```

```
ink             #191C1A   primary text, near-black with a green cast
ink-muted       #86867E   secondary text, second line of a two-tone headline
ink-subtle      #A9A79D   captions, metadata, placeholder
```

```
brand-ink        #0B1F17   primary button fill (reads black, is green)
brand-deep       #0F3D2E   dark attention cards
brand            #1B7A5A   prices, match %, active state, links
brand-soft       #E3F2EA   badge and chip backgrounds
brand-soft-hover #D0E8DC   hover fill on brand-soft controls (same hue, one step deeper)
brand-text       #0B5A41   text sitting on brand-soft
```

```
stage-1         #7FD9B9   pipeline bar — New
stage-2         #2FAE85   pipeline bar — Contacted
stage-3         #0F6E56   pipeline bar — Site visit
stage-4         #04342C   pipeline bar — Negotiation

pipe-new        #334155   board column pill text — New (slate)
pipe-new-soft   #EEF2F6   board column pill / track — New
pipe-visit      #5B21B6   board column pill text — Site visit (violet)
pipe-visit-soft #F3E8FF   board column pill / track — Site visit
```

```
highlight       #C9F24D   lime. One per card, maximum. Never as text on cream.
highlight-ink   #1E3A05   text sitting on highlight
```

```
urgent          #C2410C   time pressure only
urgent-mid      #E8895A   icon/accent between urgent and urgent-soft
urgent-soft     #FBEBE0
pending         #92650A   wait state — in progress, no action required. Dark yellow.
danger          #B42318   destructive and reject actions only
danger-mid      #E2725F   icon/accent between danger and danger-soft
danger-soft     #FDECEA
success         #1B7A5A   confirms completion only — same value as `brand`
success-mid     #7BB89E   icon/accent between success and success-soft
success-soft    #E3F2EA   same value as `brand-soft`
```

### 1.3 Reserved meanings — do not dilute

`urgent` means **a deadline is approaching or has passed**. Representation request
expiring, RERA registration expiring, follow-up overdue, showing starting now. It never
appears on a heading, a border, an icon, or anything decorative. The moment it is used
for emphasis it stops carrying information.

`danger` means **this action destroys or denies something**. Reject a request, delete a
listing, remove a team member. It is a different colour from `urgent` because "your
deadline is close" and "you are about to reject this broker" are not the same message.

`highlight` marks **the one thing that matters most in a single card**. The current bar
in a chart, an open count, the currently active stage. Never two per card.

`success` means **this specific action just completed**. Representation approved, deal
closed, verification step done. It shares its hex value with `brand` on purpose — this
is not a fourth hue, it is a semantic alias so approval/completion moments stay
distinguishable in code and copy from routine brand usage (prices, active nav) without
adding a colour to the palette.

`pending` means **a process is in flight and the user cannot speed it up**. RERA
number submitted, waiting on verification. It is dark yellow so it does not steal
`urgent` orange. Never use it for a deadline.

`stage-1` … `stage-4` are **pipeline funnel fills only** — New → Contacted → Site
visit → Negotiation. They deepen within the brand green family. Do not use them
for buttons, badges, or any surface outside the pipeline bar / its legend.

`pipe-new` / `pipe-visit` (and their `-soft` fills) are **pipeline board column
pills and tracks only**. They exist so the four columns are distinguishable at
a glance (slate / amber / violet / emerald). Contacted reuses `urgent` +
`urgent-soft`; Negotiation reuses `brand-text` + `brand-soft`. Do not use
`pipe-*` on any other surface.

### 1.4 Contrast

- Body text meets 4.5:1 against its own surface. `ink-subtle` on `canvas` is the floor —
  do not go lighter.
- `highlight` is only ever used on `brand-deep`, `brand-ink`, or as a fill with
  `highlight-ink` on top. Lime text on cream fails contrast badly.
- Never encode meaning in colour alone. A verified broker gets a badge with the word
  "Verified" in it, not a green dot. A stalled request gets a label, not a red border.

---

## 2. Typography

### 2.1 Faces

| Role    | Face                     | Token            | Applies to                                                          |
| ------- | ------------------------ | ---------------- | ------------------------------------------------------------------- |
| Display | Bricolage Grotesque      | `--font-display` | `h1`–`h6`                                                           |
| Body    | DM Sans                  | `--font-sans`    | `p`, `span`, `a`, `li`, `label`, `button`, `input`, everything else |
| Data    | DM Sans, tabular figures | `.tabular`       | Prices, areas, dates, match %, table columns                        |

Load both through `next/font/google` in `app/layout.tsx` with `display: "swap"` and
variable font axes. Never load them via a `<link>` to Google's CDN — it costs a
round trip on 4G and blocks first paint.

```ts
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

const display = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

const sans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});
```

Numbers in prices, areas, and table columns use `font-variant-numeric: tabular-nums`
so a column of rupee figures aligns. Without this, `₹85 L` and `₹1.2 Cr` jitter against
each other in a list.

### 2.2 Scale

Two values per step: mobile first, then the desktop value after the `md:` breakpoint.

Each step is **one class** in `app/common.scss`. Apply that class plus a colour
utility (`text-ink`, `text-white`, `text-ink-muted`). Do not restack
`text-[28px] md:text-[40px] font-bold tracking-tight leading-[1.08]` — that is
what the class is for. Colour stays out of the class so the same step works on
cream and on `brand-deep`. `.eyebrow` is the exception: uppercase + `ink-muted`
are part of the pattern.

```tsx
<h1 className="h1 text-ink">12 requests. 3 waiting on you.</h1>
<p className="body text-ink-muted">Owners in your area are listing now.</p>
<p className="eyebrow">Next showing</p>
```

| Step             | Class        | Mobile | Desktop | Weight | Tracking | Leading |
| ---------------- | ------------ | ------ | ------- | ------ | -------- | ------- |
| Display 1        | `.display-1` | 44px   | 72px    | 700    | -0.03em  | 1.0     |
| Display 2        | `.display-2` | 38px   | 60px    | 700    | -0.03em  | 1.0     |
| Display 3        | `.display-3` | 32px   | 48px    | 700    | -0.02em  | 1.02    |
| h1               | `.h1`        | 28px   | 40px    | 700    | -0.02em  | 1.08    |
| h2               | `.h2`        | 24px   | 34px    | 600    | -0.02em  | 1.15    |
| h3               | `.h3`        | 22px   | 28px    | 600    | -0.01em  | 1.2     |
| h4               | `.h4`        | 20px   | 24px    | 600    | -0.01em  | 1.25    |
| h5               | `.h5`        | 18px   | 22px    | 600    | 0        | 1.3     |
| h6               | `.h6`        | 16px   | 20px    | 600    | 0        | 1.35    |
| Body large       | `.body-lg`   | 16px   | 18px    | 400    | 0        | 1.55    |
| Body             | `.body`      | 14px   | 16px    | 400    | 0        | 1.55    |
| Body small       | `.body-sm`   | 12px   | 14px    | 400    | 0        | 1.45    |
| Body extra small | `.body-xs`   | 12px   | 12px    | 400    | 0        | 1.4     |
| Eyebrow          | `.eyebrow`   | 12px   | 12px    | 600    | 0.1em    | 1.2     |

Tight tracking on display sizes is not optional — it is what makes Bricolage Grotesque
look intentional rather than default. Loose tracking at 52px reads as a fallback font.

Headings never go below 20px desktop (h6 floor) — that floor is what keeps a heading
reading as a heading rather than body copy. Body never goes above 18px desktop (Body
large ceiling) for the same reason in reverse. The two scales are read by face and
weight first, size second — h5/h6 stay display face + 600 weight even where their size
sits close to a body step's.

Eyebrow labels are uppercase, `ink-muted`, and sit directly above the value they
describe: `NEXT SHOWING`, `LOOKING FOR`, `NEEDS ATTENTION`. This is the only place
uppercase is allowed. Everything else is sentence case, including buttons and headings.

### 2.3 The two-tone headline — the signature element

Every top-level screen opens with one headline split across two colours at the same
size and weight. The first clause states the fact; the second states what it means.

```tsx
<h1 className="h1">
    <span className="text-ink">34 properties.</span> <span className="text-ink-muted">₹24.8 Cr on the market.</span>
</h1>
```

This carries the hierarchy of the whole page for zero colour cost, which is why the
rest of the screen can stay quiet. Use it on the dashboard, browse, my properties,
my brokers, and site visits.

Both clauses end with a full stop. That is deliberate and consistent across screens.
Write real content into it — `12 requests. 3 waiting on you.` beats
`Welcome back, Rajesh.` because it tells the user what to do next.

---

## 3. Space, radius, and elevation

### 3.1 Spacing

8pt grid. Only these values: `4 8 12 16 20 24 32 40 48 64`. Tailwind's `p-1 p-2 p-3
p-4 p-5 p-6 p-8 p-10 p-12 p-16` cover all of them. Never write an arbitrary value
like `p-[13px]`.

- Card padding: 16px mobile, 20px desktop
- Gap between cards: 12px mobile, 16px desktop
- Gap between page sections: 24px mobile, 32px desktop
- Gap between a label and its value: 4px
- Gap between related rows: 12px

### 3.1a Control height

One height scale drives every interactive control — button, input, select
trigger, and anything else that sits in a form row. Five steps, `xs`→`xl`,
`calc(var(--spacing) * n)` off Tailwind's base unit so they stay on the 4px
grid:

```
--size-control-xs   24px   dense icon-only controls (icon-xs button)
--size-control-sm   32px   dense contexts — filters, tables, toolbars
--size-control-md   36px   default — most buttons and form fields
--size-control-lg   44px   desktop tap-target minimum
--size-control-xl   48px   mobile tap-target minimum — primary mobile actions/forms
```

Applied via `block-control-{step}` / `inline-control-{step}` (logical-property
utilities Tailwind generates from the `--size-control-*` tokens in
`app/globals.css`). Never a bare `block-9` or an arbitrary height on a control
— use the step name, so button, input, and select trigger stay the same
height at the same step without coordinating by hand. New form controls
(select trigger, textarea, checkbox/radio hit area) consume this same scale
instead of inventing their own heights.

### 3.2 Radius

The design uses compact, conventional rounded rectangles. Radius supports grouping and
touch affordance without making every surface look soft or capsule-shaped.

```
--radius-card    16px   cards, photo containers, dialogs, floating panels
--radius-inner   12px   inset strips, menu items, images inside cards
--radius-control 12px   buttons, inputs, selects, tabs, segmented controls
```

Badges use `rounded-md` (9px). Checkboxes use `rounded-sm` (6px). Controls use
`rounded-control` (12px); cards and overlays use `rounded-card` (16px). `rounded-full`
is reserved for genuinely circular geometry such as avatars, radio indicators, status
dots, and switch thumbs. It is not the default for buttons, badges, filters, or tabs.

Never apply a radius to a single-sided border. If a row uses `border-l` as an accent,
its radius is 0.

### 3.3 Elevation

Separation comes primarily from surface contrast: white cards on warm cream canvas,
dark panels against both. Shadows are a secondary, sparingly-used signal on top of
that contrast, never a replacement for it — the canvas staying off-white is still
what keeps card boundaries legible.

Five smooth elevation steps, ink-tinted (never pure black) and layered — a tight
near shadow plus a soft diffuse one, both at low opacity so they read as depth, not
as a drop shadow:

```
--shadow-xs   0 1px 2px -1px ink/6%                                    inputs, chips
--shadow-sm   0 1px 2px -1px ink/5%,  0 3px 8px -2px  ink/6%           resting card
--shadow-md   0 2px 4px -2px ink/5%,  0 8px 16px -4px ink/8%           raised card, hover
--shadow-lg   0 4px 8px -4px ink/6%,  0 16px 32px -8px ink/10%         dropdowns, popovers
--shadow-xl   0 8px 16px -6px ink/8%, 0 28px 56px -12px ink/14%        modals, sheets
```

Default resting cards use `shadow-sm` or no shadow at all — reach for `md` only on
hover/press feedback, `lg`/`xl` only for content that floats above the page (menus,
popovers, dialogs). Dark attention cards (`brand-deep`, `brand-ink`) never carry a
shadow; they already separate through fill contrast.

The focus ring remains the one non-elevation `box-shadow`:
`0 0 0 2px var(--color-canvas), 0 0 0 4px var(--color-brand)`.

Borders are 1px `border`. A card may combine a hairline border with a shadow when it
sits on `surface` rather than `canvas`, but never stack more than one shadow step at once.

---

## 4. Component patterns

### 4.1 Card

White surface, 16px radius, no shadow. Optional eyebrow at top-left, optional status
badge at top-right, then content.

```
┌──────────────────────────────┐
│ ● NEXT SHOWING    [Confirmed]│  brand mark · eyebrow ink-muted · badge brand-soft
│                              │
│ Today, 9:30 AM               │  h2, ink
│ Vesu · meet at the gate      │  small, ink-muted
│                              │
│ [Directions]  [Reschedule]   │  primary action · secondary action
└──────────────────────────────┘
```

### 4.2 Dark attention card

`brand-deep` or `brand-ink` background, same 16px radius, light text. Reserved for
the one thing on the screen that needs action: pending requests, overdue follow-ups,
expiring listings.

**Maximum two per screen.** If everything is dark, nothing is urgent. On mobile, at
most one, and it sits above the fold.

Text on dark: headings at `#FFFFFF`, body at `#B8CFC4`, the count or metric in
`highlight`.

### 4.3 Buttons

| Variant           | Fill                         | Text            | Use                                                                                                                                                         |
| ----------------- | ---------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary           | `brand-ink`                  | white           | One per screen. Request to represent, Approve, Add property                                                                                                 |
| Accent            | `brand`                      | `canvas`        | One per screen, marketing/hero CTAs only. Not for in-app screens — `Primary` owns those                                                                     |
| Highlight         | `highlight`                  | `highlight-ink` | Dark surfaces only (`brand-deep`/`brand-ink` cards). One per screen, max — the one action that leads on a dark attention card. Never on `canvas`/`surface`. |
| Highlight outline | transparent, 1px `highlight` | `highlight-ink` | Same dark-surface restriction as Highlight, lower emphasis.                                                                                                 |
| Secondary         | transparent, 1px `border`    | `ink`           | Reschedule, Cancel, Map view                                                                                                                                |
| Surface           | `surface`, 1px `border-warm`, `shadow-sm` | `ink` | White fill on canvas. Filter chips and quiet contained actions. Hover keeps the white fill and darkens the border so it does not blend into `canvas`. |
| Destructive       | transparent, 1px `danger`    | `danger`        | Reject, Delete                                                                                                                                              |
| Ghost             | none                         | `ink-muted`     | Tertiary, inside cards                                                                                                                                      |

`brand-soft` fills hover to `brand-soft-hover` — one step deeper in the same green, never a different hue.

All use the standard 12px control radius. Height comes from the control-height scale (§3.1a):
`xs`/`sm`/`default`/`md`/`lg` map to `control-xs`/`control-sm`/`control-md`/
`control-lg`/`control-xl`. Icon sizes follow the same steps (`icon-xs` through
`icon-lg`). Button `lg` and input `lg` are the same height — never mix steps in
one form row. `md` (44px) is the desktop tap-target; `lg` (48px) is the mobile
tap-target floor, so use it on primary mobile actions. Minimum horizontal
padding 20px. Label is sentence case, verb first, one to three words, no
terminal punctuation.

**Loading state** uses the `loading` prop on `components/ui/button.tsx`. The spinner is
`Tailspin` from `ldrs/react` (`import { Tailspin } from 'ldrs/react'`), `size="16"
stroke="2" speed="0.9" color="currentColor"`, so it inherits the button's text colour
in every variant. Never a hand-rolled SVG spinner, never a different loader component —
one spinner, one place, `components/ui/button.tsx`. `loading` disables the control, sets
`aria-busy`, and keeps the label on screen next to the spinner — it never replaces the
label with the spinner alone.

### 4.4 Badges and chips

Soft background plus the matching dark text from the same family. Never white text
on a soft fill, never `ink` on a coloured fill.

| Meaning                    | Background      | Text         |
| -------------------------- | --------------- | ------------ |
| Verified, approved, active | `brand-soft`    | `brand-text` |
| Expiring, overdue, due now | `urgent-soft`   | `urgent`     |
| Rejected, inactive         | `danger-soft`   | `danger`     |
| Neutral status, filters    | `surface-muted` | `ink-muted`  |

12px, weight 500, `4px 10px` padding, 9px radius.

### 4.5 Property card

Photo leads. Full-bleed at the top of the card with the card's own radius on the
top corners, 4:3 aspect ratio, `object-cover`.

```
┌──────────────────────────────┐
│ [Active]                 [♡] │  compact overlay controls on photo
│                              │
│         photo 4:3            │
│                              │
├──────────────────────────────┤
│ 3 BHK · Vesu        ₹85 L    │  ink / brand, tabular, right-aligned
│ 1,450 sq ft · Semi-furnished │  small, ink-muted
│ 📍 Surat                     │
│ ─────────────────────────    │
│ 2 requests · listed 4d ago   │  small, ink-subtle
└──────────────────────────────┘
```

Price is `brand`, tabular figures, right-aligned on the same baseline as the title.

**Missing photo is a designed state, not a broken one.** Render a `surface-muted`
block at the same 4:3 ratio containing a prompt: `Add photos — listings with photos
get 5× more interest`. Never a gray box, never a broken image icon.

### 4.6 Metric strip

Inset `surface-muted` row inside a card, 12px radius, two to three columns divided by
1px `border`. Label above at 11px `ink-subtle`, value below at 16px `ink`, tabular.
Used for loan breakdowns, property stats, deal summaries.

### 4.7 Stage / progress strip

Full-width `brand-deep` bar, 12px radius, showing pipeline position. Completed stages
carry a `brand` dot and white label; the current stage carries a `highlight` dot and
white label; future stages are `#7E9A8D` with no dot.

On mobile this becomes horizontally scrollable stage tabs, not a compressed bar.

### 4.8 Empty states

An invitation, never an apology. Headline naming the space, one line of body, one
primary button.

- Owner, no properties: **Add your first property** · Takes about two minutes. · `[Add property]`
- Broker, no represented properties: **Browse available properties** · Owners in your area are listing now. · `[Browse properties]`
- Owner, no requests: **No broker requests yet** · Requests appear here when a broker wants to represent your property.

Never `Nothing here yet.` Never an illustration.

### 4.9 Logo

The mark is a house with a plus cut out of the centre. One path, one fill,
`currentColor`. Colour comes from the surface it sits on. The plus is negative
space, not a second colour.

| Surface                    | Fill        | Use                                                |
| -------------------------- | ----------- | -------------------------------------------------- |
| `canvas`                   | `brand-ink` | Default. Headers, auth, wordmark.                  |
| `surface`                  | `ink`       | On white cards, matching body text.                |
| `canvas`                   | `brand`     | Active state. Same green as prices and nav.        |
| `brand-deep` / `brand-ink` | `canvas`    | Inverse on dark attention cards. Cream, not white. |
| `brand-deep` / `brand-ink` | `highlight` | App icon, splash. Lime never sits on cream.        |
| `brand-soft`               | `brand-ink` | Quiet chip. Profile, settings header.              |

Never `urgent` or `danger` on the mark. Those colours mean a deadline or a
destroy. Never rotate, outline, add a drop shadow, or sit it on a gradient.

Source files live in `public/logo/`. In the app, use `Logo` from
`components/shared/logo.tsx`. Switch colour with the `variant` prop:

| `variant` | Mark        | Wordmark | Surface                         |
| --------- | ----------- | -------- | ------------------------------- |
| `default` | `brand-ink` | `ink`    | Light chrome, headers, auth     |
| `inverse` | `canvas`    | `canvas` | Dark chrome, quiet              |
| `accent`  | `highlight` | white    | Dark chrome, the one that leads |

```tsx
<Logo />
<Logo variant="inverse" />
<Logo variant="accent" />
```

Minimum size 32px; below that the plus collapses. The product name is a
placeholder and lives in `config/site.ts` only.

### 4.10 Input

One base-ui primitive, wrapped once in `components/ui/input.tsx`. Five
sizes (`xs` / `sm` / `default` / `md` / `lg`) off the same control-height
scale as buttons (§3.1a) — `control-xs` / `control-sm` / `control-md` /
`control-lg` / `control-xl`. Input `md`/`lg` and button `md`/`lg` share
those heights — `md` is the desktop tap-target, `lg` is the
primary-mobile-form size — an optional icon in either end slot, and
error/success/loading states that share one wiring instead of three.

```
┌──────────────────────────────┐
│ 🔍  Search locality       ✕  │  start icon · value · clear
├──────────────────────────────┤
│ ✉️  you@example.com       ✓  │  success — data-success, brand border
├──────────────────────────────┤
│ 👤  Broker name          ◌   │  loading — Tailspin in the end slot
├──────────────────────────────┤
│    395                    ⚠  │  error — danger border + ring
│ PIN code must be 6 digits    │  message region, danger text
└──────────────────────────────┘
```

Standard control radius (`rounded-control`), 2px `border-warm`, `surface` fill. Rest state
carries no shadow — `shadow-xs` is reserved for the rare case an input sits
directly on `canvas` rather than inside a card that already separates it.

**Icon slots.** `startIcon` and `endIcon` accept a Lucide icon component.
Only one thing occupies the end
slot at a time — `loading`, `success`, `clearable`, and `type="password"`
each claim it automatically, in that priority order, ahead of a plain
`endIcon`. Never render two end affordances at once.

**Error and success** are driven the same way `aria-invalid` already worked
on the bare shadcn primitive: pass `errorText` (a string, not a boolean) and
the border, focus ring, inline alert glyph, and the message region below the
field all switch together. `success` sets `data-success` and a `brand`
border plus a checkmark in the end slot — it is suppressed whenever the
field is also invalid, so a field never shows both signals. Success reuses
the existing `brand` token (the same green that marks "verified" elsewhere
per §1.3) rather than introducing a new colour.

**Loading** disables the field, sets `aria-busy`, and swaps the end slot for
the same `Tailspin` spinner as `components/ui/button.tsx` (`size="16"
stroke="2" speed="0.9" color="currentColor"`) — one spinner, one place,
never a second loader component.

**Helper and error text** live in one region below the field and swap in
place via `t-text-swap` (blurred rise, `--text-swap-dur`). The field
itself shakes once on the rising edge of `aria-invalid` (`t-input`
`.is-shaking`). Empty messages unmount with no height tween. Error text
also gets `role="alert"` so it's announced without the user having to
find it. While `loading`, helper copy uses `t-shimmer` so the in-progress
label stays alive without a second spinner.

**Password fields** get a reveal toggle in the end slot automatically —
`type="password"` is enough, no extra prop. **Clearable** fields
(`clearable`) get a `✕` once they have a value; both toggles are
`tabIndex={-1}` so they never enter the regular tab order ahead of the
field's own value.

Placeholder text is `ink-subtle`, sentence case, describes what to enter
(`Search locality`) rather than repeating a visible label (`Locality`).

### 4.11 Select

One base-ui primitive, wrapped once in `components/ui/select.tsx`. Compound
API: `Select` / `SelectTrigger` / `SelectValue` / `SelectContent` /
`SelectItem` (plus optional `SelectGroup`, `SelectLabel`, `SelectSeparator`).
The trigger uses the same five control-height steps, `rounded-control`, 2px
`border-warm`, and `surface` fill as Input (§4.10). Default trigger is 36px
(`control-md`); `lg` is 48px for primary mobile forms sitting next to an
Input of the same size.

```
┌──────────────────────────────┐
│ 📍  Vesu                  ▾  │  start icon · value · chevron
├──────────────────────────────┤
│ 🏢  Choose type           ▾  │  placeholder is ink-subtle
├──────────────────────────────┤
│ 📍  Adajan                ◌  │  loading — Tailspin replaces chevron
├──────────────────────────────┤
│    Choose a locality      ▾  │  error — danger border + ring
│ Choose a locality to continue│  message region, danger text
└──────────────────────────────┘
```

**Chevron owns the end slot.** `startIcon` is optional. `loading` disables
the trigger, sets `aria-busy`, and swaps the chevron for the same Tailspin
as Input and Button. Never add a second end icon.

**Error and success** on `SelectTrigger`: pass `errorText` and the border,
focus ring, shake, and message region switch together. `success` sets
`data-success` and a `success-mid` border; it is suppressed when the field
is also invalid.

**Popup** is `bg-surface`, `rounded-card`, `shadow-lg`, origin-aware via
`t-dropdown`. Highlighted items use `brand-soft` / `brand-text`. Never a
dark glass overlay. Keep the list as this compound select — do not flatten
to a native `<select>`.

### 4.12 Switch

One base-ui primitive, wrapped once in `components/ui/switch.tsx`. Binary
on/off preference — never a third state, never a substitute for radio when
there are three or more exclusive options.

```
┌──────────────────────────────────────┐
│ SMS alerts                      (●─) │  label + hint · switch on the end
│ Site-visit reminders                 │
└──────────────────────────────────────┘
```

Two sizes: `sm` (dense filter rows) and `default` (preference rows). Track is
`rounded-full`. Checked fill is `brand` (pass brand utility classes at the
call site so it matches Checkbox/Radio). Unchecked track uses a warm neutral
border/fill, not a second brand colour.

Always pair with a visible label (`htmlFor`/`id` or a wrapping `<label>`).
Label sits on the start side; the control sits on the end. Disabled keeps the
current checked value visible — do not clear it. Thumb motion uses the
instant duration token; never a bouncy spring.

**Icon segmented toggle** (grid/list in screenshot) is not this control. Use
`components/shared/icon-segmented-toggle.tsx`: white pill, `border-warm`,
`p-1`, icon-only segments, active segment gets sliding `brand-soft` fill +
`border-brand`. `aria-pressed` per button; `role="group"` + `aria-label` on
the shell. Owner listings view toggle is the reference call site.

**Text segmented toggle** — same sliding highlight, text labels (Sale / Rent).
`components/shared/text-segmented-toggle.tsx`. Default: outer + active
segment `rounded-full`, equal-width segments. `size="sm"`: compact
`rounded-control` variant on property cards. Not for long option lists — use
radio option cards or a select.

### 4.13 Radio

base-ui Radio + RadioGroup, wrapped once in `components/ui/radio-group.tsx`.
Compound API only: `RadioGroup` owns the value, `RadioGroupItem` is the
16px circle. One exclusive choice from a short set.

```
┌─────────────────┐  ┌─────────────────┐
│ ◉  For sale     │  │ ○  For rent     │  option cards — whole tile tappable
│ Owner wants…    │  │ Owner wants…    │  selected: brand border + brand-soft fill
└─────────────────┘  └─────────────────┘
```

Three layouts, same primitive:

| Layout       | When                                                         |
| ------------ | ------------------------------------------------------------ |
| Stack        | Short account-type / role lists                              |
| Grid         | 2–4 columns — furnishing, looking-for, deal extras           |
| Option cards | Default on property forms — label wraps the item, 48px tall |

Checked indicator fill is `brand`. Selected cards use `border-brand` +
`bg-brand-soft` + `text-brand-text`. Hover only shifts the border — no soft
fill until selected. Put `aria-invalid` on the group when a
required choice is empty — not on every item. Circle geometry stays
`rounded-full`; never restyle a radio into a checkbox look. Multi-select is
Checkbox; binary on/off is Switch.

### 4.14 Tooltip

base-ui Tooltip, wrapped once in `components/ui/tooltip.tsx`. Short
hover/focus hint for icon-only controls and truncated labels — never the only
label for a primary action.

```
┌────┐
│ 🔔 │ ← hover/focus
└────┘
   ▼
┌──────────────────────────┐
│ Send the owner a reminder│  body-xs · border-warm · shadow-sm
└──────────────────────────┘
```

Compound API: optional `TooltipProvider` on a tree, then `Tooltip` +
`TooltipTrigger` + `TooltipContent`. Default side is `top` with an 8px gap;
open delay 80ms (intent), close immediate. Motion is `.t-tooltip` in
`app/transitions-dev.css` — fade + scale, faster on leave.

Copy stays short and plain (no full stop on a fragment). Keyboard shortcut
hints use `ShortcutTooltip` from `components/shared/shortcut-tooltip.tsx` (or
`Kbd` / `KbdGroup` inside content) so keys match the registry in
`docs/SHORTCUTS.md`. Prefer a visible label on mobile — tooltips assist
desktop, they do not replace affordance.

### 4.15 Tabs

base-ui Tabs, wrapped once in `components/ui/tabs.tsx`. Peer views and section
chrome — not binary form choices (those are `TextSegmentedToggle` /
`IconSegmentedToggle`).

```
┌─────────────────────────────┐
│ [ Full details ] Quick add  │  surface-muted track · surface active pill
└─────────────────────────────┘
```

Compound API: `Tabs` + `TabsList` + `TabsTrigger` (+ `TabsContent` when a panel
is needed). Default list is a pill track: `bg-surface-muted`,
`rounded-control`, active trigger `bg-surface` + `shadow-sm`. Line variant uses
an underline indicator for quieter chrome.

Sliding filter bars (design-system nav, notification filters) use `.t-tabs` /
`.t-tabs-pill` in `app/transitions-dev.css` — JS measures the active tab;
CSS tweens width and translate. Prefer two or three tabs. Stage rows on mobile
scroll horizontally with count badges; they do not compress into a crowded bar.
Minimum tap target 44px.

---

## 5. Layout

### 5.1 Mobile is the design, desktop is the adaptation

Every screen is composed at 360px as a single scrolling column, then widened. Do not
design a three-column grid and try to stack it afterwards — the priority order comes
out wrong every time.

Order on mobile is strict priority order: what the user must act on sits above the
fold. On the owner dashboard that is pending representation requests. On the broker
dashboard it is today's site visits.

### 5.2 Breakpoints

|         | Width      | Columns | Nav                 |
| ------- | ---------- | ------- | ------------------- |
| Mobile  | <768px     | 1       | Bottom bar, 5 items |
| Tablet  | 768–1023px | 2       | Bottom bar          |
| Desktop | ≥1024px    | 3       | Top bar             |

Content max-width 1280px, centred, 16px page gutter on mobile and 32px on desktop.

### 5.3 Bottom navigation

Five items, fixed, `surface` background with a top `border`. Home · Properties ·
Clients · Visits · Profile. Active item is `brand`; inactive is `ink-subtle`. Icon
above a 11px label. Height 56px plus `env(safe-area-inset-bottom)`.

Owners and brokers get different middle items. The bar itself never changes shape
between roles.

### 5.4 Pipeline on mobile

A six-column drag board does not fit a phone. On mobile the pipeline is horizontally
scrollable stage tabs with a count badge, a vertical list of client cards below, and
a **Move to next stage** button on each card. Kanban with drag-and-drop is desktop only.

### 5.5 Loading

Skeletons matching the real layout — a card skeleton with a photo block and two text
bars, not a spinner and not a blank screen. Skeleton fill is `surface-muted` with a
subtle pulse, wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## 6. India formatting

These are display rules and are non-negotiable — a price rendered as `4500000` is a
bug, not a style preference.

| Thing                  | Format                        | Example           |
| ---------------------- | ----------------------------- | ----------------- |
| Price ≥ 1 crore        | `₹X.XX Cr`                    | `₹1.25 Cr`        |
| Price 1 lakh – 1 crore | `₹XX L`                       | `₹85 L`           |
| Price < 1 lakh (rent)  | `₹XX,XXX` Indian grouping     | `₹45,000`         |
| Rent                   | append `/mo`                  | `₹45,000/mo`      |
| Area                   | `X,XXX sq ft` Indian grouping | `1,450 sq ft`     |
| Date                   | `dd/mm/yyyy`                  | `18/08/2026`      |
| Date, conversational   | `18 Aug` or `Today, 9:30 AM`  |                   |
| Phone                  | `+91 XXXXX XXXXX`             | `+91 98765 43210` |
| PIN code               | 6 digits, no space            | `395007`          |
| Configuration          | `X BHK`, never `X bedroom`    | `3 BHK`           |

One rupee helper formats all of these. It lives in `lib/format.ts` and no component
formats currency inline.

Price inputs show the readable form beneath the field as the user types:
typing `8500000` displays `₹85 L` below it.

Locale for `Intl` calls is `en-IN`. Currency is `INR`. There is no `en-US` and no
`USD` anywhere in this codebase.

---

## 7. Language in the interface

Users are not technical and many are reading their second or third language. Plain
words, short sentences, sentence case everywhere.

| Do not write                           | Write                                               |
| -------------------------------------- | --------------------------------------------------- |
| Request to represent                   | Ask to sell this property                           |
| Representation approved                | You approved Rajesh                                 |
| Pending representations                | Brokers waiting for your answer                     |
| Submit                                 | Send request                                        |
| Error: failed to save                  | Couldn't save. Check your connection and try again. |
| Property listing created successfully! | Property added                                      |

No exclamation marks. No "please". No "simply", "just", or "easy". No first person —
the interface is the product speaking, not a person.

Actions keep the same name through the whole flow. A button that says **Approve**
produces a confirmation that says **Approved**, and a history entry that says
**Approved**.

---

## 8. Anti-patterns

Things that will be rejected in review:

- Pure white page background, or a cool gray canvas
- A second brand hue — blue links, purple charts, a teal badge
- A shadow that isn't one of the five ink-tinted `--shadow-*` tokens (no default browser
  shadow, no pure-black shadow, no shadow on a dark attention card)
- Stacking more than one shadow step on the same element
- Gradients anywhere, including on photo overlays
- Orange used decoratively rather than for a deadline
- Lime appearing more than once per card, or as text on a light surface
- `rounded-full` on a button, badge, filter chip, input, or tab without a documented circular purpose
- Title Case or ALL CAPS outside the eyebrow label
- Arbitrary spacing values (`p-[13px]`, `gap-[7px]`)
- Emoji in production UI
- A tap target under 48px on mobile
- Currency formatted with `en-US`, or the string `USA` anywhere
- A spinner where a skeleton belongs
- An input showing both an error and a success signal at once, or two end-slot
  affordances stacked (e.g. a clear button next to a loading spinner)
- An empty state that says "No data"
- Meaning carried by colour alone with no text label
- Desktop-first layouts that stack awkwardly instead of being composed mobile-first
