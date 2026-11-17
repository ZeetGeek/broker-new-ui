# Mark as sold: final price, owner confirmation, and closing the other clients

Date: 2026-11-17
Repos touched: `broker-new-ui` (this repo) and `broker-backend` (sibling checkout).

## Intent

A broker marks a pipeline deal sold from the Negotiation stage. Three things
must hold afterwards:

1. The **final price** the broker enters is what gets recorded (today it is
   collected in the modal and silently dropped).
2. A property can be linked to many clients (one pipeline deal per client).
   Once it is sold to one client, it is **no longer linked to anyone else**:
   every other live deal on it closes, and no new client can be attached.
3. On an **owner's** listing, one broker must not be able to take the property
   off the market for every other broker. The **owner confirms** the sale.

## Current state (verified in code)

- `features/pipeline/stage-note-modal.tsx` + `final-price-field.tsx` already
  ask for the final price (listed / client's offer / typed amount).
- `lib/api/pipeline.ts` `setStage` deliberately does not send
  `closedAmountInr`: backend `UpdateLeadStatusDto` only accepts
  `status` + `note` (whitelist rejects extra fields).
- Backend `ClientService.updateLeadStatus` on `closed_won` sets
  `closedAmount = closedAmount ?? offerAmount ?? listPrice`. It touches
  neither the property nor sibling leads.
- Backend `ClientService.respondToOffer` (owner accepts) moves the lead to
  `closed_won` and creates a `deal` row, but does **not** mark the property
  sold or close other leads. The owner UI toast already claims
  "Your property is marked as sold." — currently untrue.
- Backend `PropertyService.markSold` already does the cleanup we want:
  property → `sold`, every live lead → `closed_lost` with a note, pending
  offers → `rejected`, notifies representing brokers (owner listings only).
- Nothing in `ClientService` refuses to link a client to a `sold` property.
- The frontend knows the listing kind via `DealItem.property.isExclusiveProperty`.

## Approaches considered

- **A. Owner listing: "Mark as sold" becomes a final-price request through
  the existing offer flow.** _(Chosen.)_ Deal stays in Negotiation,
  "Waiting for owner". Owner accepts → deal won at that price, property sold,
  all other live deals (every broker, incl. the requesting broker's other
  clients) closed as lost. Owner declines → stays in Negotiation, nothing else
  changes. Little new state; also makes the owner's accept toast true.
- **B. Close immediately, property "sale pending" until owner confirms.**
  Rejected: needs a new property state and an undo path that reopens the
  deal and every client closed with it.
- **C. Close immediately, owner only notified.** Rejected: nothing forces
  cleanup, so other brokers' clients stay linked to a sold property — the
  exact problem being fixed.

Decided with the user: owner confirmation is required on owner listings (not
on broker exclusive listings), via approach A.

## Design

### 1. Final price is recorded (both listing kinds)

- Backend: `UpdateLeadStatusDto` gains optional `closedAmount` (positive
  integer INR, same validation style as `MakeOfferDto.offerAmount`).
  On `closed_won`, use `dto.closedAmount` first, then the existing fallback.
- Frontend: `pipelineApi.setStage` sends `closedAmount` when moving to
  `closed`; remove the "deliberately NOT sent" comment for it. (`lostReason`
  stays unsent — out of scope.)

### 2. Broker exclusive listing — closes immediately

Broker confirms "Mark as sold" with the final price →
backend, in **one transaction**:

- this lead → `closed_won` with `closedAmount`; create the `deal` row
  (`outcome: 'won'`) like `respondToOffer` does;
- property → `sold` (`soldAt`, `soldReason` null);
- every **other** live lead on the property → `closed_lost`, note
  "Sold to another client", pending offers → `rejected`.

Implement by extracting the transaction body of `PropertyService.markSold`
into a shared helper that takes an `exceptLeadId` and a note, so both paths
use one cleanup routine.

### 3. Owner listing — owner confirms (approach A)

**Broker side.** In the modal, when `!deal.property.isExclusiveProperty`:

- Title stays "Mark as sold"; primary button reads **"Send to owner"**.
- A short line under the price explains: the owner confirms the sale; once
  they do, the property closes for every other client (show the count of the
  broker's own other live deals on it when known, e.g. "Your 2 other clients
  on this property will be marked as lost").
- Confirm calls `pipelineApi.makeOffer(dealId, finalPrice, note)` instead of
  `setStage(closed)`. Toast: "Sent to the owner to confirm."
- The card stays in Negotiation and shows a "Waiting for owner" state (the
  existing pending-offer display).
- If an offer is already pending with the owner, the Mark as sold action
  explains that ("Waiting for the owner on your offer") rather than opening
  the modal — the backend already rejects a second pending offer.

**Backend guard.** `updateLeadStatus` refuses `closed_won` on an owner
listing (400: "The owner confirms sales on their listings. Send the final
price to the owner instead."). Otherwise the rule is only enforced by the UI.

**Owner side.** `respondToOffer` with `accept`, in the same transaction it
already opens:

- existing behaviour (lead → `closed_won`, `closedAmount = offerAmount`,
  `deal` row);
- property → `sold`;
- every other live lead on the property, any broker → `closed_lost`
  ("Sold to another client"), pending offers → `rejected`;
- after commit, notify the brokers whose deals were closed (reuse the
  `markSold` notification set).

The owner's accept modal (`features/owner-leads/accept-offer-modal.tsx`)
should say before confirming that accepting marks the property sold and
closes the other brokers' clients on it. The existing toast becomes true.

Decline: unchanged — lead stays `offer_made` / negotiation, offer `rejected`.

### 3a. While the owner portal is off (decided with the user)

The owner portal ships off (`NEXT_PUBLIC_FEATURE_PLATFORM_OWNER=false`), so no
owner can confirm. Until it is on, an owner listing behaves like an
exclusive listing: "Mark as sold" closes immediately via section 2.

- Frontend: the "Send to owner" path applies only when
  `FEATURE_PLATFORM_OWNER` is true; otherwise the modal uses the section 2
  copy and `setStage(closed)`.
- Backend: a matching config flag (e.g. `FEATURE_PLATFORM_OWNER` env, default
  false) gates the section 3 guard. Off → `closed_won` on an owner listing
  runs the section 2 transaction (property sold, other live leads lost, the
  representing brokers notified like `markSold`).

### 3b. Every accepted offer is a sale (decided with the user)

Any offer the owner accepts closes the property (section 3 owner side), not
only ones sent from "Mark as sold". "Make offer / Revise offer" and
"Mark as sold → Send to owner" are therefore the same backend action. The
"Make offer" modal states that if the owner accepts, the property is sold to
this client and the other clients on it are closed. No new offer field.

### 4. Sold properties cannot be linked again

Backend: every path that creates a `brokerPropertyLead` (attach client to
property, add property to client, etc.) refuses when `property.status ===
'sold'` (400: "This property is already sold."). Frontend: surface that
message; where pickers list properties, hide sold ones if the list API
supports it, otherwise rely on the error.

### 5. Calls made by the designer (not asked of the user)

- **No reopening on a sold property.** `assertBrokerStatusTransition`
  currently allows `closed_won`/`closed_lost` → live stage. Backend refuses
  that move when the property is `sold` (400: "This property is sold. Its
  deals can't be reopened."). Frontend hides/blocks Reopen on those deals.
- **Who may close an exclusive listing.** `closed_won` that triggers the
  section 2 cleanup requires the same manage rights as
  `PropertyService.markSold` (`requireManage`). Without them: 403 "Only the
  listing's manager can mark it sold."
- **No backfill.** Deals already `closed_won` on `available` properties are
  left as they are; the rules apply going forward.
- **Detecting an exclusive listing.** Use the backend's test
  (`ownerType === 'broker' && ownedByBrokerId`) as the source of truth; expose
  it on the lead payload if `isExclusiveProperty` disagrees with it.

### Rent listings

Use the same flow; the property status stays `sold` (no `rented` status
exists). UI copy on rent deals already says "Final monthly rent"; keep the
modal title "Mark as sold" unless existing rent copy says otherwise.

## Goals / non-goals

- Goals: final price persisted; one closed sale closes the property for
  everyone; owner consent on owner listings; no new client links to sold
  properties.
- Non-goals: sending `lostReason` to the backend; a property "rented" status;
  reopening a sold property; any team / assignment UI.
- Anti-goals: one broker closing other brokers' deals without the owner;
  a broker retyping property data anywhere in this flow.

## Left to the builder

- Exact file for the shared "close property" helper in the backend.
- Where in the deal card / detail modal the "Waiting for owner" label lives
  (reuse the pending-offer display if present).
- Mock-mode (`isMockMode`) parity for the new behaviour in `lib/api/pipeline.ts`.
- Tests: backend unit tests for the three transactions and the two guards.
