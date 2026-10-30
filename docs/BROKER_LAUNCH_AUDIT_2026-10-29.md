# Broker-first launch audit — 29 October 2026

## Verdict

The broker-first rollout is reflected in the frontend: owner signup choices are normalized to Broker, owner routes redirect to `/owner-unavailable`, and marketplace/request/referral routes are gated. The broker CRM does not need the owner portal to be enabled to launch. However, the current implementation is **not ready for an unqualified launch sign-off**. Routine contact editing, durable property storage, clearing saved values, visit state, and follow-up handling still have important gaps.

No application source was changed during this audit. This report is the only intentional repository addition. The pre-existing `package-lock.json` modification was left alone.

## What was actually checked

| Check                        | Result                                         | What this establishes                                                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                   | **110 passed; 0 failed/skipped**               | Existing regression suite passes. Covers launch policies, auth transport/session boundaries, inventory loading, contact deep links, linking/detaching buyers, form validation/recovery, conditional filters, dates, prices, and visit conflicts. |
| `npm run typecheck`          | **Passed**                                     | No TypeScript errors in the current project.                                                                                                                                                                                                     |
| `npm run build`              | **Passed**                                     | Optimized production compilation, TypeScript, and static page generation succeed.                                                                                                                                                                |
| `npm run lint`               | **Exit 0; 711 warnings; 0 errors**             | Build-breaking lint errors were not found; warning debt remains.                                                                                                                                                                                 |
| `npm run format:check`       | **Failed: 9 files**                            | Formatting is not currently clean.                                                                                                                                                                                                               |
| Production HTTP smoke checks | **22 URLs checked; no server-error responses** | Broker/public route shells respond; owner and deferred-route redirects are present. Does not prove authenticated client behavior.                                                                                                                |
| Additional isolated probes   | **9 diagnostic cases reproduced**              | Verified transport/mapping problems below with substituted Axios responses. These probes made **zero remote API requests**.                                                                                                                      |
| Impeccable source detector   | **6 findings reviewed**                        | Mostly low-priority motion heuristics; one false positive. See below.                                                                                                                                                                            |

### Verification limits

Interactive browser access was unavailable. Browser discovery reported `The browser access host is unavailable`; the native fallback then stopped because it could not determine the current browser URL reliably enough to enforce policy. No bypass was attempted.

Consequently, this is a **source, automated-test, isolated-adapter, and production-HTTP audit**, not a claim that every button was clicked successfully. Authenticated live create/edit/delete, real storage uploads, email/OAuth delivery, socket behavior, actual public API sanitization, 360px screenshots, touch gestures, keyboard traversal, and physical Android performance remain unverified. The separate backend repository was not inspected or changed.

## Implementation integrity and provisional health

**Verdict: coherent frontend conventions, incomplete operational integrity.** Centralized launch flags, route helpers, price/icon components, field visibility rules, and session isolation are substantial positives. The main failures are at the boundary between visible controls and durable server behavior.

These scores are provisional source-review scores, not WCAG conformance or measured device-performance certification.

| Dimension                | Score     | Evidence / limit                                                                                                                                                             |
| ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility            | 3/4       | Named controls, form semantics, mobile target rules, reduced-motion handling, and existing accessibility regression checks. Actual keyboard/screen-reader behavior untested. |
| Performance              | 2/4       | Shared inventory loading and optimized images are present. Several adapters still scan full collections; actual low-end-device and network measurements unavailable.         |
| Responsive design        | 3/4       | Dedicated mobile navigation, responsive layouts, mobile pipeline stages, and minimum target rules. No rendered viewport or gesture verification.                             |
| Theming                  | 3/4       | Central tokens and shared component conventions are established. Some isolated literal colors remain.                                                                        |
| Implementation integrity | 1/4       | Multiple visible CRM operations cannot persist correctly or cannot be completed.                                                                                             |
| **Total**                | **12/20** | **Provisional: significant work remains.**                                                                                                                                   |

15 prioritized findings: **0 P0, 7 P1, 7 P2, 1 P3**. This is the number of documented findings, not a claim that no other defects exist.

## P1 — address before release

### 1. Private owner contacts cannot be edited, and their inline notes cannot save

**Locations:** `features/contacts/add-owner-modal.tsx:159`, `features/contacts/contact-detail-panel.tsx:782`, `lib/api/contacts.ts:803`, `features/contacts/contacts-page.tsx:608`.

The broker sees Edit owner and Save changes, but the submit handler always returns “Editing owners is not available yet.” The owner-detail Notes field also looks editable and saves on blur; its adapter rejects all existing custom-owner updates. Its fire-and-forget blur handler has no local error display.

**Reproduction:** Add an owner, reopen Edit, change the phone or name, and save. Separately, edit owner notes and leave the field. The adapter probe confirmed the latter rejects before any HTTP request.

**Impact:** A broker cannot correct contact information or maintain notes for an owner already in their private CRM. This issue concerns broker-managed contacts, not the deferred Owner portal.

**Recommendation:** Support owner updates against a verified API contract and expose save failures/retry inline. Until supported, the UI must clearly disclose the limitation before inviting an edit. Suggested UI follow-up: `$impeccable harden`.

### 2. Important property details are stored only on this device

**Locations:** `features/properties/property-form/index.tsx:1720`, `features/properties/property-form/index.tsx:1892`, `features/properties/property-form/index.tsx:739`, `features/properties/your-listings/map-my-listing.ts:376`.

The full form collects carpet area, property age, property condition, and unit/address details. `draftToLegacyInput` and the API payload mapper omit several of these. `mergeLocalExtras` explicitly restores carpet area, age, condition, unit number, and full address from local storage rather than the saved server record.

**Reproduction:** Enter distinct carpet/total areas and property age/condition, save, then inspect the submitted fields and open the property on a fresh device/browser profile. The missing fields cannot be supplied by this frontend's write path. Where a server already has those fields, edits still do not update them through this path.

**Impact:** A successful “Property published” message does not mean all entered facts have been durably saved. Shared/detail views and filters cannot reliably use device-only facts. A broker changing phones can have to re-enter them.

**Recommendation:** Define and use a complete persisted property contract; reserve local drafts for unsaved recovery. Confirm the backend supports the missing fields rather than inventing endpoints in this frontend. Suggested UI follow-up: `$impeccable harden`.

### 3. Private address information is mixed into the public description

**Locations:** `features/properties/property-form/index.tsx:1933`, `features/properties/your-listings/map-my-listing.ts:429`, `features/properties/your-listings/map-my-listing.ts:524`, `features/properties/public-property/public-property-page.tsx:105`, `features/properties/property-detail/property-detail-layout.tsx:405`.

The form sends `streetOrRoad || fullAddress` as its legacy address. Both create and update payload mappers concatenate this address with the public property description. The public page hides the address section with `revealAddress={false}`, but still renders the description verbatim.

**Probe:** Address `Flat 23, Example Society, Vesu` plus description `Bright apartment with a balcony.` produces a description containing both, and the detail mapper retains it.

**Impact:** Hiding the dedicated address section does not protect an exact address copied into the public description. This is a verified frontend exposure path; whether the deployed public API independently removes it was **not verified**. Treat that as a release check, not as proof of an actual production disclosure.

**Recommendation:** Keep private address fields separate from public copy; test the no-login public response and rendered page with an exact-address fixture. Do not approve sharing privacy solely from the hidden location section. Suggested UI follow-up: `$impeccable harden`.

### 4. Clearing saved optional fields omits the clear instruction

**Locations:** `features/properties/your-listings/map-my-listing.ts:467`, `lib/api/properties.ts:429`, `lib/api/clients.ts:937`.

Listing null/empty values become `undefined`, and multipart serialization drops undefined, null, and empty strings. Buyer email, notes, and BHK likewise become undefined and disappear from JSON.

**Probes:** Clearing listing commission, maintenance, description, society, landmark, and owner association produced an empty field payload. Clearing buyer email, notes, and BHK produced an update containing none of those keys. Video/tour URL clears and empty string arrays have dedicated handling, so those are not included in this finding.

**Impact:** The server receives no explicit instruction to clear these fields. Under ordinary partial-update semantics, old values remain and return after reload, including stale values after a type/transaction change. The omission is confirmed; final server behavior needs a contract/integration test.

**Recommendation:** Distinguish “unchanged” from “clear” in update types and serialization, using the API's agreed clear representation. Verify edit → clear → save → reload for both contacts and properties. Suggested UI follow-up: `$impeccable harden`.

### 5. Confirmed visits become completed immediately after their start time

**Location:** `lib/api/broker-visits-map.ts:177`.

`mapShowingStatus('confirmed', startsAt)` returns `completed` whenever `startsAt < Date.now()`, without checking a persisted completion or even the scheduled end time.

**Probe:** A confirmed visit that started one minute ago maps to completed. No completion request is made.

**Impact:** An in-progress, missed, or still-unconfirmed completion is displayed as completed. It also enters outcome-attention logic. Dashboard agenda logic already preserves persisted status, so the two screens can disagree.

**Recommendation:** Keep persisted status authoritative. If needed, show a separate derived “time passed” or “in progress” indicator. Suggested UI follow-up: `$impeccable harden`.

### 6. Visit slot pagination cannot advance beyond the first response

**Locations:** `hooks/use-slots.ts:16`, `hooks/use-slots.ts:22`, `lib/api/broker-visits.ts:143`.

The infinite-query hook ignores `pageParam` and always returns undefined for the next page. `buildOpenSlotsQuery` omits `page` and `limit`, even though the response carries pagination metadata.

**Probe:** Requesting exclusive slots with `{ page: 2, limit: 1 }` sent `/slots/broker/exclusive/open?`; a fixture with `totalPages: 2` still returned page 1. The UI's load-more props cannot compensate for the hook declaring no next page.

**Impact:** On a paginated server response, later properties/slots are inaccessible and loaded-page totals can understate availability.

**Recommendation:** Pass pagination parameters, consume the next-page metadata, and test with eligible slots only on page 2. If this endpoint is deliberately unpaginated, explicitly verify and encode that contract. Suggested UI follow-up: `$impeccable harden`.

### 7. Follow-ups are advertised but are not an operable broker workflow

**Locations:** `features/dashboard/follow-ups-card.tsx:19`, `features/dashboard/follow-ups-card.tsx:150`, `features/pipeline/types.ts:124`, `features/site-visits/broker/panels/outcome-modal.tsx:319`, `lib/api/broker-visits.ts:482`.

The dashboard is a read-only follow-up preview and explicitly says completion is unavailable. It slices the input to four rows without providing a complete follow-up list. No active broker contact/pipeline mutation was found for setting a follow-up date or marking it complete. The schedule-follow-up control in visit outcomes is behind an unavailable live save operation; `nextFollowUpAt` also is not mapped into live pipeline deals.

**Impact:** A core CRM promise—remembering the next action—does not yet have a complete path. If more than four follow-ups exist, later items cannot be reached through this card. This is a capability gap, not a request to launch owner features.

**Recommendation:** Prioritize a small complete broker follow-up flow: schedule, see all due items, complete/reschedule, persist, and reload. Reconcile API support in the separate backend. Suggested UI follow-up: `$impeccable shape`, then `$impeccable harden`.

## P2 — functional limitations and edge cases

### 8. Visit booking checks only the first 100 property leads

**Location:** `lib/api/broker-visits.ts:156`.

After linking a buyer, `resolveLeadIdForBuyer` reads only page 1 with limit 100. It neither follows `totalPages` nor uses a returned authoritative lead ID.

**Probe:** The matching buyer lead on page 2 was ignored. Booking rejected “Could not link this buyer…” after a successful linking POST; the slot booking was never attempted.

**Impact/recommendation:** Busy properties eventually become unbookable for later buyers. Resolve the exact pair across pages or use the linking response. Suggested UI follow-up: `$impeccable harden`.

### 9. Any deal edit is treated as a buyer contact

**Locations:** `lib/api/pipeline.ts:312`, `lib/api/pipeline.ts:130`, `features/pipeline/stage-blocks/contacted-stage-block.tsx:12`.

Live deals assign generic `updatedAt` to `lastContactedAt`. Notes, offers, or stage edits can therefore make a deal look recently contacted and remove it from stalled attention. An isolated mapping probe confirmed a recent generic update makes an old deal non-stalled.

**Impact/recommendation:** Brokers can miss clients who still need a call. Persist/read a real contact timestamp or derive it from explicit contact events; label a generic edit timestamp as an update. Suggested UI follow-up: `$impeccable clarify`.

### 10. Live visit completion/outcomes and rescheduling are unavailable

**Locations:** `lib/api/broker-visits.ts:482`, `lib/api/broker-visits.ts:500`, `features/site-visits/broker/panels/visit-detail-panel.tsx:304`, `lib/visits/summary.ts:26`.

Outcome saving and rescheduling explicitly reject in live mode. Most corresponding CTAs are correctly hidden; the app explains that rescheduling requires cancel-and-rebook and notes/stages belong in Pipeline. However, summary attention still counts visits needing outcomes, and there is no supported way here to clear that condition. No active broker visit-status mutation to complete or mark no-show was found.

**Impact/recommendation:** Daily visit records cannot be fully maintained through this UI. Either ship the live lifecycle or remove unactionable outcome attention and clearly document the interim workflow. Suggested UI follow-up: `$impeccable harden`.

### 11. Rapid notification preference changes can overwrite one another

**Locations:** `features/profile/notification-preferences.tsx:84`, `features/profile/notification-preferences.tsx:134`, `features/profile/notification-preferences.tsx:176`.

Only the currently saving channel is disabled. Each request sends all three preferences based on its closure's profile snapshot, and each response writes a whole locally constructed snapshot back. Toggle two different channels before the first request settles and they can submit incompatible stale values; response order can also revert the displayed first change.

**Evidence:** Source-level state/request analysis; not exercised in a browser.

**Recommendation:** Serialize changes, disable the group while saving, or send independent per-channel patches and merge authoritative results safely. Suggested UI follow-up: `$impeccable harden`.

### 12. Landing-page claims contradict this launch and undecided pricing

**Locations:** `features/marketing/home-hero.tsx:19`, `features/marketing/home-hero.tsx:22`, `features/marketing/home-hero.tsx:101`.

The badge says “Now onboarding brokers and owners,” while the same hero says owner listings are coming soon. It also hard-codes “Start free for 3 months” and “Free for first 20 brokers.” The supplied product instructions explicitly leave the meaning/duration of free undecided.

**Impact/recommendation:** Prospective users receive contradictory availability information and an unconfirmed commercial promise. Use broker-only onboarding copy and settle the free offer with the product owner before publishing it. This audit does not decide pricing. Suggested UI follow-up: `$impeccable clarify`.

### 13. Cancelled visits count toward active-looking schedule totals

**Location:** `lib/visits/summary.ts:21`.

Today, tomorrow, and week totals do not exclude cancelled visits. A single cancelled visit later today produced `today: 1` and `weekTotal: 1`, as well as `cancelledThisWeek: 1`. “Cancelled this week” also uses the future scheduled date rather than the cancellation timestamp.

**Impact/recommendation:** The headline can imply a viewing still needs attendance. Define whether these are active schedule counts or historical totals, filter accordingly, and align labels. Suggested UI follow-up: `$impeccable clarify`.

### 14. The attach-owner picker searches only the first 100 owners

**Location:** `features/properties/your-listings/attach-exclusive-owner-modal.tsx:75`.

The picker requests one page of 100 owners and then filters that array locally. It never loads later pages or submits the search term to the server.

**Impact/recommendation:** An existing contact beyond the first page appears missing when attaching/replacing an owner. Add paginated server search or deliberately fetch the entire collection. Suggested UI follow-up: `$impeccable harden`.

## P3 — maintenance

### 15. Repository checks have warning/formatting debt

ESLint reported 711 warnings and no errors, including import order, unused declarations, Tailwind wrapping/order, and hook dependencies. Prettier failed on:

- `features/site-visits/broker/panels/booking-drawer.tsx`
- `features/site-visits/broker/panels/buyer-picker.tsx`
- `features/site-visits/broker/visits-states.tsx`
- `hooks/use-book-slot.ts`
- `lib/api/broker-visits.ts`
- `lib/api/clients.ts`
- `lib/visits/conflicts.test.ts`
- `lib/visits/conflicts.ts`
- `lib/visits/constants.ts`

**Recommendation:** Clean up after behavioral fixes. Review hook warnings in context rather than assuming every warning is a runtime defect. No autofix or formatter was run. Suggested final UI follow-up: `$impeccable polish`.

## What is working well

- Owner launch availability is centralized in `config/index.ts` and defaults off unless explicitly set to `true`.
- Production HTTP checks confirmed `/owner`, `/owner/properties`, and `/owner/visits` redirect to `/owner-unavailable`. Deferred marketplace, representation, owner-profile, and referral paths also contain their expected redirects. Streaming redirects can legitimately have an initial HTTP 200; their redirect payload was checked.
- Signup/OAuth role normalization and existing-owner handling have regression coverage. Existing owner accounts are not silently changed into brokers.
- Broker navigation has five relevant destinations; the deferred marketplace band is not forced onto ordinary CRM lists.
- Buyer linking is additive, and detaching targets the selected buyer/property pair with pagination coverage.
- Property creation handles a failed buyer-link step with a retry rather than creating another property.
- Draft recovery scopes records by account, portal, property, and draft kind; photo recovery and blocked-storage behavior have tests.
- Shared conditional-filter rules, INR formatting, Indian timezone helpers, price components, icon registration, image handling, and reduced-motion support provide a solid basis.
- Query caches are scoped to session identity; tests cover stale HTTP/dashboard responses across account changes.

## Detector findings and false positives

The detector returned six source findings. The `<img>` finding in `features/design-system/theme/logo-tokens.ts:112` is a documentation string, not an image element: **false positive**. Three bounce-easing findings concern motion choices, including the deferred marketplace budget control; these do not establish functional launch failures. Two width-transition findings are confined to the hold-to-logout fill. They warrant measured performance review if that interaction is janky, not a major-release finding by themselves.

## Recommended sequence

1. Resolve owner edits/notes, persisted property fields, explicit clear semantics, and the public-address exposure path with verified API contracts. Use `$impeccable harden` for the associated UI states.
2. Correct visit status and pagination; test booking across multiple lead pages. Use `$impeccable harden`.
3. Complete the minimal broker follow-up workflow and settle the interim visit lifecycle. Use `$impeccable shape` and `$impeccable harden`.
4. Correct misleading activity timestamps, totals, and launch copy. Use `$impeccable clarify`.
5. Verify an authenticated test account against the real API, then perform desktop and 360px Android checks, including keyboard and touch gestures. Use `$impeccable audit` and `$impeccable adapt` where those checks find actual defects.
6. Finish with `$impeccable polish` after functional checks pass.

These commands can be run one at a time or in the order chosen for the launch. Re-run `$impeccable audit` after fixes; the current passing suite alone does not cover the newly reproduced cases.
