import type { BrokerProfile } from "@/lib/api/representative";

export type BrowseBrokersSort = "relevance" | "experience" | "deals" | "name";

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

function specialtyKey(value: string): string {
    return value.trim().toLowerCase();
}

/** Distinct specializations across the loaded brokers, most common first. */
export function collectSpecialties(brokers: BrokerProfile[]): { key: string; label: string }[] {
    const counts = new Map<string, { label: string; count: number }>();
    for (const broker of brokers) {
        for (const raw of broker.specializations ?? []) {
            const key = specialtyKey(raw);
            if (!key) continue;
            const entry = counts.get(key);
            if (entry) entry.count += 1;
            else counts.set(key, { label: raw.trim(), count: 1 });
        }
    }
    return [...counts.entries()]
        .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
        .map(([key, { label }]) => ({ key, label }));
}

export function filterAndSortBrokers(
    brokers: BrokerProfile[],
    filters: BrowseBrokersFilters,
): BrokerProfile[] {
    const filtered = brokers.filter((broker) => {
        if (filters.verifiedOnly && !broker.verified) return false;
        if (filters.minExperience > 0 && (broker.experienceYears ?? 0) < filters.minExperience) {
            return false;
        }
        if (
            filters.specialty &&
            !(broker.specializations ?? []).some((s) => specialtyKey(s) === filters.specialty)
        ) {
            return false;
        }
        return true;
    });

    if (filters.sort === "relevance") {
        // Server order, but verified brokers lead.
        return filtered
            .map((broker, index) => ({ broker, index }))
            .sort(
                (a, b) =>
                    Number(!!b.broker.verified) - Number(!!a.broker.verified) || a.index - b.index,
            )
            .map(({ broker }) => broker);
    }

    const next = [...filtered];
    next.sort((a, b) => {
        if (filters.sort === "experience") {
            return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
        }
        if (filters.sort === "deals") {
            return (b.dealsClosed ?? 0) - (a.dealsClosed ?? 0);
        }
        return brokerDisplayName(a).localeCompare(brokerDisplayName(b));
    });
    return next;
}
