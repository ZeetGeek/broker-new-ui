import type { BrokerProfile, OwnerBrokersSort } from "@/lib/api/representative";

/** Sorting runs server-side so the scrolled pages stay in one order. */
export type BrowseBrokersSort = OwnerBrokersSort;

export type BrowseBrokersExperience = 0 | 2 | 5 | 10;

export type BrowseBrokersFilters = {
    verifiedOnly: boolean;
    minExperience: BrowseBrokersExperience;
    /** Lower-cased specialization key; "" means any. */
    specialty: string;
    sort: BrowseBrokersSort;
};

export const DEFAULT_BROWSE_BROKERS_FILTERS: BrowseBrokersFilters = {
    verifiedOnly: false,
    minExperience: 0,
    specialty: "",
    sort: "relevance",
};

export function hasActiveBrowseFilters(filters: BrowseBrokersFilters): boolean {
    return filters.verifiedOnly || filters.minExperience > 0 || filters.specialty !== "";
}

export function brokerDisplayName(broker: BrokerProfile): string {
    return (
        broker.displayName?.trim() || broker.fullName?.trim() || broker.orgName?.trim() || "Broker"
    );
}
