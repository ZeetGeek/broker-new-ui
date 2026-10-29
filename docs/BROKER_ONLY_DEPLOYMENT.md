# Broker-only launch configuration

Set `NEXT_PUBLIC_FEATURE_PLATFORM_OWNER=false` in the deployment build environment.
An unset value also disables owner features. Only the exact value `true` enables
the owner phase; empty, misspelled, or differently capitalized values keep it off.

This public setting is compiled into browser assets. Rebuild and deploy after
changing it; changing a running server's environment alone does not change the
client bundle. Keep mock mode off for the live API.

After building with production settings, verify the served application:

- `/register`, including `?portal=owner`, offers broker onboarding only.
- `/owner/*` redirects to `/owner-unavailable`.
- `/broker/owner-listings` and `/broker/my-deals` redirect to the dashboard.
- `/broker/your-listings?tab=requests` and `/broker/my-properties?tab=requests`
  redirect to `/broker/your-listings` without opening representation requests.
- `/broker/owners/:id` redirects to Contacts. Broker-added owner contacts remain
  available there.
- Saved properties shows the broker's inventory and links to Your listings.
  Owner-pool bookmarks remain stored for the later phase, but do not appear in
  the grid or its visible count. No representation reminders or chat mount from
  this page in broker-only mode.

These are frontend launch gates. Backend policy is managed in the separate API
repository. Deployment settings and the actual served build must be checked at
release time; local checks alone do not establish production configuration.
