# Pipeline: schedule a visit from the Site visit stage

Date: 2026-11-18 · Size: small change

## Intent

A deal in the **Site visit** stage needs a visit booked. The card should
prompt for it and take the broker to Visits with the deal's client and
property ready, so nothing is re-picked by hand.

## Decided with the user

- Site visit cards with no visit booked show "No visit booked yet" and a
  **Schedule visit** button.
- The button links to
  `/broker/visits?schedule=1&clientId=<client id>&propertyId=<property id>&leadId=<deal id>`.
- Cards with a visit booked keep the date/time line; the Reschedule link
  carries the same parameters.
- **Visits is not changed.** It is still a design preview with sample
  clients/properties and does not read the URL. Until the Visits API work
  reads these parameters, the button opens Visits without anything filled
  in.

## Approaches

- **Link with query parameters (chosen).** The pipeline owns only the link;
  Visits reads it when it is wired to the API. Nothing in Visits changes now.
- Make Visits read the parameters now: rejected by the user ("don't change
  anything in visit"), and its pickers only know sample records, so real ids
  would show blank anyway.
- Shared client-side store between the pages: no benefit over the URL, and a
  link survives refresh / sharing.

## Builder calls

- One pure helper `scheduleVisitHref(deal)` in `features/pipeline/` builds the
  URL; tested.
- Icons in the touched block move from `@iconify/react` to the Tabler
  registry (`AGENTS.md` icon rule).

## Contract for the Visits integration (later)

| Param        | Meaning                                                     |
| ------------ | ----------------------------------------------------------- |
| `schedule=1` | Open the schedule form on load                              |
| `clientId`   | Client (`DealItem.buyer.id`, API `clients.id`)              |
| `propertyId` | Property (`properties.id`)                                  |
| `leadId`     | Pipeline deal (`broker_property_leads.id`) the visit is for |
