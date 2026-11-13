# My Listings — QA review (2026-11-12)

Scope: broker **My Listings** page (`/broker/your-listings`) — Published / Draft /
Deleted tabs, search, sort, Filters sheet, cards, card menu, delete / restore.

How it was tested:

- Read the full code path: `features/properties/your-listings/*`,
  `lib/api/my-listings.ts`, `components/shared/property-card*.tsx`,
  `hooks/use-url-synced-prefs.ts`.
- Ran the pure helpers with real and edge-case inputs (title building, share
  text, BHK filter mapping, URL filter round-trip) to confirm each bug below.
- **Not** clicked through in a browser against the live API. Items marked
  _Check with backend_ depend on API behaviour this repo cannot see.

Severity: **High** = wrong data shown or sent to people · **Medium** = broken
or misleading in a common flow · **Low** = polish / rare edge case.

---

## Summary

| #   | Severity | Issue                                                                       |
| --- | -------- | --------------------------------------------------------------------------- |
| 1   | High     | Location repeated in card title and shared WhatsApp text                    |
| 2   | High     | Missing locality / city gives a broken title: "Apartment in , "             |
| 3   | Medium   | Search box eats spaces while typing ("2 bhk" becomes "2bhk")                |
| 4   | Medium   | Attached clients never load on My Listings cards                            |
| 5   | Medium   | No Publish action for drafts on the card                                    |
| 6   | Medium   | Page reopens on the Deleted (or Draft) tab after a later visit              |
| 7   | Medium   | Any Filters-sheet filter downloads the whole inventory on the phone         |
| 8   | Medium   | "Price low/high" mixes monthly rent with sale prices (_Check with backend_) |
| 9   | Low      | 1 RK listings are saved and shown as 1 BHK                                  |
| 10  | Low      | `?bhk=1rk` / `?bhk=10_plus` in the URL is silently ignored                  |
| 11  | Low      | Changing sort alone counts as a "filter" in empty states                    |
| 12  | Low      | Only-deleted inventory shows "Add your first property"                      |
| 13  | Low      | "Save property" (bookmark) offered on the broker's own listings             |
| 14  | Low      | Tab counts make 5 API calls on every refresh                                |

---

## 1. Location repeated in card title and shared text — High

**File:** `features/properties/your-listings/to-owned-property-card.ts:20`

The card always appends ` in {locality}, {city}` to the title, but saved
titles already contain the location (Quick add / Full details auto-title is
"Coworking Space in Bapunagar, Ahmedabad").

Confirmed output:

```
title: Coworking Space in Bapunagar, Ahmedabad in Bapunagar, Ahmedabad
share: Coworking Space in Bapunagar, Ahmedabad in Bapunagar, Ahmedabad · Bapunagar, Ahmedabad · ₹50 L — view on YesBroker
```

Where it shows: ⋯ menu → Share (WhatsApp / Telegram / Email / copy text — sent
to clients), photo alt text, delete-button labels for screen readers.

**Repro:** Published tab → any card → ⋯ → Share property → WhatsApp. Read the
pre-filled message.

**Fix idea:** use `item.title` as-is; only build "Type in Locality, City" when
the title is empty.

## 2. Missing locality / city gives "Apartment in , " — High

**File:** same line as #1.

With an empty title and no locality / city (old or imported listing), the
title becomes `"Apartment in , "`. Same text goes into Share.

**Fix idea:** join only the non-empty parts.

## 3. Search eats spaces while typing — Medium

**Files:** `features/properties/your-listings/my-listings-header.tsx:105`,
`features/properties/your-listings/filter-my-listings.ts:67`

The search box sends its text after a 300 ms pause. The value goes to the URL
trimmed (`q=2`), is read back from the URL, and the box resets its own text to
the trimmed value. Anyone who pauses after a space loses it.

**Repro:** type `2 ` → wait half a second → type `bhk`. The box shows `2bhk` and
search finds nothing. Very likely on a phone keyboard.

**Fix idea:** only overwrite the box when the incoming value differs from the
box text after trimming both.

## 4. Attached clients never load on cards — Medium

**File:** `features/properties/your-listings/my-listings-panel.tsx:134`

`withAttachedClients: false` was set in commit `a288ed1`. `myListingsApi.list`
then replaces every item's `attachedClients` with `[]`, so the card's clients
row never shows, even for listings that have clients.

Possibly intentional (the design change removed the row). If so, the
`attachedClients` loader passed next to it is dead code and the card prop does
nothing on this page. **Confirm intent**, then either turn it back on or remove
the unused loader.

## 5. No Publish action for drafts on the card — Medium

**Files:** `components/shared/property-card.tsx:1157`,
`components/shared/property-card-menu.tsx`

Draft cards offer Edit / Analytics / Delete, and Share + Save are disabled
("drafts can't be shared"). There is no **Publish** action. A broker who saved
a Quick add draft has to open the edit form and go through it to publish.
That works against the "broker works faster" goal.

**Fix idea:** add "Publish" to the draft card menu (or as the card's main
button), using `propertiesApi.setPublication(id, "published")`. Show the
form's missing-field errors only if publishing fails.

## 6. Page reopens on the Deleted / Draft tab — Medium

**File:** `features/properties/your-listings/use-my-listings-filters.ts:36`

The tab is saved in device storage along with filters. Leave the page on
**Deleted**, then tap **My Listings** in the nav later. It opens on Deleted
and looks like the broker's listings are gone.

**Repro:** open Deleted tab → go to Dashboard → tap My Listings.

**Fix idea:** don't store `deleted`. Store only `published` / `draft`, or
always open on Published unless the URL says otherwise.

## 7. Filters sheet downloads the whole inventory — Medium

**File:** `lib/api/my-listings.ts:205`

The sheet's filters (location, budget, BHK, area…) are not sent to the API.
When any of them is set, the app fetches **every page** of the broker's
listings and filters on the phone. Search, sort and tabs are still
server-side. For a broker with hundreds of listings on a cheap Android phone,
this is slow and uses a lot of data. It runs again every time the list
refreshes (after delete, restore, save).

**Fix idea:** send the supported criteria to `GET /properties` (needs backend
params), or cap the collect and show a "refine your filters" hint.

## 8. Price sort mixes rent and sale — Medium (_Check with backend_)

**File:** `lib/api/my-listings.ts:87` (mock) — live sort is server-side.

The mock sorts by `sale ?? rent`, so a ₹15,000/mo rental lists as "cheaper"
than a ₹40 lakh flat, and a sale+rent listing sorts by its sale price. If the
API does the same, "Price low" on the Published tab is meaningless whenever
sale and rent listings are mixed.

**Fix idea:** when the Looking-for filter is empty, sort sale and rent groups
separately, or sort by the price matching the active Looking-for.

## 9. 1 RK saved as 1 BHK — Low

**File:** `features/properties/property-form/index.tsx:2027`

The form offers "1 RK", but the save sends `bhk = 1`. The card, filters and
edit form then show **1 BHK**. Needs a backend value (e.g. `bhkConfig: "1rk"`)
to fix properly.

## 10. `?bhk=1rk` / `?bhk=10_plus` ignored — Low

**File:** `features/properties/your-listings/map-my-listing.ts:210`

`bhkValuesToApiConfig(["1rk","1","5","10_plus"])` returns
`["one_bhk","five_plus_bhk"]`. Non-numeric values are dropped silently, so the
filter looks applied but isn't. Only reachable through a shared / old URL,
because the sheet sends BHK through `propertyFilters` and offers only 1–5+.

## 11. Changing sort counts as a "filter" — Low

**File:** `features/properties/your-listings/filter-my-listings.ts:85`

Choose "Price low" on an empty Draft tab and the empty state says no listings
match your filters, with **Clear filters**, instead of "No drafts yet".

## 12. Only-deleted inventory shows "Add your first property" — Low

**File:** `features/properties/your-listings/my-listings-panel.tsx:239`

The `total` count excludes deleted listings. A broker whose only property is in
Deleted gets the first-run "Add your first property — it takes about 2
minutes" screen on Published, with no hint that a deleted listing can be
restored.

## 13. "Save property" offered on own listings — Low

**File:** `features/properties/your-listings/my-listings-grid.tsx:126`

The ⋯ menu offers bookmark / unbookmark on listings the broker created. Saved
properties are for marketplace listings. On your own inventory it just adds
noise to the menu.

## 14. Tab counts make 5 API calls per refresh — Low

**File:** `lib/api/my-listings.ts:158`

`summary()` fires 5 list calls (published, draft, deleted, sale, rent) with
`limit: 1` on every refresh. Also the `sale` / `rent` counts are not filtered
by publish status or deleted state, so they can disagree with the tabs if
anything uses them. A single counts endpoint would be cheaper on mobile data.

---

## Checked and working

- Tabs switch between published / draft / deleted and reset to page 1.
- Unknown `status`, `sort`, `type`, `propertyType` values in the URL fall back
  to safe defaults. `page=-3` becomes page 1.
- Delete from Published / Draft moves to Deleted. Delete from Deleted asks for
  permanent removal. Restore returns the listing as Draft and refreshes counts.
- Restore and Delete buttons lock while either is running, so double taps don't
  send twice.
- Share and Save are disabled for drafts (a draft has no public page).
- Search, sort and filters stay in the URL, so a filtered view can be shared or
  bookmarked.
