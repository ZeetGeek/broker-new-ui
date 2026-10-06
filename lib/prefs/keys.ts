/** Namespaced localStorage keys for listing / filter UI prefs. */
export const PREF_KEYS = {
    broker: {
        ownerListings: {
            filters: "yb.broker.ownerListings.filters",
        },
        myListings: {
            filters: "yb.broker.myListings.filters",
            requestsStatus: "yb.broker.myListings.requestsStatus",
        },
        requests: {
            filters: "yb.broker.requests.filters",
            invitesFilters: "yb.broker.requests.invitesFilters",
        },
        pipeline: {
            prefs: "yb.broker.pipeline.prefs",
        },
        contacts: {
            prefs: "yb.broker.contacts.prefs",
        },
        referrals: {
            prefs: "yb.broker.referrals.prefs",
        },
        visits: {
            prefs: "yb.broker.visits.prefs",
        },
    },
    owner: {
        visits: {
            prefs: "yb.owner.visits.prefs",
        },
        leads: {
            layout: "yb.owner.leads.layout",
        },
    },
} as const;

/** Legacy keys to migrate once into PREF_KEYS. */
export const LEGACY_PREF_KEYS = {
    ownerListingsWhereScope: "owner_listings_where_scope",
    ownerListingsYourAreas: "owner_listings_your_areas",
} as const;
