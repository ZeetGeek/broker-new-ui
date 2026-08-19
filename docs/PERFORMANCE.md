# Performance Rules

Single source of truth for performance on this project. `.claude/rules/` and
`.cursor/rules/` only point here.

Target: **Next.js 16 (App Router, Turbopack)**.

---

## Why this matters more here than on a typical web app

Users are on **inexpensive Android phones over Indian mobile data**, often 4G
with real congestion, sometimes 3G. Many pay per GB. They are not on a MacBook
on office wifi, and the app must never be tested only that way.

Two consequences that drive every rule below:

1. **CPU is the bottleneck, not bandwidth.** A ₹9,000 Android phone parses and
   executes JavaScript roughly 5–10× slower than a development laptop. Shipping
   less JS matters more than shipping smaller JS.
2. **This is an image-heavy catalog that only grows.** Property photos are the
   product. They are also, by a wide margin, the largest thing on every page.
   Owner-uploaded photos come straight off phone cameras at 4–8 MB each.

---

## Performance budget

Treat these as build-blocking, not aspirational.

| Metric                           | Target                 | Measured on                        |
| -------------------------------- | ---------------------- | ---------------------------------- |
| LCP                              | ≤ 2.5s                 | Moto G-class Android, 4G throttled |
| INP                              | ≤ 200ms                | same                               |
| CLS                              | ≤ 0.1                  | same                               |
| Client JS on a listing page      | ≤ 150 KB gzipped       | —                                  |
| Largest property image delivered | ≤ 200 KB               | —                                  |
| Property list API response       | ≤ 50 KB per page of 20 | —                                  |

If a change pushes past a budget, it needs a stated reason, not a shrug.

---

## Rendering model — Next.js 16 Cache Components

This is the single biggest lever available, and it is **opt-in**.

Enable it:

```ts
// next.config.ts
const config: NextConfig = { cacheComponents: true };
```

What this changes: caching is no longer implicit. All dynamic code in any page,
layout, or API route executes at request time by default, and you choose what
to cache with the `use cache` directive at page, component, or function level.
Partial Prerendering comes with it — Next prerenders a static HTML shell served
immediately, while dynamic content streams in when ready.

**⚠️ If you enable this on an existing codebase, audit every data fetch.** It
reverses the previous default. Things that used to cache silently now hit the
network on every request.

### How to split a property page

This is the pattern PPR exists for. Do not render the whole page dynamically
just because one part of it is personalized.

```tsx
// app/property/[id]/page.tsx
export default async function Page({ params }) {
    const { id } = await params; // params is a Promise in Next 15+
    return (
        <>
            <PropertyDetails id={id} /> {/* cached — static shell */}
            <Suspense fallback={<ContactSkeleton />}>
                <BrokerContact id={id} /> {/* dynamic — streams in */}
            </Suspense>
        </>
    );
}
```

| Part of the page                                         | Treatment                    | Why                                         |
| -------------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| Photos, price, BHK, locality, description, amenities     | `use cache`                  | Changes rarely; identical for every visitor |
| Broker contact panel, "you already requested this" state | Dynamic, in `<Suspense>`     | Per-user                                    |
| View count, availability                                 | Dynamic or short `cacheLife` | Changes often                               |

The user sees photos and price in well under a second. The personalized strip
fills in after. Never block the whole page on the slow part.

### Cache lifetimes and invalidation

- `cacheLife` — how long the cache lives (seconds → `max`)
- `cacheTag` — tag cached data so it can be invalidated later
- `revalidateTag` — refresh when something actually changes

Rules for this project:

- Tag every cached property as `property:{id}`, and call `revalidateTag` in the
  owner's edit and delete actions. **Never** rely on a time-based expiry alone
  for property data — a stale price on a sold flat causes real phone calls to a
  real owner.
- Reference data that genuinely never changes within a session (locality lists,
  amenity lists, property types) can take a very long `cacheLife`. There is no
  reason to re-fetch a list of Surat localities every request.
- Never `use cache` anything scoped to a user. Broker client lists, owner
  contact details, and representation state are per-request, always.

### Keep filters in the URL

Encode search and filter state in the URL, not client state or dynamic APIs.
`/browse?city=surat&bhk=3&max=8000000` is shareable, back-button-correct, and
cacheable per-combination. Reaching for `headers()`, `cookies()`, or
`searchParams` inside a component opts that whole subtree out of the static
shell.

---

## The property list — where this platform will actually break

Assume 50 properties at launch and 50,000 later. Everything below is written
for the second number, because retrofitting it is far more expensive.

### Pagination

**Cursor-based only. Never `OFFSET`.**

`OFFSET 10000 LIMIT 20` makes Postgres walk and discard 10,000 rows on every
request. It degrades linearly and silently — fine in testing with 50
properties, unusable at 50,000. Cursor pagination (`WHERE created_at < $cursor
ORDER BY created_at DESC LIMIT 20`) stays flat. It also cannot skip or
duplicate rows when new listings are added mid-scroll, which offset can.

### Lean payloads

The list needs: id, one thumbnail, price, BHK, locality, type, status. That is
all. Do not return the full property object with all photos, all amenities, and
the full description just because the API happens to have them. A fat list
response is invisible in development and brutal on 4G.

### Virtualize long lists

Past roughly 100 cards in the DOM, scrolling stutters on a cheap Android. Use
`@tanstack/react-virtual` so only visible cards render. Combine with infinite
scroll via `IntersectionObserver` — never a "load more" button that appends
unboundedly to the DOM.

### Prefetch on intent

Next prefetches `<Link>` in the viewport by default. That is right for a short
list and wrong for a virtualized one — 200 prefetches will saturate a mobile
connection. Set `prefetch={false}` on virtualized cards and prefetch on hover
or touch-start instead.

---

## Images — the single largest cost on this platform

### Transcode on upload, not on request

Owner photos arrive at 4–8 MB from a phone camera. Handle it **once, at upload
time**, in a background job:

- Generate fixed derivatives: `thumb` (400w), `card` (800w), `full` (1600w)
- Output AVIF with a WebP fallback
- Strip EXIF — it carries GPS coordinates of someone's home, which is both a
  payload and a **privacy** problem
- Store derivatives on the CDN (Cloudflare R2 or similar) and serve them
  directly

Do **not** route user-uploaded images through Next's on-demand image optimizer
at scale. It turns every unique image request into server work, and the Image
Optimization API has been a documented DoS surface. Pre-generated derivatives
on a CDN are cheaper, faster, and cannot be abused.

Note that `next/image` in Next 16 shifted toward native browser features and
simpler defaults — re-check its options rather than assuming Next 14/15 habits
still apply.

### On the page

- The first property photo is almost always the LCP element. Mark it
  `priority`. Everything below the fold lazy-loads.
- Always pass explicit `width`/`height`, or `fill` with `sizes`. A missing
  dimension is a guaranteed CLS hit.
- `sizes` must reflect reality. `sizes="100vw"` on a card in a 3-column grid
  makes every phone download the desktop-sized file.
- Use a blur placeholder or a solid-colour box. Never let the layout jump when
  an image arrives.
- Listings with no photo still need a fixed-size placeholder, not a collapsed
  card.

---

## Client JavaScript discipline

Server Components are the default. A component becomes a Client Component only
when it genuinely needs state, an effect, or a browser API.

- **Push `"use client"` to the leaves.** Marking a page client-side drags its
  entire import tree into the bundle. A property card should be a Server
  Component with a small client "save" button inside it, not the reverse.
- **`next/dynamic` for anything heavy and not immediately visible**: map views,
  charts, image lightboxes, date pickers, rich text editors. A map library is
  often larger than the rest of the page combined.
- **Audit before adding a dependency.** Prefer `date-fns` over `moment`; prefer
  `Intl.NumberFormat` over a currency library; import individual `lodash-es`
  functions, never the whole package.
- **Long lists of icons** — import individually from `lucide-react`; never
  `import * as Icons`.

### React Compiler — measure, don't assume

React Compiler auto-memoizes at build time and removes most manual `useMemo`
and `useCallback`. Next 16 supports it and runs it selectively on files that
would benefit.

The catch: it uses **Babel, not SWC**, so enabling it adds a Babel pass to a
build pipeline that otherwise runs on SWC. Guidance in the field is to
benchmark before and after — if build time rises more than about 10–15%,
weigh that against the actual runtime gain for your traffic.

For this project: **not yet.** The app is small and has no measured re-render
problem. Revisit when the browse page has a real interaction cost.

---

## Data fetching

- **Parallel, not sequential.** Independent fetches go in `Promise.all`.
  Awaiting one before starting another creates a waterfall that is invisible
  locally and painful on a 200ms RTT mobile connection.
- **Fetch at the leaf that needs it**, wrapped in `<Suspense>`, so a slow query
  blocks one section instead of the page.
- **Debounce filter inputs** (~300ms). A keystroke-per-request search will melt
  the API and the user's data plan.
- **`use cache` and React Query solve different problems.** `use cache` is
  server-side data caching. React Query / SWR manage client cache state,
  optimistic updates, and refetch-on-focus. Do not reach for a client library
  to solve a server caching problem.
- **`after()`** for work that must not delay the response — analytics, logging,
  audit writes.

---

## Fonts, CSS, and third-party scripts

- `next/font` only. It self-hosts and eliminates the render-blocking round trip
  to Google Fonts. Never a `<link>` to fonts.google.com.
- One font family, at most two weights. Every extra weight is another file on a
  metered connection.
- Subset to `latin`. Add Devanagari or Gujarati only when the Hindi/regional UI
  actually ships.
- Third-party scripts via `next/script` with `strategy="lazyOnload"` unless
  there is a specific reason otherwise. Analytics must never block first paint.
- Be ruthless with tag managers and chat widgets. They are usually the single
  biggest third-party cost and rarely justify it pre-launch.

---

## `proxy.ts` (formerly `middleware.ts`)

Next 16 renamed `middleware.ts` to `proxy.ts`. It runs on the **Node.js
runtime only** — that is not configurable, and the Edge runtime is not
supported there. `middleware.ts` still works but is deprecated and slated for
removal.

Because it runs on **every matched request**, treat it as latency you pay
globally:

- Match narrowly with `config.matcher`. Never match `/:path*` by default.
- No database calls, no heavy crypto, no external HTTP.
- Auth checks belong in layouts and server components. `proxy.ts` should do
  cheap redirects, not become an authorization layer.

---

## Measuring — you cannot use the build output anymore

Next 16 **removed the `size` and First Load JS metrics from `next build`**,
having found them inaccurate in RSC architectures. Do not look for them.

Measure instead with:

1. **Chrome Lighthouse**, throttled to Slow 4G + 4× CPU slowdown. Never trust a
   desktop score.
2. **Real device.** A cheap Android on real mobile data, not an emulator. The
   `PRE_PHASE_CHECKLIST` already calls for buying one — this is what it is for.
3. **`web-vitals`** reporting field data, especially INP. Lab tools
   systematically underestimate INP because they do not tap.
4. **`@next/bundle-analyzer`** when a bundle grows unexpectedly.
5. **Next.js Devtools MCP** (new in 16) for in-editor debugging.

Development request logs in Next 16 now break down where time is spent
(compile vs render), and the build reports per-step timings. Read them.

---

## Never do

- ❌ `OFFSET` pagination on properties
- ❌ Full-size camera images served to a phone
- ❌ `"use client"` on a page or layout to "make it work"
- ❌ Fetching all properties then filtering in the browser
- ❌ Blocking the whole page on a slow personalized query instead of
  `<Suspense>`
- ❌ `use cache` on anything containing user or contact data
- ❌ Images without `width`/`height` or `fill` + `sizes`
- ❌ A `<link>` to Google Fonts
- ❌ Database queries in `proxy.ts`
- ❌ Judging performance from a desktop Lighthouse run
- ❌ Enabling React Compiler without benchmarking the build

---

## Before shipping a page

- [ ] Correct split: cached shell vs dynamic in `<Suspense>`
- [ ] Cached property data carries a `cacheTag`, and edit/delete revalidate it
- [ ] Lists are cursor-paginated and return a lean projection
- [ ] Lists past ~100 items are virtualized
- [ ] LCP image has `priority`; all images have dimensions and honest `sizes`
- [ ] No new client component that could have stayed a server component
- [ ] Lighthouse on Slow 4G + 4× CPU throttle meets the budget table
- [ ] Opened on the actual test Android phone, on mobile data, not wifi
