# Property form: remaining API work

The frontend fixes do not change the backend or assume new request fields.

## Fields currently stored only on the device

The form retains unit number, carpet area, property age, property condition and
coworking seats in account- and portal-scoped local extras. Existing response
values are loaded when supplied. The current create/update request contract in
`lib/api/properties.ts` has no corresponding write fields. Add and verify those
fields in the backend contract before wiring them into the frontend payload.
These details will not follow the user to a different device yet. The form
explains that limit.

## Clear semantics

Define how updates remove an existing society, exclusive owner and optional
numeric values. The current multipart helper omits empty/null values, so the
frontend does not claim those removals work. The form blocks clearing an existing
society or owner and explains how to keep or replace it. Price/commission fields
remain required for their active transaction type. Verify cleanup of old price,
commission and rent fields when changing sale/rent/both before supporting explicit
clears; do not infer a null or empty-string protocol.

## Photos

The form now consistently caps cover plus gallery at 10 photos, matching the
previous upload path. It submits every accepted photo, blocks while processing,
and does not silently truncate older larger drafts. Confirm the server's limit
before increasing the shared `MAX_PROPERTY_PHOTOS` constant. A different existing
cover/order on edit still needs a documented API contract for photo ordering.

## Buyer links

The frontend now calls the existing `clientsApi.setPropertyClients` endpoint after
the property save. Failed attachments are explicitly retryable without creating
another property, and the pending retry is retained in the local draft. Existing
links are displayed separately; adding selections preserves them. This uses the
existing API and requires no new endpoint.

## Local recovery

New and edit drafts are isolated by account, portal and property. IndexedDB stores
the actual photo files; localStorage is a text-only fallback and reports when
photos could not be saved. Old unscoped create drafts are retained but are not
automatically imported because their original account cannot be established.
