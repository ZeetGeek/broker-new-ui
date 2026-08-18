# Project Structure

Single source of truth for where code lives. `.claude/rules/` and
`.cursor/rules/` only point here.

Frontend repo only. The backend (`yesbroker-api`) has its own structure and
none of this applies there.

---

## The layout

```
broker-new-ui/
├── app/                          # ROUTING ONLY — no business logic
│   ├── (marketing)/              # public landing, route group
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── owner/                    # owner portal  — noindex
│   ├── broker/                   # broker portal — noindex
│   ├── property/[id]/            # public share page — indexable
│   ├── layout.tsx
│   ├── globals.css               # Tailwind v4 config lives here
│   ├── robots.ts
│   └── sitemap.ts
│
├── components/
│   ├── ui/                       # shadcn — VENDORED, do not edit
│   ├── layout/                   # shells, nav, bottom bar, headers
│   └── shared/                   # used by 3+ features
│
├── features/                     # domain code, grouped by what it does
│   ├── properties/
│   ├── representations/
│   ├── clients/
│   ├── site-visits/
│   └── team/
│
├── lib/
│   ├── api/                      # HTTP layer — the snake_case boundary
│   ├── format/                   # INR, dates, phone, area
│   ├── validation/               # zod schemas
│   └── utils.ts                  # cn() ONLY
│
├── hooks/                        # global hooks only
├── types/                        # cross-cutting types
├── config/                       # site config, nav, constants
├── docs/                         # AGENTS/rule docs
└── public/
```

---

## The one rule that makes this work

Dependencies flow **downward only**:

```
app/  →  features/  →  components/  →  lib/
```

- `app/` may import from anything below it
- `features/` may import `components/` and `lib/`, never `app/`
- `components/` may import `lib/`, never `features/`
- `lib/` imports nothing from this list — it is pure and testable
- `components/ui/` imports nothing from the project at all

An upward import is always a design mistake. If `lib/format/price.ts` needs a
type from `features/properties/`, that type belongs in `types/`.

---

## `app/` is routing only

Every file in `app/` should be short. A `page.tsx` fetches data, composes
components, and returns. If it contains form logic, filter state, or a 200-line
JSX tree, that content belongs in `features/`.

```tsx
// ✅ app/broker/browse/page.tsx
import { BrowseProperties } from "@/features/properties/browse-properties";

export default function Page() {
  return <BrowseProperties />;
}
```

### Route folder conventions

| Pattern | Meaning |
|---|---|
| `browse-properties/` | Route segment — becomes the URL |
| `[id]/` | Dynamic segment |
| `(auth)/` | Route group — organizes without affecting the URL |
| `_components/` | Private — excluded from routing entirely |

Route groups earn their place here. `(auth)` lets login and signup share a
centred, logo-only layout without adding `/auth` to the URL. `(marketing)`
does the same for the public landing page, which needs a completely different
shell from either portal.

### Colocating route-specific components

If a component is used by exactly one route, put it in that route's
`_components/`:

```
app/owner/properties/
├── page.tsx
└── _components/
    └── property-list-header.tsx
```

The `_` prefix keeps Next from treating it as a route. **When a second route
needs it, promote it to `features/`.** Do not import across `_components/`
folders — that's the signal it was never route-specific.

---

## `features/` — the important decision

Group by **domain**, not by file type. This is the difference between a
codebase that stays navigable and one that becomes a 200-file `components/`
folder nobody can search.

```
features/properties/
├── property-card.tsx
├── property-form/
│   ├── index.tsx
│   ├── step-basics.tsx
│   ├── step-price-photos.tsx
│   └── step-extras.tsx
├── use-property-filters.ts
├── property-filters.tsx
└── types.ts
```

Everything about properties is in one folder. Adding a field means opening one
directory, not hunting through `components/`, `hooks/`, `utils/`, and `types/`.

### Current features

| Feature | Owns |
|---|---|
| `properties/` | Listing wizard, cards, filters, browse, detail |
| `representations/` | Request to represent, approve/reject, active links |
| `clients/` | Broker CRM — pipeline, client detail, activities |
| `site-visits/` | Scheduling, slots, calendar |
| `team/` | Organization member management |

Add a feature when a new domain appears — not for every screen.

---

## Portal isolation — enforce this

`app/owner/` and `app/broker/` must **never** import from each other. A user
sees one portal and never the other; crossing the line is how owner-side code
ends up shipping broker data.

Shared logic goes in `features/` and is imported by both. If something feels
like it needs to cross directly, it belongs in a feature.

This is the one boundary worth mechanically enforcing. `dependency-cruiser`
can fail the build on violation:

```
{ from: { path: "^app/owner" }, to: { path: "^app/broker" } }  // forbidden
{ from: { path: "^app/broker" }, to: { path: "^app/owner" } }  // forbidden
```

Not urgent today. Add it before a second developer joins.

---

## `components/` — three folders, distinct purposes

| Folder | Contains | Rule |
|---|---|---|
| `ui/` | shadcn primitives | **Never edit.** Regenerating overwrites changes. Knip ignores it. |
| `layout/` | Portal shells, top nav, mobile bottom bar | Structural, not domain |
| `shared/` | `EmptyState`, `PriceDisplay`, `PhotoGallery` | Only if **3+** features use it |

**The rule of three:** a component lives in the feature that owns it until a
third feature needs it. Two uses is a coincidence; three is a pattern.
Promoting too early creates props-explosion components that serve nobody well.

To customize a shadcn primitive, wrap it in `shared/` rather than editing
`ui/`. That way `npx shadcn add` stays safe forever.

---

## `lib/` — pure, no React

No components, no hooks, no JSX. Everything here is a plain function that could
be unit-tested with no DOM.

```
lib/
├── api/
│   ├── client.ts              # fetch wrapper: base URL, auth, error handling
│   ├── properties.ts          # endpoints + snake_case → camelCase mapping
│   └── representations.ts
├── format/
│   ├── price.ts               # ₹45 L / ₹1.2 Cr
│   ├── date.ts                # dd/mm/yyyy display
│   ├── phone.ts               # +91 formatting
│   └── area.ts                # sq ft
├── validation/
│   └── property.ts            # zod schemas, shared by form + API
└── utils.ts                   # cn() ONLY
```

### Two traps to avoid

**`lib/utils.ts` becomes a landfill.** shadcn creates it holding `cn()`. Within
a month it holds twelve unrelated helpers and every file imports it. Rule:
`cn()` and nothing else. A new helper gets a named file — `lib/format/price.ts`,
not `utils.ts`.

**`lib/api/` is the snake_case boundary.** The API speaks `snake_case`; the app
speaks `camelCase`. Convert here, once, and disambiguate `broker_id` into
`brokerUserId` or `brokerProfileId` at the same time. See `docs/NAMING.md`. If
`snake_case` appears anywhere else, the boundary has leaked.

---

## `config/` — things that change together

```
config/
├── site.ts        # product name, domain, support contact
├── nav.ts         # nav items per portal
└── constants.ts   # MAX_PHOTOS_PER_PROPERTY, PIPELINE_STAGES
```

`config/site.ts` matters more than it looks. **The product name is still a
placeholder.** Keeping it in one exported constant means renaming is a
one-line change instead of a repo-wide find-and-replace across UI copy, page
titles, and metadata.

---

## Barrel files (`index.ts`) — mostly don't

A barrel re-exporting everything in a folder looks tidy and causes two real
problems: circular dependencies that surface as confusing runtime errors, and
imports that pull in more than you asked for.

- ❌ No barrels in `lib/`, `hooks/`, or `types/` — import the file directly
- ✅ One optional barrel per feature, exporting only its public surface
- ✅ `property-form/index.tsx` as a component's entry point is fine — that's a
  component, not a re-export barrel

---

## When a file is too long

Over **300 lines** is a signal, not a rule. Over 500 it is almost always doing
several jobs.

The previous version of this project had a 740-line calendar page and a
671-line property form. Both were single files handling data fetching, state,
validation, and rendering at once. The property wizard in this codebase is
split by step for exactly that reason.

Split by responsibility, not by line count: extract the data hook, extract the
sub-sections, keep the orchestrating component thin.

---

## Deciding where something goes

```
Is it a URL?                      → app/
Route-specific, one route only?   → app/<route>/_components/
Belongs to one domain?            → features/<domain>/
Used by 3+ features?              → components/shared/
Structural chrome?                → components/layout/
shadcn primitive?                 → components/ui/ (never edit)
Pure function, no React?          → lib/
Value that might change once?     → config/
```

When genuinely unsure, put it in the feature. Promoting later is easy;
untangling a premature abstraction is not.

---

## Why not `src/`

Next.js supports both a root `app/` and `src/app/`. This project uses root.

`src/` is a reasonable choice — it separates code from the dozen config files
at the root. It is not chosen here because the root `app/` is the Next.js
default, and every path-scoped rule already written for this repo targets
`app/**` and `components/**`.

If you do switch later, these must all change together: `.claude/rules/*`
`paths:` frontmatter, `.cursor/rules/*` `globs:`, the ESLint `files:` globs,
`better-tailwindcss` `entryPoint`, and `tsconfig.json` paths. Doable, but do
it deliberately in one commit rather than drifting into it.

---

## Never do

- ❌ Business logic in `app/` — routing only
- ❌ `app/owner/` importing from `app/broker/`, or the reverse
- ❌ Editing anything in `components/ui/`
- ❌ Adding helpers to `lib/utils.ts`
- ❌ `snake_case` outside `lib/api/`
- ❌ A `components/` folder that grows flat and unsorted
- ❌ Importing from another route's `_components/`
- ❌ Barrel files in `lib/`
- ❌ Creating a feature folder for a single component

---

## What this looks like at 30 screens

The structure above is designed so that growth is additive. At Phase 1 scale
you will have roughly:

```
features/       5 folders, 8–15 files each
components/     ui/ (~25 vendored), layout/ (~6), shared/ (~8)
lib/            ~15 small files
app/            ~20 routes
```

If `components/shared/` passes 20 files, or any feature passes 25, that domain
probably wants splitting — but do that when it happens, not now.
