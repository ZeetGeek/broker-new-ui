# Loading States & Feedback

Single source of truth for telling the user something is happening.
`.claude/rules/` and `.cursor/rules/` only point here.

---

## Why this matters more here than elsewhere

On a development laptop, loading states barely appear. On a ₹9,000 Android
phone on congested 4G in Surat, they are a **significant share of the actual
experience**. A screen that flashes blank for two seconds does not read as
"slow" to a non-technical user — it reads as **broken**, and their next move is
to tap again or close the app.

Every wait must answer three questions without the user having to think:

1. Is something happening?
2. Roughly what, and roughly how long?
3. Do I need to do anything?

---

## Pick by duration — the decision table

| Wait | Show | Why |
|---|---|---|
| < 100ms | **Nothing** | A spinner that flashes for 80ms makes the app feel *less* stable, not more |
| 100ms – 1s | Skeleton, or inline spinner on the control | Enough to register, short enough not to need words |
| 1s – 5s | Skeleton **+ message** | The user starts wondering; tell them what's happening |
| 5s – 10s | Skeleton + message + reassurance after 5s | "Still working…" prevents the second tap |
| > 10s, measurable | **Progress bar with real numbers** | Uploads. A percentage is the only honest answer |
| > 10s, unmeasurable | Message + explicit "this can take a minute" | Never leave an unbounded spinner |

The sub-100ms rule is the one people get wrong. Showing and instantly hiding an
indicator produces visual noise that feels like a glitch. Better to show
nothing.

---

## Skeleton vs spinner vs progress

| Use | When | Example here |
|---|---|---|
| **Skeleton** | You know the *shape* of what's coming | Property list, property detail, pipeline board, dashboard cards |
| **Spinner** | Small area, or shape unknown | Inside a button, inline next to a filter |
| **Progress bar** | You can measure completion | Photo upload |
| **Optimistic UI** | Action almost always succeeds and is cheap to reverse | Approve/reject, save property, move pipeline stage |
| **Nothing** | Under 100ms | Cached navigation |

**Default to skeletons for content areas.** They hold the layout stable, which
means no content jump when data arrives — so the skeleton doubles as CLS
protection. A centred spinner on a blank page gives up that benefit entirely.

**Never replace already-visible content with a spinner.** If the user is
looking at a list and changes a filter, dim the list or show a small inline
indicator. Wiping the screen throws away context they were reading.

---

## Next.js mechanics

### `loading.tsx` — the default for every route

Next automatically wraps `page.tsx` in a `<Suspense>` boundary. The fallback is
prefetched, so navigation feels immediate, shared layouts stay interactive, and
navigation stays interruptible — the user can change their mind mid-load.

```
app/broker/browse/
├── page.tsx
└── loading.tsx        ← skeleton for this route
```

It is a **Server Component by default**, so a skeleton costs zero client JS.
Keep it that way.

**Every route that fetches data gets a `loading.tsx`.** No exceptions. It is
the cheapest possible win.

### `<Suspense>` — for granular streaming

`loading.tsx` is route-level; `<Suspense>` is component-level. Use both. A slow
personalized query should block one section, never the whole page:

```tsx
<PropertyDetails id={id} />                {/* cached, instant */}
<Suspense fallback={<ContactSkeleton />}>
  <BrokerContact id={id} />                {/* streams in */}
</Suspense>
```

**⚠️ The `key` gotcha.** Without a `key`, changing a search param does not
re-trigger the loading state — the transition just goes laggy with stale
content on screen. On the browse page, where filters live in the URL, this
matters:

```tsx
<Suspense key={`${city}-${bhk}-${maxPrice}`} fallback={<PropertyListSkeleton />}>
  <PropertyList ... />
</Suspense>
```

### Navigation feedback

Navigation is usually fast enough to need nothing. When it isn't, `useLinkStatus`
gives a `pending` flag inside a `<Link>` — but treat it as a patch for a slow
transition, and fix the root cause with prefetching or a `loading.js` fallback.

The debounce technique from the Next docs is the right way to avoid flicker:
start the indicator invisible and give it an animation delay, so it only ever
appears if navigation exceeds the delay.

```css
.link-hint { opacity: 0; }
.link-hint.is-pending { animation: fade-in 150ms 100ms forwards; }
```

Note: there is also an experimental `useOffline` hook that keeps prefetched
routes navigable during connectivity drops. Given Indian mobile data, worth
watching — but experimental, so not a Phase 1 dependency.

---

## Forms and actions

```tsx
const [state, formAction, isPending] = useActionState(submitProperty, null);
```

- **`useActionState`** — pending flag plus the returned result, in one place
- **`useFormStatus`** — for a submit button that lives in a child component
- **`useOptimistic`** — instant feedback for actions that nearly always succeed

### Buttons

```tsx
<Button disabled={isPending}>
  {isPending ? <><Spinner className="mr-2" /> Saving…</> : "Save property"}
</Button>
```

Four rules:

1. **Disable while pending.** Double-submitting a representation request
   creates two rows.
2. **Keep the label.** Replacing text with a bare spinner loses the context of
   what is being waited on.
3. **Don't let the width jump.** Reserve space, or use a fixed min-width.
4. **Never disable without explanation.** A greyed-out button with no reason
   reads as broken.

### Optimistic UI — where it fits here

| Action | Optimistic? | Why |
|---|---|---|
| Approve / reject a broker request | ✅ | Near-always succeeds, trivially reversible |
| Save / shortlist a property | ✅ | Low stakes |
| Move a client to the next stage | ✅ | Local, reversible |
| Publish a property listing | ❌ | Too consequential to fake |
| Upload photos | ❌ | Genuinely slow — show real progress |

When an optimistic update fails, revert **and** say so. A silent revert is
worse than a spinner, because the user believes the action worked.

---

## Skeleton design rules

1. **Match the real layout exactly.** Same heights, same widths, same gaps. A
   skeleton whose dimensions differ from the real content causes a layout jump
   at the exact moment you were trying to prevent one.
2. **Match the expected count.** Six card skeletons for a six-item page. Three
   is confusing; twenty is a lie.
3. **Go easy on the shimmer.** An animated gradient across forty elements costs
   real paint work on a cheap Android. A subtle pulse is enough, and it must
   respect `prefers-reduced-motion`.
4. **Skeletons are Server Components.** No `"use client"`, no hooks, no JS cost.
5. **One skeleton per shape, colocated with the real component.**
   `property-card.tsx` and `property-card-skeleton.tsx` live side by side, so
   changing one prompts changing the other.

---

## Photo uploads — the one place progress is mandatory

Owner photos are 4–8 MB from a phone camera, uploaded over mobile data. This is
the longest wait in the entire product and the one most likely to be abandoned.

Requirements:

- **Real percentage**, not an indeterminate bar
- **Per-file progress and a total**: "Uploading photo 2 of 5 — 45%"
- **Thumbnail preview immediately**, before the upload finishes, from the local
  file. The user sees their photo instantly even though it is still uploading.
- **Per-file cancel**
- **Per-file failure**, with retry for that file only — never make someone
  re-upload four successful photos because the fifth failed
- **Warn on large files** before starting, since data costs money:
  "This photo is 7 MB. It may take a while on mobile data."
- **Never block the whole form.** The rest of the wizard stays usable while
  photos upload in the background.

---

## Message copy

Users are not technical, and the Phase 1 UI is English. Plain words, present
tense, no jargon.

| ❌ Don't write | ✅ Write |
|---|---|
| Loading… | Finding properties near you… |
| Fetching data | Getting your listings… |
| Processing request | Sending your request to the owner… |
| Submitting | Saving your property… |
| Please wait | Uploading photo 2 of 5 |
| Error: 500 | Something went wrong. Tap to try again. |
| Request failed | Couldn't send your request. Check your connection and try again. |
| No data | No properties yet — add your first one (2 minutes) |
| Timeout exceeded | This is taking longer than usual. Still trying… |

Rules:

- **Say what, not that.** "Finding properties" beats "Loading" every time.
- **Name the object.** "Saving your property," not "Saving."
- **Errors need a next action.** What happened, then what to do.
- **Never show a status code, stack trace, or endpoint** to a user.
- **After ~5 seconds, reassure.** "Still working…" stops the second tap.

---

## Four states, not one

Every data-driven view has four. Conflating them is the most common bug in this
category.

| State | Shows | Rule |
|---|---|---|
| **Loading** | Skeleton matching the real shape | Never blank |
| **Empty** | Icon + what this is + the next action | Must **teach**, never just say "No data" |
| **Error** | Plain explanation + retry button | Always offer a way forward |
| **Success** | The content | — |

Empty is not loading. A user who has genuinely never added a property should
see "Add your first property," not a skeleton that never resolves.

---

## Timeouts and poor connections

- **Never spin forever.** Time out at ~20–30s and fall to the error state with
  retry.
- **Detect offline** (`navigator.onLine` plus a failed request) and say so
  plainly: "You're offline. We'll retry when you're back."
- **Retry should be one tap**, not a page refresh.
- **Preserve form input across a failed submit.** Losing a half-finished
  property listing on a dropped connection is how someone stops using the app.

---

## Accessibility

- Live regions announce changes: `<div aria-live="polite">Loading properties</div>`
- `aria-busy="true"` on the region being loaded
- Decorative spinners get `aria-hidden="true"` — the live region carries the message
- All shimmer and pulse animations respect `prefers-reduced-motion`
- Focus must not be lost when content swaps in

---

## Never do

- ❌ A blank white screen while anything loads
- ❌ A spinner for a sub-100ms wait
- ❌ A full-page spinner replacing content the user is already reading
- ❌ An unbounded spinner with no timeout
- ❌ A disabled button with no visible reason
- ❌ A skeleton whose dimensions differ from the real content
- ❌ A `"use client"` skeleton
- ❌ A raw error code, stack trace, or endpoint shown to a user
- ❌ A silent optimistic revert
- ❌ An indeterminate bar for an upload whose progress you can measure
- ❌ Losing form input on a failed submit

---

## Before shipping a screen

- [ ] `loading.tsx` exists for this route
- [ ] `<Suspense>` around anything slow and personalized, with a `key` if it
      depends on search params
- [ ] Skeleton dimensions match the real content
- [ ] Every button has a pending state and is disabled while pending
- [ ] Empty state teaches the next action
- [ ] Error state explains in plain words and offers retry
- [ ] Messages name the object ("Finding properties," not "Loading")
- [ ] Tested on the real Android phone, on mobile data, with network throttled
