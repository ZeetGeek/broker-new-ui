/** Namespaced localStorage keys for listing / filter UI prefs. */
export const PREF_KEYS = {
    broker: {
        ownerListings: {
            filters: "yb.broker.ownerListings.filters",
            view: "yb.broker.ownerListings.view",
        },
        myListings: {
            filters: "yb.broker.myListings.filters",
            view: "yb.broker.myListings.view",
            requestsStatus: "yb.broker.myListings.requestsStatus",
        },
        requests: {
            filters: "yb.broker.requests.filters",
            invitesFilters: "yb.broker.requests.invitesFilters",
            view: "yb.broker.requests.view",
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
        requests: {
            view: "yb.owner.requests.view",
        },
        leads: {
            layout: "yb.owner.leads.layout",
        },
    },
} as const;

/** Legacy keys to migrate once into PREF_KEYS. */
export const LEGACY_PREF_KEYS = {
    ownerListingsView: "owner_listings_view",
    ownerListingsWhereScope: "owner_listings_where_scope",
    ownerListingsYourAreas: "owner_listings_your_areas",
    myListingsView: "my_listings_view",
    myRequestsView: "my_requests_view",
} as const;
