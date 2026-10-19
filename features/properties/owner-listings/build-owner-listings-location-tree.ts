import { formatLocationPathLabel, formatPlaceName } from "@/lib/format/owner-listings-labels";

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

export type OwnerListingLocationSearchHit =
    | {
          kind: "country";
          country: string;
          listingCount: number;
          pathLabel: string;
      }
    | {
          kind: "state";
          country: string;
          state: string;
          listingCount: number;
          pathLabel: string;
      }
    | {
          kind: "city";
          country: string;
          state: string;
          city: string;
          listingCount: number;
          pathLabel: string;
      }
    | {
          kind: "locality";
          locality: string;
          city: string;
          state: string;
          country: string;
          listingCount: number;
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

function matchesQuery(label: string, query: string) {
    return label.toLowerCase().includes(query);
}

function startsWithQuery(label: string, query: string) {
    return label.toLowerCase().startsWith(query);
}

const KIND_RANK: Record<OwnerListingLocationSearchHit["kind"], number> = {
    country: 0,
    state: 1,
    city: 2,
    locality: 3,
};

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
        if (matchesQuery(countryGroup.country, normalizedQuery)) {
            hits.push({
                kind: "country",
                country: countryGroup.country,
                listingCount: countryGroup.listingCount,
                pathLabel: "Country",
            });
        }

        for (const stateGroup of countryGroup.states) {
            if (matchesQuery(stateGroup.state, normalizedQuery)) {
                hits.push({
                    kind: "state",
                    country: stateGroup.country,
                    state: stateGroup.state,
                    listingCount: stateGroup.listingCount,
                    pathLabel: formatPlaceName(stateGroup.country),
                });
            }

            for (const cityGroup of stateGroup.cities) {
                if (matchesQuery(cityGroup.city, normalizedQuery)) {
                    hits.push({
                        kind: "city",
                        country: cityGroup.country,
                        state: cityGroup.state,
                        city: cityGroup.city,
                        listingCount: cityGroup.listingCount,
                        pathLabel: formatLocationPathLabel("", cityGroup.state, cityGroup.country),
                    });
                }

                for (const leaf of cityGroup.localities) {
                    if (matchesQuery(leaf.locality, normalizedQuery)) {
                        hits.push({
                            kind: "locality",
                            locality: leaf.locality,
                            city: leaf.city,
                            state: leaf.state,
                            country: leaf.country,
                            listingCount: leaf.listingCount,
                            pathLabel: formatLocationPathLabel(leaf.city, leaf.state, leaf.country),
                        });
                    }
                }
            }
        }
    }

    return hits.sort((left, right) => {
        const leftLabel =
            left.kind === "country"
                ? left.country
                : left.kind === "state"
                  ? left.state
                  : left.kind === "city"
                    ? left.city
                    : left.locality;
        const rightLabel =
            right.kind === "country"
                ? right.country
                : right.kind === "state"
                  ? right.state
                  : right.kind === "city"
                    ? right.city
                    : right.locality;

        const leftStarts = startsWithQuery(leftLabel, normalizedQuery);
        const rightStarts = startsWithQuery(rightLabel, normalizedQuery);
        if (leftStarts !== rightStarts) {
            return leftStarts ? -1 : 1;
        }

        const kindDelta = KIND_RANK[left.kind] - KIND_RANK[right.kind];
        if (kindDelta !== 0) return kindDelta;

        return leftLabel.localeCompare(rightLabel, "en-IN");
    });
}

export function findCountryGroup(
    tree: OwnerListingLocationCountryGroup[],
    country: string,
): OwnerListingLocationCountryGroup | undefined {
    return tree.find((group) => group.country.toLowerCase() === country.toLowerCase());
}

export function findStateGroup(
    tree: OwnerListingLocationCountryGroup[],
    country: string,
    state: string,
): OwnerListingLocationStateGroup | undefined {
    return findCountryGroup(tree, country)?.states.find(
        (group) => group.state.toLowerCase() === state.toLowerCase(),
    );
}

export function findCityGroup(
    tree: OwnerListingLocationCountryGroup[],
    country: string,
    state: string,
    city: string,
): OwnerListingLocationCityGroup | undefined {
    return findStateGroup(tree, country, state)?.cities.find(
        (group) => group.city.toLowerCase() === city.toLowerCase(),
    );
}

export function citiesInCountry(
    tree: OwnerListingLocationCountryGroup[],
    country: string,
): string[] {
    const group = findCountryGroup(tree, country);
    if (!group) return [];
    return group.states.flatMap((state) => state.cities.map((city) => city.city));
}

export function citiesInState(
    tree: OwnerListingLocationCountryGroup[],
    country: string,
    state: string,
): string[] {
    const group = findStateGroup(tree, country, state);
    if (!group) return [];
    return group.cities.map((city) => city.city);
}

export function sameCitySet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false;
    const normalized = new Set(left.map((city) => city.toLowerCase()));
    return right.every((city) => normalized.has(city.toLowerCase()));
}

/** Stable Where-filter key for a state under a country. */
export function encodeOwnerListingStateKey(country: string, state: string): string {
    return `${country}|${state}`;
}

export function decodeOwnerListingStateKey(key: string): { country: string; state: string } {
    const index = key.indexOf("|");
    if (index <= 0) return { country: "", state: key };
    return { country: key.slice(0, index), state: key.slice(index + 1) };
}

export function toggleStringList(list: string[], value: string): string[] {
    const needle = value.toLowerCase();
    const exists = list.some((item) => item.toLowerCase() === needle);
    if (exists) {
        return list.filter((item) => item.toLowerCase() !== needle);
    }
    return [...list, value];
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
