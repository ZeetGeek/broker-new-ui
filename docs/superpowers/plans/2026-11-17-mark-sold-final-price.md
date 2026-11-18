# Mark as Sold — Final Price & Closing Other Clients Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the broker's final price when a deal is marked sold, and once a property is sold to one client close it for every other client — immediately on broker listings (and on owner listings while the owner portal is off), after owner confirmation otherwise.

**Architecture:** Backend gets one shared "close this property" routine (new `PropertySaleModule`) used by the owner's `markSold`, the broker's `closed_won`, and the owner's offer accept. Backend guards stop reopening / linking on sold properties. Frontend sends the final price, switches the modal between "Mark as sold" and "Send to owner" by listing kind + owner-portal flag, and hides Reopen on sold properties.

**Tech Stack:** Backend NestJS + Prisma + Jest (`broker-backend`, run `npm test`). Frontend Next.js + `node:test` via `tsx` (`broker-new-ui`, run `npm test`).

**Spec:** `docs/superpowers/specs/2026-11-17-mark-sold-final-price-design.md`

## Global Constraints

- Two repos: frontend `D:\Projects\Geek Products\broker-crm\broker-new-ui` (branch `feat/mark-sold-final-price`, exists), backend `D:\Projects\Geek Products\broker-crm\broker-backend` (create branch `feat/mark-sold-final-price` from its current HEAD before Task 1).
- Lost-deal note text, exact: `Sold to another client`.
- Owner-portal flag: frontend `FEATURE_PLATFORM_OWNER` from `@/config`; backend `process.env.FEATURE_PLATFORM_OWNER === 'true'` (default off). Off ⇒ owner listings close immediately like broker listings.
- "Broker listing" test is the backend's: `property.ownerType === 'broker' && Boolean(property.ownedByBrokerId)`. "Owner listing": `property.ownerType === 'owner'`.
- Every accepted offer is a sale (no new offer field, no migration).
- No backfill of existing data. `lostReason` stays unsent.
- Frontend rules from `AGENTS.md`: icons only from `@/components/shared/icons`; listing prices through `PriceWithCommission`; never edit `components/ui/`; UI says "Client(s)".
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Owner accepts a second broker's pending offer after the property was already sold by an earlier accept → that offer was rejected by the close, so accept must fail with `No pending offer to respond to` (test in Task 3).
2. Broker marks a deal sold on a property that a sibling deal already sold (stale board) → 400 `This property is already sold.`, nothing changes (test in Task 2).
3. Broker clicks Mark as sold while their offer is already pending with the owner (owner mode) → explained, modal does not open, no API call (test in Task 5 on the pure helper).
4. Reopen on the winning deal itself after sale → refused, so the property is never `sold` with a live winning deal (test in Task 2).
5. Agency member without manage rights marks an exclusive listing sold → 403, colleagues' clients untouched (test in Task 2).

---

### Task 1 (backend): Shared `PropertySaleService` and refactor `markSold` onto it

**Files:**

- Create: `src/property-sale/property-sale.module.ts`, `src/property-sale/property-sale.service.ts`
- Modify: `src/property/property.module.ts` (import `PropertySaleModule`; move `PropertyAccessService` provider into `PropertySaleModule` and re-export it from there so `ClientModule` can use it without a cycle), `src/property/property.service.ts:721-880` (`markSold`)
- Test: `src/property-sale/property-sale.service.spec.ts`

**Interfaces:**

- Produces:
    - `PropertySaleService.closePropertyInTx(tx: Prisma.TransactionClient, input: { propertyId: string; exceptLeadId?: string; by: 'owner' | 'broker'; note: string; soldReason: string | null; now: Date }): Promise<{ lostLeadCount: number }>` — property → `status: 'sold', soldAt: now, soldReason`; every lead on the property with stage not in `closed_won`/`closed_lost` and `id !== exceptLeadId` → `closed_lost`, note appended (existing `markSold` format), stage-history entry `{ status: 'closed_lost', at, by, note }`, `offerStatus` `pending` → `rejected`.
    - `PropertySaleService.notifyRepresentingBrokers(input: { actorUserId: string; propertyId: string; body: string; metadata: Record<string, unknown> }): Promise<void>` — the recipient/notification loop moved verbatim out of `markSold` (type `property_sold`, skip actor, dedupe).
    - `PropertySaleService.ownerConfirmationRequired(): boolean` — `process.env.FEATURE_PLATFORM_OWNER === 'true'`.
    - `PropertySaleModule` exports `PropertySaleService` and `PropertyAccessService`.

- [ ] **Step 1: Write failing tests** in `property-sale.service.spec.ts` (mock `tx` like `src/property/property-soft-delete.spec.ts`):
    - `closePropertyInTx skips exceptLeadId and closed leads` — given leads `[{id:'a',stage:'negotiation'},{id:'b',stage:'offer_made',offerStatus:'pending'}]` returned by `findMany` and `exceptLeadId:'win'`, asserts `findMany` where includes `id: { not: 'win' }`, `update` called for `a` and `b` with `stage:'closed_lost'`, `b` also `offerStatus:'rejected'`, property updated with `status:'sold'`, result `{ lostLeadCount: 2 }`.
    - `ownerConfirmationRequired follows env` — `'true'` ⇒ true; unset ⇒ false.
- [ ] **Step 2:** `npx jest src/property-sale` → FAIL (module not found).
- [ ] **Step 3:** Implement the service + module; refactor `markSold` to call `closePropertyInTx` (no `exceptLeadId`, existing note text) and `notifyRepresentingBrokers` with its existing body. Behaviour of `markSold` must not change.
- [ ] **Step 4:** `npx jest` → all pass (incl. existing `property-*.spec.ts`); `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `feat: extract shared property sale routine`.

### Task 2 (backend): Broker `closed_won` — final price, close property, guards

**Files:**

- Modify: `src/client/dto/update-lead-status.dto.ts`, `src/client/client.module.ts` (import `PropertySaleModule`), `src/client/client.service.ts` (`updateLeadStatus` ~1098, `leadInclude` ~2012 add `status: true` to `property.select`, serializer exposes `property.status`, link-clients method ~230)
- Test: `src/client/client-mark-sold.spec.ts`

**Interfaces:**

- Consumes: Task 1 `PropertySaleService`, `PropertyAccessService.resolve(userId)` / `loadVisible(access, propertyId, { requireManage: true })`.
- Produces: `UpdateLeadStatusDto.closedAmount?: number` (`@IsOptional() @IsInt() @Min(1)`, `@ApiPropertyOptional`); serialized lead `property.status: 'available' | 'sold' | 'unavailable'`.

Rules in `updateLeadStatus` when `next === 'closed_won'`:

1. property `status === 'sold'` → 400 `This property is already sold.`
2. owner listing and `ownerConfirmationRequired()` → 400 `The owner confirms sales on their listings. Send the final price to the owner instead.`
3. broker listing → `loadVisible(..., { requireManage: true })`; failure → 403 `Only the listing's manager can mark it sold.`
4. In one `$transaction`: lead → `closed_won`, `closedAmount = dto.closedAmount ?? lead.offerAmount ?? lead.listPrice`; `tx.deal.create` (`outcome:'won'`, same shape as `respondToOffer`); `closePropertyInTx({ exceptLeadId: lead.id, by: 'broker', note: 'Sold to another client', soldReason: null })`.
5. After commit, for owner listings only, `notifyRepresentingBrokers`.

Other guards:

- closed (`closed_won`/`closed_lost`) → live stage when property `status === 'sold'` → 400 `This property is sold. Its deals can't be reopened.`
- Linking clients to a property whose `status === 'sold'` → 400 `This property is already sold.` (before the `findMany` at ~237).

- [ ] **Step 1: Write failing tests** (mocked prisma/tx, `PropertySaleService` mocked):
    - `closed_won saves the broker's final price` — `dto.closedAmount: 4_500_000` ⇒ lead update data `closedAmount: 4500000n`.
    - `closed_won on broker listing closes the property except this lead` — `closePropertyInTx` called with `exceptLeadId: lead.id`, `note: 'Sold to another client'`.
    - `closed_won on owner listing is refused when owner confirmation is on` — env on ⇒ 400 message above, no transaction.
    - `closed_won on owner listing closes immediately when owner portal is off` — env off ⇒ `closePropertyInTx` called, `notifyRepresentingBrokers` called.
    - `closed_won without manage rights on broker listing` ⇒ 403, no transaction. _(Review Focus 5)_
    - `closed_won on an already sold property` ⇒ 400 `This property is already sold.` _(Review Focus 2)_
    - `reopening a won or lost deal on a sold property is refused` — `closed_won → contacted` and `closed_lost → negotiation` both 400. _(Review Focus 4)_
    - `linking a client to a sold property is refused`.
- [ ] **Step 2:** `npx jest src/client/client-mark-sold` → FAIL.
- [ ] **Step 3:** Implement DTO, include/serialize `status`, rules above.
- [ ] **Step 4:** `npx jest` and `npx tsc --noEmit` → pass.
- [ ] **Step 5: Commit** `feat: record final price and close property when broker marks sold`.

### Task 3 (backend): Owner accepting an offer sells the property

**Files:**

- Modify: `src/client/client.service.ts` `respondToOffer` (~1302)
- Test: `src/client/client-offer-accept.spec.ts`

**Interfaces:**

- Consumes: Task 1 `closePropertyInTx`, `notifyRepresentingBrokers`.

On `accept`, inside the existing `$transaction`, after the lead update and `deal.create`: `closePropertyInTx({ propertyId: lead.propertyId, exceptLeadId: lead.id, by: 'owner', note: 'Sold to another client', soldReason: null, now })`. After commit: `notifyRepresentingBrokers` (body: `${propertyTitle} was sold to another client. ${n} open deal(s) closed as lost.` — pluralise like `markSold`). Decline path unchanged.

- [ ] **Step 1: Write failing tests:**
    - `accepting an offer closes the property for other clients` — `closePropertyInTx` called with `exceptLeadId` = accepted lead.
    - `declining does not close the property` — not called.
    - `accepting an offer rejected by an earlier sale fails` — lead `offerStatus: 'rejected'`, `stage: 'closed_lost'` ⇒ 400 `No pending offer to respond to`. _(Review Focus 1)_
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** `npx jest`, `npx tsc --noEmit` → pass.
- [ ] **Step 5: Commit** `feat: accepting an offer marks the property sold`.

### Task 4 (frontend): API layer — send final price, expose sold + listing kind

**Files:**

- Modify: `lib/api/pipeline.ts` (`ApiLead.property` add `status?: string | null`, `ownerType?: string | null`; `setStage` body adds `closedAmount` when `status === 'closed'` and `closedAmountInr` set; drop that half of the "deliberately NOT sent" comment; `mapLeadToDeal` fills new fields; mock `mockSetStage` closed ⇒ other mock deals with same `property.id` and live status → `lost`, all set `isSold`), `features/pipeline/types.ts` (`DealItem.property` add `isSold: boolean`, `isBrokerListing: boolean`)
- Create: `lib/pipeline/sale-mode.ts`
- Test: `lib/api/pipeline-mark-sold.test.ts`, `lib/pipeline/sale-mode.test.ts`

**Interfaces:**

- Produces:
    - `DealItem.property.isSold` (`lead.property.status === 'sold'`), `DealItem.property.isBrokerListing` (`ownerType === 'broker'` or `isBrokerInventory`).
    - `saleConfirmMode(input: { isBrokerListing: boolean; ownerPortalOn: boolean }): 'immediate' | 'owner'` — `'owner'` only when `ownerPortalOn && !isBrokerListing`.
    - `markSoldBlockedReason(deal: Pick<DealItem, 'offerStatus' | 'property'>, mode: 'immediate' | 'owner'): string | null` — `'owner'` + `offerStatus === 'pending'` ⇒ `Waiting for the owner on your offer.`; `property.isSold` ⇒ `This property is already sold.`; else null.
    - `otherLiveClientCount(deals: DealItem[], deal: DealItem): number` — deals with same `property.id`, different `id`, live status.

- [ ] **Step 1: Write failing tests:**
    - `setStage to closed sends closedAmount` (adapter-capture pattern from `lib/api/clients-detach.test.ts`, `skip: USE_MOCK_DATA`) — body `{ status: 'closed_won', closedAmount: 4500000 }`.
    - `setStage to lost does not send closedAmount`.
    - `saleConfirmMode` table: (broker,on)→immediate, (owner,on)→owner, (owner,off)→immediate.
    - `markSoldBlockedReason` — pending offer in owner mode ⇒ the exact string _(Review Focus 3)_; pending offer in immediate mode ⇒ null; sold ⇒ sold string.
    - `otherLiveClientCount` excludes self, other properties, and closed deals.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implement. **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint` → pass.
- [ ] **Step 5: Commit** `feat: send final price and expose sold state on pipeline deals`.

### Task 5 (frontend): Pipeline UI — Send to owner, warnings, no reopen on sold

**Files:**

- Modify: `features/pipeline/stage-note-modal.tsx`, `features/pipeline/pipeline-page.tsx` (`onClose` ~572, `handleConfirmMove` ~449, modal render ~901), `features/pipeline/deal-card.tsx` (Reopen ~346, Mark sold action), `features/pipeline/deal-detail-modal.tsx` (same actions if present), `features/pipeline/make-offer-modal.tsx`

**Interfaces:**

- Consumes: Task 4 `saleConfirmMode`, `markSoldBlockedReason`, `otherLiveClientCount`, `DealItem.property.isSold`; existing `pipelineApi.makeOffer(dealId, amount, notes)`.
- `StageNoteModal` new props: `saleMode: 'immediate' | 'owner'`, `otherClientCount: number`.

Behaviour / exact copy:

- `onClose`: if `markSoldBlockedReason(...)` returns a string, `toast(reason)` and stop.
- Modal, closing: under the price field one line —
    - immediate, count > 0: `Your {n} other client(s) on this property will be marked as lost.`
    - owner: `The owner confirms the sale. Once they do, the property closes for every other client.`
    - Primary label: immediate `Mark as sold`; owner `Send to owner`.
- `handleConfirmMove`, owner mode + closed: call `makeOffer(dealId, closedAmountInr, note)`; toast `Sent to the owner to confirm.`; else existing `setStage` path.
- Reopen hidden on cards/detail when `deal.property.isSold`.
- `make-offer-modal.tsx`, when `FEATURE_PLATFORM_OWNER`: one line `If the owner accepts, the property is sold to this client and its other clients are closed.`

- [ ] **Step 1:** Implement the above.
- [ ] **Step 2:** `npx tsc --noEmit`, `npm run lint`, `npm test` → pass.
- [ ] **Step 3: Manual check** (`npm run dev`, mock mode): property with 2 deals, mark one sold with a typed price ⇒ modal warns "Your 1 other client…", other deal moves to Lost, Reopen absent on both. With `NEXT_PUBLIC_FEATURE_PLATFORM_OWNER=true` on an owner-listing deal ⇒ "Send to owner" button.
- [ ] **Step 4: Commit** `feat: mark-as-sold modal sends to owner or warns about other clients`.

### Task 6 (frontend): Owner accept modal says what accepting does

**Files:**

- Modify: `features/owner-leads/accept-offer-modal.tsx`

- [ ] **Step 1:** Add one line above the footer: `Accepting marks your property as sold. Other brokers' clients on it are closed.` Keep existing toast in `owner-leads-page.tsx:225` (now true).
- [ ] **Step 2:** `npx tsc --noEmit`, `npm run lint` → pass.
- [ ] **Step 3: Commit** `feat: owner accept modal explains the sale closes other clients`.

### Task 7: Linking to a sold property shows the server message

- [ ] **Step 1:** In the frontend, find the attach-client-to-property call sites (`grep -rn "clientsApi\.\(link\|attach\)" features`). Confirm their catch path shows the API error message (e.g. via `apiMessage`); if one shows a generic message, pass the server message through.
- [ ] **Step 2:** `npx tsc --noEmit`, `npm run lint`; commit only if changed: `fix: show why a sold property can't be linked`.
