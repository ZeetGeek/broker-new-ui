# Naming Conventions

Single source of truth for naming. `.claude/rules/` and `.cursor/rules/` only
point here.

---

## Quick reference

| Thing | Case | Example |
|---|---|---|
| Folders | `kebab-case` | `browse-properties/` |
| Files | `kebab-case` | `property-card.tsx` |
| Next.js special files | `lowercase` (fixed) | `page.tsx`, `layout.tsx`, `route.ts` |
| React components | `PascalCase` | `PropertyCard` |
| Regular functions | `camelCase` | `formatPrice` |
| Hooks | `camelCase`, `use` prefix | `useRepresentation` |
| Variables | `camelCase` | `activeListings` |
| Booleans | `camelCase`, verb prefix | `isVerified`, `hasPhotos` |
| Module constants | `SCREAMING_SNAKE_CASE` | `MAX_PHOTOS_PER_PROPERTY` |
| Types & interfaces | `PascalCase` | `Property`, `BrokerProfile` |
| Type unions | `PascalCase` type, values match API | `type Status = "pending" \| "accepted"` |
| Generics | `PascalCase`, descriptive | `TProperty`, not `T` |
| Env vars | `SCREAMING_SNAKE_CASE` | `NEXT_PUBLIC_SITE_URL` |
| API / DB fields | `snake_case` (external only) | `property_id` |
| CSS custom properties | `--kebab-case` | `--color-brand` |

---

## Components are capitalized. Functions are not.

This distinction is not stylistic — React uses it to tell components apart from
plain values in JSX.

```tsx
// ✅ Component — PascalCase
export function PropertyCard({ property }: Props) { ... }

// ✅ Plain function — camelCase
export function formatPrice(rupees: number): string { ... }

// ❌ Wrong. React will treat <formatPrice /> as an HTML tag and render nothing.
export function formatprice() { ... }
```

A capital letter means "this returns JSX." Nothing else gets one.

---

## Files and folders

### Rule: everything kebab-case, always lowercase

```
components/property-card.tsx        ✅
components/PropertyCard.tsx         ❌
components/propertyCard.tsx         ❌
```

The file is `kebab-case`; the component it exports is `PascalCase`. These do
not have to match, and in this project they deliberately don't:

```tsx
// components/property-card.tsx
export function PropertyCard() { ... }
```

Two reasons this is the rule here: Next.js special files are already lowercase
(`page.tsx`, `layout.tsx`), and shadcn/ui generates kebab-case
(`dropdown-menu.tsx`). Mixing conventions inside one `components/` folder is
worse than either convention alone.

### ⚠️ Windows case-sensitivity trap

**This will bite you specifically.** You develop on Windows, where the
filesystem is case-insensitive. Your CI and host run Linux, where it is not.

`import { Button } from "@/components/Button"` resolves fine on your machine
when the file is actually `button.tsx` — and fails the production build with
`Module not found`. Git also defaults to `core.ignorecase = true` on Windows,
so renaming `Button.tsx` → `button.tsx` may not even be recorded as a change.

To rename a file's case, force it through git:

```bash
git mv --force Button.tsx button.tsx
```

Sticking to all-lowercase filenames avoids the entire class of bug.

### Folder naming

| Pattern | Meaning | Example |
|---|---|---|
| `kebab-case/` | Normal route segment (becomes the URL) | `app/browse-properties/` |
| `[param]/` | Dynamic segment | `app/property/[id]/` |
| `(group)/` | Route group — organizes without affecting the URL | `app/(auth)/login/` |
| `_folder/` | Private — excluded from routing entirely | `app/_components/` |

Route folder names become URLs, so they are user-visible. `browse-properties`
reads correctly; `browseProperties` and `Browse_Properties` do not.

---

## Functions

Start with a verb. The name should say what it does, not what it is about.

| Prefix | Use for | Example |
|---|---|---|
| `get` | Retrieve, cheap or cached | `getProperty` |
| `fetch` | Network call | `fetchBrokerProfile` |
| `create` / `update` / `delete` | Mutations | `createRepresentation` |
| `format` | Value → display string | `formatPrice` |
| `parse` | String → structured value | `parsePriceInput` |
| `validate` | Returns boolean or throws | `validateReraNumber` |
| `to` | Type conversion | `toPropertySummary` |
| `handle` | Event handler inside a component | `handleSubmit` |
| `on` | Event handler passed as a prop | `onApprove` |

The `handle` / `on` pair matters:

```tsx
// The component that owns the logic names it handle*
function ApprovalPanel() {
  const handleApprove = () => { ... };
  return <ApproveButton onApprove={handleApprove} />;
}
//                     ^ the prop is named on*
```

---

## Variables and booleans

Booleans always read as a question with an obvious yes/no:

| Prefix | Meaning | Example |
|---|---|---|
| `is` | State | `isVerified`, `isLoading` |
| `has` | Possession | `hasPhotos`, `hasActiveRepresentation` |
| `can` | Permission | `canEditProperty` |
| `should` | Conditional behaviour | `shouldShowContactDetails` |

Never name a boolean `status`, `flag`, `check`, or `verified` alone — none of
those tell you what `true` means.

Arrays are plural; a single item is singular.

```ts
const properties = await getProperties();
const property = properties[0];
```

Avoid meaningless names: `data`, `item`, `temp`, `result`, `obj`, `arr`, `val`.
`data` is the worst offender — every API response is data.

```ts
const data = await fetchProperty(id);       // ❌
const property = await fetchProperty(id);   // ✅
```

---

## ⚠️ Identifier disambiguation — the most important rule here

This project has a documented FK ambiguity: `broker_id` means `users.id` on
some tables and `brokers.id` on others. The same is true of `owner_id`. This is
intentional and must be preserved — but it means **a variable named `brokerId`
is dangerously ambiguous.**

**Never write a bare `brokerId` or `ownerId` in this codebase.** Always say
which id it is:

| ❌ Ambiguous | ✅ Explicit | Refers to |
|---|---|---|
| `brokerId` | `brokerUserId` | `users.id` |
| `brokerId` | `brokerProfileId` | `brokers.id` |
| `ownerId` | `ownerUserId` | `users.id` |
| `ownerId` | `ownerProfileId` | `owners.id` |

```ts
// ❌ Correct or catastrophic — you cannot tell, and neither can a reviewer
async function getShowings(brokerId: string) { ... }

// ✅ Wrong argument now fails at the type level, not in production
async function getShowings(brokerUserId: BrokerUserId) { ... }
```

Go further where it's cheap — branded types make the two impossible to swap:

```ts
type BrokerUserId = string & { readonly __brand: "BrokerUserId" };
type BrokerProfileId = string & { readonly __brand: "BrokerProfileId" };
```

Passing the wrong one is then a compile error rather than a silent data leak
between brokers. Given this footgun has already caused bugs, the extra six
characters in the name are the cheapest insurance in the project.

---

## Units belong in the name

Real estate has several kinds of money and several kinds of measurement. A
variable called `price` is a bug waiting to happen — sale price, monthly rent,
deposit, and maintenance are all "price."

```ts
salePriceInr          // not price
monthlyRentInr        // not rent
securityDepositInr
maintenanceChargesInr
areaSqft              // not area, not size
carpetAreaSqft        // carpet vs built-up is a real distinction in India
minimumStayMonths     // not minStay
noticePeriodDays      // not notice
commissionRatePercent // not commission — is 2 a percent or a multiplier?
```

Rule: **if a number could be read in more than one unit, the unit goes in the
name.** Currency is always `Inr`, never `Amount` or `Value`.

---

## Dates and times

| Suffix | Meaning | Type |
|---|---|---|
| `At` | Exact moment | timestamp — `createdAt`, `approvedAt` |
| `On` / `Date` | Calendar day, no time | date — `availableFrom`, `visitDate` |
| `Days` / `Months` | Duration | number — `noticePeriodDays` |

Store and pass ISO strings or `Date` objects. dd/mm/yyyy is a **display**
format only — never a variable's value. A variable holding `"18/08/2026"` is a
formatted string and should be named as one: `formattedVisitDate`.

---

## The snake_case ↔ camelCase boundary

The API and database use `snake_case`. The frontend uses `camelCase`. Convert
in exactly one place: the API client layer.

```
API response (snake_case)
      ↓  lib/api/  ← the ONLY place snake_case is allowed
Everything else (camelCase)
```

```ts
// ✅ lib/api/properties.ts — conversion happens here, once
function toProperty(raw: ApiProperty): Property {
  return {
    id: raw.id,
    brokerProfileId: raw.broker_id,     // also disambiguated at the boundary
    salePriceInr: raw.sale_price,
    areaSqft: raw.area_sqft,
  };
}

// ❌ Anywhere else
<p>{property.sale_price}</p>
```

If `snake_case` appears in a component, the boundary has leaked.

---

## Acronyms and abbreviations

Treat acronyms as ordinary words. Only the first letter is capitalized.

```ts
ReraNumber      ✅        RERANumber      ❌
propertyId      ✅        propertyID      ❌
apiUrl          ✅        apiURL          ❌
BhkConfig       ✅        BHKConfig       ❌
```

Consistent casing means you never have to remember which acronym gets special
treatment.

**Allowed abbreviations** — these only, because they're the actual vocabulary
of the domain or the platform:

`id`, `url`, `api`, `bhk`, `rera`, `inr`, `pin`, `sqft`, `min`, `max`

Everything else is spelled out. `prop` is not `property`. `req` is not
`request`. `btn` is not `button`. `usr` is not `user`.

---

## Domain vocabulary

Use the product's own words — these mean specific things and appear across the
whole system. See root `AGENTS.md` for the full glossary.

| Concept | Use | Do not use |
|---|---|---|
| Broker asks to represent a property | `representationRequest` | `application`, `bid`, `offer` |
| Approved owner ↔ broker link | `representation` | `assignment`, `listing` |
| Person in a broker's CRM | `client` | `lead`, `customer`, `contact` |
| A scheduled property visit | `siteVisit` | `showing`, `viewing`, `tour` |

The last row is worth care: the codebase inherited `showings` from a US-built
template, but Indian brokers say "site visit." New code uses `siteVisit`.

---

## Never do

- ❌ A bare `brokerId` or `ownerId`
- ❌ `snake_case` outside `lib/api/`
- ❌ `data`, `item`, `temp`, `result`, `info` as a variable name
- ❌ `PascalCase` or `camelCase` filenames
- ❌ Hungarian notation — `strName`, `arrProperties`, `IProperty`
- ❌ A number whose unit is ambiguous — `price`, `area`, `duration`
- ❌ A boolean without a verb prefix
- ❌ Abbreviations outside the allow-list
- ❌ Renaming a file's case without `git mv --force`

---

## Optional enforcement

Some of this is machine-checkable via `@typescript-eslint/naming-convention` —
boolean prefixes, type casing, constant casing. It is a fiddly rule to
configure and can get noisy, so add it only once the codebase is stable enough
that the noise is signal.

The rules that matter most here — identifier disambiguation, units in names,
domain vocabulary — cannot be linted. They live or die in code review.
