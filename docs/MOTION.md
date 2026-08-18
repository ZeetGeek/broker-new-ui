# Motion Rules

Single source of truth for animation and micro-interaction on this project.
`.claude/rules/` and `.cursor/rules/` only point here.

Library: **[Motion](https://motion.dev) (`motion/react`), latest major.** Not
`framer-motion` — that package is the predecessor; this project imports from
`motion/react`. If `framer-motion` appears anywhere, it is wrong and should be
migrated.

If the two disagree, this file is wrong and should be corrected to match
whatever `docs/DESIGN.md` says about surfaces, radius, and colour — motion
serves the design system, it does not set its own rules for those.

---

## Why this matters more here than on a typical web app

1. **Users are on cheap Android phones over Indian mobile data.** A busy
   low-end device drops frames long before a laptop does. Every animation
   here is judged first on whether it survives a ₹8,000 phone, not whether it
   looks good in a recording on a MacBook.
2. **The owner-approval screen is the highest-stakes click in the product.**
   Motion there must feel *certain* — a confirmed action should look
   confirmed. Playful bounce belongs on a badge, never on a consent action.
3. **This is a CRM, not a marketing site.** Brokers use this all day. Motion
   that is charming once and annoying on the 400th click is a net loss.
   Restraint beats delight at this usage frequency.

The governing instinct: **motion explains a state change that already
happened in the UI's logic.** It is never the thing that makes the UI feel
alive by itself. If you can't say what state change an animation is
communicating, cut it.

---

## 1. Tokens — define once, use everywhere

None of these exist in `app/globals.css` yet. Add them to `@theme` the first
time this file is implemented — do not inline duration or easing values in
components.

```css
@theme {
  /* durations */
  --duration-instant: 100ms;   /* toggles, checkboxes, tap feedback */
  --duration-fast: 160ms;      /* hover, focus ring, button press */
  --duration-base: 220ms;      /* card enter/exit, dropdown, sheet */
  --duration-slow: 320ms;      /* page-level transitions, modal */

  /* easing — cubic-bezier, not "ease-in-out" */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* entrances */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);        /* exits */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* moves, reorders */

  /* spring presets (Motion spring objects, not CSS) */
  --spring-snappy: { stiffness: 500, damping: 30 };  /* buttons, toggles */
  --spring-gentle: { stiffness: 260, damping: 26 };  /* cards, sheets */
  --spring-bouncy: { stiffness: 400, damping: 17 };  /* success states only */
}
```

Spring objects aren't valid CSS custom properties — the block above documents
intent. Put the real values in one TS file so both Motion and any manual
`transition` prop reference the same numbers:

```ts
// lib/motion/tokens.ts
export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 30 },
  gentle: { type: "spring", stiffness: 260, damping: 26 },
  bouncy: { type: "spring", stiffness: 400, damping: 17 },
} as const;

export const duration = {
  instant: 0.1,
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
} as const;
```

**Rule: no bare numbers in `transition={{ duration: 0.3 }}` inside a
component.** Import from `lib/motion/tokens.ts`. A magic `0.3` scattered
across forty components is how a codebase ends up with eleven different
"fast" speeds that all feel slightly different.

---

## 2. Defaults — what every interactive element gets, no exceptions

| Element | Rest → Hover | Rest → Active/Tap | Focus-visible |
|---|---|---|---|
| Primary button | `scale: 1 → 1.02`, `--duration-fast`, `ease-out` | `scale: 0.97`, `--duration-instant` | 2px ring, `brand`, no animation on the ring itself — it snaps in |
| Secondary/ghost button | background fade only, `--duration-fast` | `scale: 0.97` | same ring |
| Card (clickable) | `shadow-sm → shadow-md`, `y: 0 → -2px`, `--duration-fast` | `scale: 0.99` | ring on the card, not inside it |
| Icon button | background fade to `surface-muted`, `--duration-fast` | `scale: 0.9` | ring |
| Input / textarea | border colour fade to `ink-subtle`, `--duration-fast` | — | border colour fade to `brand`, ring, `--duration-fast` |
| Checkbox / switch | — | `spring.snappy` on the thumb/check position | ring |
| Nav item (bottom bar / sidebar) | icon `scale: 1 → 1.08` on the active one only | `scale: 0.95` | ring |
| Link (inline text) | underline fade in, `--duration-fast` | — | ring, 2px offset |

Rules that generalize the table:

- **Hover states use `--duration-fast` (160ms) and `ease-out`.** Never
  slower — a laggy hover reads as a slow website even when everything else
  is instant.
- **Tap/active states use `--duration-instant` (100ms).** The finger is
  already on the glass; feedback has to feel simultaneous, not animated.
- **Scale changes stay small: 0.97–1.02 for buttons, 0.9–0.95 for icon-only
  targets.** Anything larger reads as a layout shift, not a press.
- **Focus rings never animate their appearance.** They snap in at full
  opacity. A fading focus ring is invisible to a keyboard user for the exact
  duration that matters.
- **`shadow-sm` → `shadow-md` is the standard elevation change on hover for
  any card-like surface**, using the tokens already in `app/globals.css`.
  Do not invent a new shadow value per component.

---

## 3. Motion primitives — how to reach for Motion correctly

### 3.1 `animate` + `variants`, not ad-hoc inline objects on every element

```tsx
// lib/motion/variants.ts
import { duration, ease } from "./tokens";

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
};
```

```tsx
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion/variants";

<motion.div initial="hidden" animate="visible" variants={fadeUp}>
```

One shared `variants.ts` per feature (or in `lib/motion/` if used by 3+
features, per the usual promotion rule in `docs/STRUCTURE.md`) beats every
component hand-rolling its own `initial`/`animate` objects.

### 3.2 `layout` and `layoutId` for anything that reorders or resizes

Pipeline cards moving between Kanban stages, a filter chip list that
reflows, an accordion that expands — use `layout` on the `motion` element
instead of manually animating height/position. This is the actual reason to
reach for Motion instead of CSS transitions: CSS cannot animate a FLIP
reorder, Motion does it for free.

```tsx
<motion.div layout transition={{ type: "spring", ...spring.gentle }} />
```

Shared-element transitions (a property card expanding into a detail sheet)
use `layoutId` — same id on the collapsed and expanded element, Motion
interpolates the rest.

### 3.3 `AnimatePresence` for anything that unmounts

Any conditionally-rendered element that should animate *out* — a toast, a
validation error under a field, a removed pipeline card, a closed modal —
must be wrapped in `AnimatePresence` with an `exit` variant. Popping
something out of the DOM with no exit animation is the single most common
motion bug: it looks fine until you test the removal path.

```tsx
<AnimatePresence>
  {error && (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: duration.fast, ease: ease.inOut }}
    >
      {error}
    </motion.p>
  )}
</AnimatePresence>
```

### 3.4 `whileHover` / `whileTap` / `whileFocus` over manual state

Don't build hover animation with `useState` + `onMouseEnter`. Motion's
gesture props exist precisely so hover/tap/focus don't need component state:

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: duration.fast, ease: ease.out }}
/>
```

### 3.5 Stagger for lists, sparingly

Property cards or pipeline items entering together get a small stagger via
`staggerChildren` on the parent variant — **40–60ms per item, capped at
roughly 8 items.** Past that, stagger delay becomes perceptible lag, not
polish. A 40-item list on browse should not stagger at all; only the first
viewport's worth does.

```tsx
export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.05 } },
};
```

### 3.6 Scroll-triggered reveals: `useInView` (or `whileInView`), once

Marketing/landing sections may reveal on scroll. Portal screens (owner/
broker dashboards, CRM pipeline) generally should not — data the user
navigated to should be there immediately, not fade in as a performance.

If used, always `viewport={{ once: true }}`. Re-triggering an animation
every time a card scrolls back into view is the fastest way to make a page
feel janky and slow on a weak device.

---

## 4. Page and route transitions

- Route-level transitions are **optional and low priority.** This is a
  utility CRM used all day — a 300ms cross-fade on every navigation adds up
  to real friction across hundreds of daily navigations. Default to no
  page transition; instant navigation is a legitimate choice here.
- If added, keep it to opacity only (`--duration-base`, `ease-out`), never a
  slide/scale combo. Position changes on route transition read as
  disorienting on a phone-sized viewport.
- Never block interactivity while a page transition plays. The next screen
  must be tappable immediately even if it's still visually settling.

---

## 5. Accessibility and reduced motion — not optional

Wrap the app-level Motion config so `prefers-reduced-motion` degrades
animations to instant, not off-and-broken:

```tsx
// app/layout.tsx or a MotionConfig provider
import { MotionConfig } from "motion/react";

<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

`reducedMotion="user"` makes Motion automatically shorten every animation to
essentially zero duration for users with the OS setting on, without needing
per-component branches. Do not hand-roll `matchMedia` checks in individual
components — set this once at the root.

Additional rules:

- Focus rings, error states, and any animation that **carries information**
  (not just polish) must still be visible even at reduced motion — Motion
  handles this by collapsing duration, not opacity, so state is preserved.
- Never animate something whose *only* affordance is the animation itself
  (e.g., a "new" badge that only appears via a fade with nothing else
  marking it as new). Motion is a reinforcement layer, not the sole carrier
  of meaning.

---

## 6. Performance rules for low-end Android

This is the section that matters most for this product specifically.

1. **Animate `transform` and `opacity` only.** Never animate `width`,
   `height`, `top`/`left`, `box-shadow` colour stops, or anything that
   triggers layout/paint. Motion's `layout` prop already handles size/
   position changes via transforms under the hood — use it instead of
   hand-animating a dimension.
2. **No animated blur, no animated `backdrop-filter`.** Both are expensive
   on mid-range GPUs and this design has no glassmorphism in it anyway per
   `docs/DESIGN.md`.
3. **Cap simultaneous animating elements.** A staggered list of 8 cards is
   fine. Animating 40 property cards in on page load is not — page the list
   or skip entrance animation past the first screenful.
4. **Prefer CSS transitions over Motion for pure hover states with no
   layout/gesture/exit needs.** A simple `transition-colors` in Tailwind on
   a link hover doesn't need JS. Reach for Motion when you need spring
   physics, gesture composition (`whileTap` + `whileHover` combined),
   `layout` animation, or `AnimatePresence` — not for every hover effect on
   the site.
5. **`will-change` is not a default.** Only apply it to elements mid-
   animation (Motion manages this internally for its own animated
   properties) — never as a blanket CSS rule, which just burns GPU memory
   on cheap devices for no benefit.
6. **Test on throttled CPU.** Chrome DevTools → Performance → 4x/6x CPU
   slowdown before calling a new interaction done. If it stutters at 4x, it
   stutters on the actual target device.

---

## 7. Anti-patterns — do not do these

- ❌ Bouncy spring on anything except a genuine success/completion state
  (deal closed, request approved). Bounce on a checkbox or nav item reads
  as toy-like, not delightful.
- ❌ Animating in every single element on a dashboard on mount. Data
  screens should feel *present*, not performed. Reserve entrance animation
  for content that's genuinely new (a toast, a newly-added card after a
  user action) — not the whole page loading for the first time.
- ❌ Different easing curves for conceptually similar interactions. If two
  buttons feel different to press, that's a bug, not variety.
- ❌ Motion values inlined ad hoc (`transition={{ duration: 0.37 }}`)
  instead of the shared tokens in §1.
- ❌ `AnimatePresence`-wrapped element with no `exit` prop — it will pop
  instead of animating out, which is worse than not wrapping it at all.
- ❌ Scroll-triggered reveal on portal/dashboard screens (see §3.6) — that
  pattern belongs to marketing pages only.
- ❌ Using Motion for something CSS `:hover` and `transition-colors` already
  does for free. JS animation has a cost; don't pay it for a colour fade.
- ❌ A loading skeleton that animates faster or slower than
  `--duration-base` shimmer — inconsistent shimmer speed across the app is
  very noticeable even to non-technical users.

---

## 8. Quick reference

```
Button/control hover        → whileHover, scale 1.00–1.02, duration.fast, ease.out
Button/control press        → whileTap, scale 0.90–0.97, duration.instant
Card hover                  → shadow-sm → shadow-md + y:-2px, duration.fast
Focus ring                  → snap in, no animation, 2px, brand colour
List/card enter              → variants + fadeUp, staggerChildren 0.04–0.06, cap ~8
List/card reorder            → layout + spring.gentle
Conditional unmount           → AnimatePresence + exit variant, always
Route change                 → none by default; opacity-only if added
Reduced motion                → MotionConfig reducedMotion="user" at root, once
What never animates           → width/height/top/left directly, box-shadow color, blur
```

When genuinely unsure whether an interaction needs motion at all: it
probably doesn't. This is a working tool for brokers on a bad connection,
not a portfolio site. Add motion where it clarifies a state change: never
because a screen "feels flat" without it.
