# Test lab

Open **Test lab** at the bottom of any page in development, choose a setup, and press **Apply & reload**. The floating button stays available on loading, empty, and error screens so you can recover without editing code. Settings apply to the current browser tab and survive navigation and reloads.

| Control                   | What it does                                                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sample data               | Uses local fixtures and a separate sample login. No backend is needed.                                                                                               |
| Live API                  | Uses the configured API and your existing real login. Disables fixture and analytics previews.                                                                       |
| Less data                 | Up to 3 records in each fixture collection.                                                                                                                          |
| More data                 | At least 30 records, retaining larger existing fixture collections.                                                                                                  |
| Too much data             | 300 records in each main fixture collection, before filters and pagination.                                                                                          |
| Empty all                 | Clears sample records across the workspace and discovery pool, including dashboard aggregates.                                                                       |
| New account               | A fresh account date and incomplete profile. The selected data volume still controls all sample records. Pair with Empty all to test a completely empty new account. |
| Incomplete profile        | Removes sample service areas and RERA details.                                                                                                                       |
| Email not verified        | Sets the sample account's email verification flag to false.                                                                                                          |
| Signed out                | Opens login without touching the real session.                                                                                                                       |
| Individual / Organization | Changes the account type flag; it does not enable deferred team features.                                                                                            |
| Test awkward content      | Adds long names/titles and removes some images to exercise wrapping and fallbacks.                                                                                   |

Connection conditions affect sample reads and saves: normal responses, a 2.5-second delay per adapter call, offline failures, pending loading, server errors (500), unauthorized responses (401), access denied (403), and rate limits (429). Account bootstrap remains available so the portal and lab can open. Use Signed out to test actual login routing. **Loading** stays pending until another setup is applied. Nested adapter calls can incur more than one delay.

Applying a setup reseeds sample state and reloads the current route. **Reset samples** restores the standard populated, online sample account. **Project defaults** restores the repository's environment-controlled data source. Neither action clears real session keys or real task storage. Resetting from a detail URL whose record is absent in the new setup can correctly show “not found”; use the normal navigation to open a list.

Main fixture sources include clients, exclusive owners, property inventory and discovery, pipeline deals, visits, tasks, requests/invites, notifications, referrals, and dashboard summaries. Expanded records have unique IDs and matching foreign-key suffixes. Lists filter and paginate the complete fixture collection. The current Visits screen has local booking, rescheduling, reminder, cancellation, and outcome handlers. Existing mock adapters continue to handle the other supported sample actions. Sample edits are disposable; applying another setup resets them.

This is a UI state testing tool, not a replacement for backend integration tests. An HTTP action without a sample adapter returns an explicit error identifying the unsupported action; it never sends a sample token to the backend or pretends an empty object is a successful response. Use Live API for backend validation, uploads, and unsupported actions. Product launch flags continue to apply: the Owner portal selector appears only when `NEXT_PUBLIC_FEATURE_PLATFORM_OWNER=true`.

The lab is hidden and ignores saved lab settings in production builds. To include it deliberately in a deployed preview, set `NEXT_PUBLIC_ENABLE_TEST_LAB=true` **before building**. Existing `NEXT_PUBLIC_USE_MOCK_DATA` behavior remains the default until the lab is applied.

Implementation: `lib/testing/` owns settings, fixture expansion, request simulation, and sample visits. `components/dev-tools/test-lab.tsx` supplies the global controls. Add future fixture collections through `testData` **before** filtering/pagination and wrap API adapters with `withTestNetwork` so all states stay testable.

Dashboard regression checks cover today's actual date-only visit filters, repeated task-storage reads, and all 300 task records in stress mode. Generated task titles stay within the existing 160-character limit when copies receive labels. Date-only visit bounds use the India calendar date; timestamp bounds compare instants. Dashboard cards remain compact views of the dataset, with full lists available through their normal navigation.
