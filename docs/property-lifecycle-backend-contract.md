# Property lifecycle API integration

The frontend now separates inventory lifecycle (Published, Draft, Recently
deleted) from deal outcomes in Pipeline. The following is a **proposed contract**;
these endpoints have not been verified against the separate `yesbroker-api` repo.
Do not consider recoverable deletion production-ready until these are implemented
and integration-tested.

| Action                | Request                            | Expected behavior                                                                                                                                                                                                     |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List inventory        | `GET /properties`                  | Exclude deleted properties. Filter `publishStatus` independently of sold availability. Counts include all properties in that publish state.                                                                           |
| List recently deleted | `GET /properties/deleted`          | Same search, property filters, sort and pagination as inventory; only deleted properties. Return `{items,total,page,limit,totalPages}`. Each item includes `deletedAt` and its listing facts. Register before `/:id`. |
| Recoverable delete    | `POST /properties/:id/delete`      | Set `deletedAt`, remove from public discovery, retain recoverable property data and photos.                                                                                                                           |
| Restore               | `POST /properties/:id/restore`     | Clear `deletedAt`, restore as **draft**, preserve property ID and existing client/deal references. Never republish automatically.                                                                                     |
| Permanent removal     | `DELETE /properties/:id/permanent` | Only accept an already-deleted property. Remove listing content/photos; retain historical deal records and their property snapshots.                                                                                  |

Writes can return an empty successful response. The UI refetches inventory and
counts after success. Authorize all actions against the authenticated account.
Deleted properties must not accept new clients or representation requests.
Neither deleting nor restoring a property changes client stages or deal outcomes.
Define transactional behavior for active representations and visits in the backend.

The frontend deliberately does **not** fall back to the legacy
`DELETE /properties/:id` endpoint: it previously performed permanent removal.
Unsupported lifecycle endpoints show an error and retain the current UI data.
No retention period or automatic purge is assumed by the frontend.

Pipeline continues to use existing per-deal stage endpoints for closed, lost and
reopened outcomes. Closing one deal must not silently close other clients' deals.
