# YesBroker

> **The name "YesBroker" is a PLACEHOLDER.** The real product name has not been
> decided yet. Do not treat it as final branding. Keep the name in one place
> (a config constant or env var) so it can be changed in a single edit later.
> Do not scatter it across UI copy, page titles, or file names.

---

## What this platform is

A real estate CRM and marketplace for the **Indian market**, connecting two
sides of a property deal in one system:

- **Owners** — property owners and builders who have property to sell or rent
- **Brokers** — real estate agents and agencies who find buyers/tenants

Most existing products do only one of these. Listing portals hold owner supply
but give brokers no pipeline. Broker CRMs give a pipeline but the broker must
type in every property by hand. This platform connects the two.

---

## The core loop (this is the whole product)

```
Owner lists a property
  → Broker browses the live property pool
  → Broker sends a "request to represent"
  → Owner approves or rejects
  → On approval, the property lands in the broker's CRM pipeline automatically
  → Broker works the deal to close
```

The critical property of this loop: **no manual re-entry anywhere.** The
property is entered once, by the owner, and flows into the broker's pipeline
on approval. If a change would force a broker to retype property data, that
change is wrong.

The approval step is consent-gated and **bidirectional** — an owner can also
invite a specific broker, not only wait for requests.

---

## Roles — there are only TWO

**Owner** and **Broker**. That is the complete list.

There is **no** admin role, **no** agency role, and **no** team-member role.
If a feature seems to need one, it does not — re-read this section.

Account type is a **flag on the account**, not a role:

| `account_type` | Chosen at signup as | Can manage a team? |
|---|---|---|
| `individual` | Independent Owner / Independent Broker | No |
| `organization` | Builder Company / Broker Agency | Yes |

Organization accounts can create and manage a **team** — add members, set
configurable access, define assignment rules, suspend or remove members. Team
members sit **under** the organization account. They are still just Owner or
Broker; being on a team is not a third role.

---

## Domain vocabulary

Use these exact terms. They mean specific things.

| Term | Meaning |
|---|---|
| **Representation** | The consent-gated relationship between an owner and a broker for a specific property. Created by request + approval. |
| **Request to represent** | A broker asking an owner for permission to represent a property. Not a purchase, not an inquiry. |
| **Broker property lead** | An owner-facing mirror of a broker's CRM client record. Denormalized on purpose. |
| **Portal** | The owner-side vs broker-side split of the app. A user sees one portal, never both. |
| **Pipeline** | The broker's CRM stages a client moves through toward a closed deal. |

Note on user-facing language: internal terms are not always the right words to
show users. "Request to represent" reads better to an owner as something like
"a broker wants to sell your property." Plain language wins in the UI.

---

## Market context

- Target market is **India**; first launch is a **single city** (Surat),
  not a nationwide rollout
- Users are onboarded **by hand** in the first phase, from personal contacts —
  not through marketing or paid acquisition
- Users are **not technical**, and will mostly be on **inexpensive Android
  phones**, not laptops
- Money is in **INR**; property prices are large numbers and are read in
  lakh/crore terms, not raw digits

---

## Repo boundary

This repository is the **frontend only**.

The backend is a **completely separate repository** (`yesbroker-api`,
NestJS + Prisma + PostgreSQL). It is **not** a monorepo.

Never assume backend files, schema files, migrations, or server code exist in
this repo. Data comes from the API over HTTP.

---

## Scope — what is NOT being built yet

The first phase is deliberately narrow: make the core loop work well in one
city, on a phone. The following are explicitly **deferred** and should not be
built, scaffolded, or designed for right now:

- WhatsApp Business API automation
- Payments, subscriptions, or pricing tiers
- In-app chat or messaging between users
- Ratings, reviews, and public reputation scores
- Team management UI (the data model supports it; the screens are later)
- Any AI features (listing writer, matching, lead scoring, price suggestion)
- Buyer-facing accounts or buyer login

If a request seems to need one of these, flag it rather than building it.

---

## Open questions

These are genuinely undecided. Do not invent an answer — ask.

- Final product name and domain
- What "free" means and for how long
- Exact pipeline stage names and count

---

*Sections for UI conventions, SEO, and code style will be added to this file
later. They are intentionally absent for now.*
