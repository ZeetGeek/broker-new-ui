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

One hue family (green) at three depths, one warm neutral family, and two reserved
signal colours. Nothing else. No blue, no purple, no second brand colour, ever.

Rough on-screen proportion, excluding photos:

| Band | Share | What |
|---|---|---|
| Warm neutral | ~60–70% | Page canvas, card surfaces, body text |
| Dark green / ink | ~20% | Primary buttons, attention cards, progress strip |
| Mid green | ~10% | Prices, match scores, verified badges, active nav |
| Highlight + urgent | <5% | One highlight per card maximum; urgency only |

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
brand-ink       #0B1F17   primary button fill (reads black, is green)
brand-deep      #0F3D2E   dark attention cards
brand           #1B7A5A   prices, match %, active state, links
brand-soft      #E3F2EA   badge and pill backgrounds
brand-text      #0B5A41   text sitting on brand-soft
```

```
highlight       #C9F24D   lime. One per card, maximum. Never as text on cream.
highlight-ink   #1E3A05   text sitting on highlight
```

```
urgent          #C2410C   time pressure only
urgent-soft     #FBEBE0
danger          #B42318   destructive and reject actions only
danger-soft     #FDECEA
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

| Role | Face | Token | Applies to |
|---|---|---|---|
| Display | Bricolage Grotesque | `--font-display` | `h1`–`h6` |
| Body | DM Sans | `--font-sans` | `p`, `span`, `a`, `li`, `label`, `button`, `input`, everything else |
| Data | DM Sans, tabular figures | `.tabular` | Prices, areas, dates, match %, table columns |

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

| Step | Mobile | Desktop | Weight | Tracking | Leading |
|---|---|---|---|---|---|
| Display | 32px | 52px | 700 | -0.03em | 1.02 |
| h1 | 28px | 40px | 700 | -0.02em | 1.08 |
| h2 | 22px | 28px | 600 | -0.02em | 1.15 |
| h3 | 18px | 20px | 600 | -0.01em | 1.25 |
| Body | 15px | 16px | 400 | 0 | 1.55 |
| Small | 13px | 13px | 400 | 0 | 1.45 |
| Eyebrow | 11px | 11px | 500 | 0.08em | 1.2 |

Tight tracking on display sizes is not optional — it is what makes Bricolage Grotesque
look intentional rather than default. Loose tracking at 52px reads as a fallback font.

Eyebrow labels are uppercase, `ink-subtle`, and sit directly above the value they
describe: `NEXT SHOWING`, `LOOKING FOR`, `NEEDS ATTENTION`. This is the only place
uppercase is allowed. Everything else is sentence case, including buttons and headings.

### 2.3 The two-tone headline — the signature element

Every top-level screen opens with one headline split across two colours at the same
size and weight. The first clause states the fact; the second states what it means.

```tsx
<h1 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight leading-[1.08]">
  <span className="text-ink">34 properties.</span>{" "}
  <span className="text-ink-muted">₹24.8 Cr on the market.</span>
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

### 3.2 Radius

The design is generously rounded. Sharp corners look wrong in it.

```
--radius-card    20px   cards, photo containers, dark panels
--radius-inner   14px   inset strips, images inside cards, inputs
--radius-control  9999px  buttons, badges, pills, filter chips, tabs
```

Buttons and badges are fully pill-shaped. Not `rounded-md`. Not `rounded-lg`.

Never apply a radius to a single-sided border. If a row uses `border-l` as an accent,
its radius is 0.

### 3.3 Elevation

**No shadows.** Not on cards, not on buttons, not on dropdowns.

Separation comes from surface contrast: white cards on warm cream canvas, dark panels
against both. This is why the canvas colour cannot become white — if it does, every
card boundary disappears and shadows have to be reintroduced to compensate.

The only permitted `box-shadow` is a focus ring:
`0 0 0 2px var(--color-canvas), 0 0 0 4px var(--color-brand)`.

Borders are 1px `border`. Cards may carry no border at all when the surface contrast
is doing the work; add one only where a card sits on `surface` rather than `canvas`.

---

## 4. Component patterns

### 4.1 Card

White surface, 20px radius, no shadow. Optional eyebrow at top-left, optional status
badge at top-right, then content.

```
┌──────────────────────────────┐
│ NEXT SHOWING      [Confirmed]│  eyebrow ink-subtle · badge brand-soft
│                              │
│ Today, 9:30 AM               │  h2, ink
│ Vesu · meet at the gate      │  small, ink-muted
│                              │
│ [Directions]  [Reschedule]   │  primary pill · secondary pill
└──────────────────────────────┘
```

### 4.2 Dark attention card

`brand-deep` or `brand-ink` background, same 20px radius, light text. Reserved for
the one thing on the screen that needs action: pending requests, overdue follow-ups,
expiring listings.

**Maximum two per screen.** If everything is dark, nothing is urgent. On mobile, at
most one, and it sits above the fold.

Text on dark: headings at `#FFFFFF`, body at `#B8CFC4`, the count or metric in
`highlight`.

### 4.3 Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| Primary | `brand-ink` | white | One per screen. Request to represent, Approve, Add property |
| Secondary | transparent, 1px `border` | `ink` | Reschedule, Cancel, Map view |
| Destructive | transparent, 1px `danger` | `danger` | Reject, Delete |
| Ghost | none | `ink-muted` | Tertiary, inside cards |

All are pill-shaped. Minimum height 44px on desktop, **48px on mobile**. Minimum
horizontal padding 20px. Label is sentence case, verb first, one to three words, no
terminal punctuation.

### 4.4 Badges and pills

Soft background plus the matching dark text from the same family. Never white text
on a soft fill, never `ink` on a coloured fill.

| Meaning | Background | Text |
|---|---|---|
| Verified, approved, active | `brand-soft` | `brand-text` |
| Expiring, overdue, due now | `urgent-soft` | `urgent` |
| Rejected, inactive | `danger-soft` | `danger` |
| Neutral status, filters | `surface-muted` | `ink-muted` |

12px, weight 500, `4px 10px` padding, pill radius.

### 4.5 Property card

Photo leads. Full-bleed at the top of the card with the card's own radius on the
top corners, 4:3 aspect ratio, `object-cover`.

```
┌──────────────────────────────┐
│ [Active]                 [♡] │  overlay pills on photo
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

Inset `surface-muted` row inside a card, 14px radius, two to three columns divided by
1px `border`. Label above at 11px `ink-subtle`, value below at 16px `ink`, tabular.
Used for loan breakdowns, property stats, deal summaries.

### 4.7 Stage / progress strip

Full-width `brand-deep` bar, pill radius, showing pipeline position. Completed stages
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

| | Width | Columns | Nav |
|---|---|---|---|
| Mobile | <768px | 1 | Bottom bar, 5 items |
| Tablet | 768–1023px | 2 | Bottom bar |
| Desktop | ≥1024px | 3 | Top bar |

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

| Thing | Format | Example |
|---|---|---|
| Price ≥ 1 crore | `₹X.XX Cr` | `₹1.25 Cr` |
| Price 1 lakh – 1 crore | `₹XX L` | `₹85 L` |
| Price < 1 lakh (rent) | `₹XX,XXX` Indian grouping | `₹45,000` |
| Rent | append `/mo` | `₹45,000/mo` |
| Area | `X,XXX sq ft` Indian grouping | `1,450 sq ft` |
| Date | `dd/mm/yyyy` | `18/08/2026` |
| Date, conversational | `18 Aug` or `Today, 9:30 AM` | |
| Phone | `+91 XXXXX XXXXX` | `+91 98765 43210` |
| PIN code | 6 digits, no space | `395007` |
| Configuration | `X BHK`, never `X bedroom` | `3 BHK` |

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

| Do not write | Write |
|---|---|
| Request to represent | Ask to sell this property |
| Representation approved | You approved Rajesh |
| Pending representations | Brokers waiting for your answer |
| Submit | Send request |
| Error: failed to save | Couldn't save. Check your connection and try again. |
| Property listing created successfully! | Property added |

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
- Shadows on cards or buttons
- Gradients anywhere, including on photo overlays
- Orange used decoratively rather than for a deadline
- Lime appearing more than once per card, or as text on a light surface
- `rounded-md` or `rounded-lg` on a button
- Title Case or ALL CAPS outside the eyebrow label
- Arbitrary spacing values (`p-[13px]`, `gap-[7px]`)
- Emoji in production UI
- A tap target under 48px on mobile
- Currency formatted with `en-US`, or the string `USA` anywhere
- A spinner where a skeleton belongs
- An empty state that says "No data"
- Meaning carried by colour alone with no text label
- Desktop-first layouts that stack awkwardly instead of being composed mobile-first
