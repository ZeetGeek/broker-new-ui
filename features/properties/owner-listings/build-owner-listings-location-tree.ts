import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

const DEFAULT_COUNTRY = "India";

const CITY_STATE_MAP: Record<string, string> = {
    Surat: "Gujarat",
    Bengaluru: "Karnataka",
    Mumbai: "Maharashtra",
    Pune: "Maharashtra",
    "New Delhi": "Delhi",
    Hyderabad: "Telangana",
    Chennai: "Tamil Nadu",
    Jaipur: "Rajasthan",
};

export type OwnerListingLocationLeaf = {
    locality: string;
    city: string;
    state: string;
    country: string;
    listingCount: number;
};

export type OwnerListingLocationCityGroup = {
    city: string;
    state: string;
    country: string;
    listingCount: number;
    localities: OwnerListingLocationLeaf[];
};

export type OwnerListingLocationStateGroup = {
    state: string;
    country: string;
    listingCount: number;
    cities: OwnerListingLocationCityGroup[];
};

export type OwnerListingLocationCountryGroup = {
    country: string;
    listingCount: number;
    states: OwnerListingLocationStateGroup[];
};

export type OwnerListingLocationSearchHit = OwnerListingLocationLeaf & {
    pathLabel: string;
};

function resolveStateForCity(city: string, state?: string): string {
    const trimmedState = state?.trim();
    if (trimmedState) return trimmedState;

    const normalizedCity = city.trim().toLowerCase();
    const mapped = Object.entries(CITY_STATE_MAP).find(
        ([key]) => key.toLowerCase() === normalizedCity,
    );
    return mapped?.[1] ?? city;
}

function resolveListingRegion(item: OwnerListingItem) {
    const country = item.country?.trim() || DEFAULT_COUNTRY;
    const state = resolveStateForCity(item.city, item.state);
    return {
        country,
        state,
        city: item.city,
        locality: item.locality,
    };
}

function sortByLabel<
    T extends { locality?: string; city?: string; state?: string; country?: string },
>(left: T, right: T, key: keyof T) {
    return String(left[key]).localeCompare(String(right[key]), "en-IN");
}

export function buildOwnerListingsLocationTree(
    items: OwnerListingItem[],
): OwnerListingLocationCountryGroup[] {
    const countryMap = new Map<string, Map<string, Map<string, Map<string, number>>>>();

    for (const item of items) {
        const region = resolveListingRegion(item);
        const states =
            countryMap.get(region.country) ?? new Map<string, Map<string, Map<string, number>>>();
        const cities = states.get(region.state) ?? new Map<string, Map<string, number>>();
        const localities = cities.get(region.city) ?? new Map<string, number>();
        const weight = Number(item.detailLabel);
        const increment = Number.isFinite(weight) && weight > 0 ? weight : 1;
        localities.set(region.locality, (localities.get(region.locality) ?? 0) + increment);
        cities.set(region.city, localities);
        states.set(region.state, cities);
        countryMap.set(region.country, states);
    }

    return [...countryMap.entries()]
        .map(([country, statesMap]) => {
            const states = [...statesMap.entries()]
                .map(([state, citiesMap]) => {
                    const cities = [...citiesMap.entries()]
                        .map(([city, localitiesMap]) => {
                            const localities = [...localitiesMap.entries()]
                                .map(([locality, listingCount]) => ({
                                    locality,
                                    city,
                                    state,
                                    country,
                                    listingCount,
                                }))
                                .sort((left, right) => sortByLabel(left, right, "locality"));

                            const listingCount = localities.reduce(
                                (sum, leaf) => sum + leaf.listingCount,
                                0,
                            );

                            return { city, state, country, listingCount, localities };
                        })
                        .sort((left, right) => sortByLabel(left, right, "city"));

                    const listingCount = cities.reduce((sum, city) => sum + city.listingCount, 0);

                    return { state, country, listingCount, cities };
                })
                .sort((left, right) => sortByLabel(left, right, "state"));

            const listingCount = states.reduce((sum, state) => sum + state.listingCount, 0);

            return { country, listingCount, states };
        })
        .sort((left, right) => sortByLabel(left, right, "country"));
}

function normalizeSearchValue(value: string) {
    return value.trim().toLowerCase();
}

export function searchOwnerListingLocations(
    tree: OwnerListingLocationCountryGroup[],
    query: string,
): OwnerListingLocationSearchHit[] {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) {
        return [];
    }

    const hits: OwnerListingLocationSearchHit[] = [];

    for (const countryGroup of tree) {
        for (const stateGroup of countryGroup.states) {
            for (const cityGroup of stateGroup.cities) {
                for (const leaf of cityGroup.localities) {
                    const haystack =
                        `${leaf.locality} ${leaf.city} ${leaf.state} ${leaf.country}`.toLowerCase();
                    if (haystack.includes(normalizedQuery)) {
                        hits.push({
                            ...leaf,
                            pathLabel: `${leaf.city}, ${leaf.state}`,
                        });
                    }
                }
            }
        }
    }

    return hits.sort((left, right) => {
        const leftStarts = left.locality.toLowerCase().startsWith(normalizedQuery);
        const rightStarts = right.locality.toLowerCase().startsWith(normalizedQuery);
        if (leftStarts !== rightStarts) {
            return leftStarts ? -1 : 1;
        }

        return left.locality.localeCompare(right.locality, "en-IN");
    });
}

export function groupOwnerListingLocationsByCity(
    tree: OwnerListingLocationCountryGroup[],
): OwnerListingLocationCityGroup[] {
    const cities: OwnerListingLocationCityGroup[] = [];

    for (const countryGroup of tree) {
        for (const stateGroup of countryGroup.states) {
            cities.push(...stateGroup.cities);
        }
    }

    return cities.sort((left, right) => left.city.localeCompare(right.city, "en-IN"));
}

export function flattenOwnerListingLocationLeaves(
    tree: OwnerListingLocationCountryGroup[],
): OwnerListingLocationLeaf[] {
    const leaves: OwnerListingLocationLeaf[] = [];

    for (const countryGroup of tree) {
        for (const stateGroup of countryGroup.states) {
            for (const cityGroup of stateGroup.cities) {
                leaves.push(...cityGroup.localities);
            }
        }
    }

    return leaves;
}
