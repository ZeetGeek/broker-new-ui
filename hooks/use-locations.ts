"use client";

import { useEffect, useMemo, useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { type CityItem, type CountryItem, locationsApi, type StateItem } from "@/lib/api/locations";

import type { PropertyOption } from "@/constants/property";

/**
 * Location master data barely ever changes, and the backend already stores an
 * imported country permanently — so cache hard and never refetch on focus.
 */
const LOCATION_STALE_TIME = 24 * 60 * 60 * 1000;

/**
 * Localities grow as people search (a miss is filled from Google Maps), so
 * they are cached for minutes, not a day.
 */
const LOCALITY_STALE_TIME = 5 * 60 * 1000;

/** Wait this long after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function toOptions(items: readonly { name: string }[]): PropertyOption[] {
    // Value is the name, not the id: properties store the country / state /
    // city as text, so the form keeps sending names to the property API.
    return items.map((item) => ({ value: item.name, label: item.name }));
}

export function useCountries() {
    return useQuery({
        queryKey: ["locations", "countries"],
        queryFn: () => locationsApi.countries(),
        staleTime: LOCATION_STALE_TIME,
        refetchOnWindowFocus: false,
    });
}

/**
 * All states of a country. Disabled until a country is picked. The first call
 * for a country the backend has not imported yet is the slow one.
 */
export function useStates(countryIso2: string | null | undefined) {
    return useQuery({
        queryKey: ["locations", "states", countryIso2],
        queryFn: () => locationsApi.states(countryIso2!),
        enabled: Boolean(countryIso2),
        staleTime: LOCATION_STALE_TIME,
        refetchOnWindowFocus: false,
    });
}

/** All cities of a state. Disabled until a state is picked. */
export function useCities(stateId: string | null | undefined) {
    return useQuery({
        queryKey: ["locations", "cities", stateId],
        queryFn: () => locationsApi.cities(stateId!),
        enabled: Boolean(stateId),
        staleTime: LOCATION_STALE_TIME,
        refetchOnWindowFocus: false,
    });
}

/** `value`, but only after it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

/** Cities of a whole country matching `search`. Disabled until a country is known. */
export function useCitySearch(
    countryIso2: string | null | undefined,
    search: string,
    options: { enabled?: boolean } = {},
) {
    const term = search.trim();
    return useQuery({
        queryKey: ["locations", "city-search", countryIso2, term.toLowerCase()],
        queryFn: () => locationsApi.searchCities(countryIso2!, { search: term, limit: 20 }),
        enabled: Boolean(countryIso2) && (options.enabled ?? true),
        staleTime: LOCATION_STALE_TIME,
        refetchOnWindowFocus: false,
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[2] === countryIso2 ? keepPreviousData(previous) : undefined,
    });
}

/**
 * Localities of a city matching `search`. Callers debounce `search` — every
 * miss on the backend is a billed Google Maps call.
 */
export function useLocalitySearch(
    cityId: string | null | undefined,
    search: string,
    options: { enabled?: boolean } = {},
) {
    const term = search.trim();
    return useQuery({
        queryKey: ["locations", "localities", cityId, term.toLowerCase()],
        queryFn: () => locationsApi.localities(cityId!, { search: term, limit: 20 }),
        enabled: Boolean(cityId) && (options.enabled ?? true),
        staleTime: LOCALITY_STALE_TIME,
        refetchOnWindowFocus: false,
        // Keep the last list on screen while the next keystroke's results
        // load, but never show another city's localities.
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[2] === cityId ? keepPreviousData(previous) : undefined,
    });
}

export type LocationOptions = {
    countryOptions: PropertyOption[];
    stateOptions: PropertyOption[];
    cityOptions: PropertyOption[];
    countriesLoading: boolean;
    statesLoading: boolean;
    citiesLoading: boolean;
    selectedCountry: CountryItem | null;
    selectedState: StateItem | null;
    /** Resolved from `cityName`; its id drives the locality search. */
    selectedCity: CityItem | null;
};

/**
 * Cascading country -> state -> city options for the address fields.
 *
 * The form holds plain names, so the selected country and state are resolved
 * back to their ISO2 code / id here to drive the next request down the chain.
 */
export function useLocationOptions(selected: {
    countryName?: string | null;
    stateName?: string | null;
    cityName?: string | null;
}): LocationOptions {
    const { countryName, stateName, cityName } = selected;

    const countriesQuery = useCountries();
    const countries = countriesQuery.data ?? [];

    const selectedCountry = useMemo(
        () => countries.find((country) => sameName(country.name, countryName)) ?? null,
        [countries, countryName],
    );

    const statesQuery = useStates(selectedCountry?.iso2);
    const states = statesQuery.data ?? [];

    const selectedState = useMemo(
        () => states.find((state) => sameName(state.name, stateName)) ?? null,
        [states, stateName],
    );

    const citiesQuery = useCities(selectedState?.id);
    const cities = citiesQuery.data ?? [];

    const selectedCity = useMemo(
        () => cities.find((city) => sameName(city.name, cityName)) ?? null,
        [cities, cityName],
    );

    return {
        countryOptions: useMemo(() => toOptions(countries), [countries]),
        stateOptions: useMemo(() => toOptions(states), [states]),
        cityOptions: useMemo(() => toOptions(cities), [cities]),
        countriesLoading: countriesQuery.isPending,
        statesLoading: statesQuery.isFetching,
        citiesLoading: citiesQuery.isFetching,
        selectedCountry,
        selectedState,
        selectedCity,
    };
}

/**
 * Resolves a country name and a city name, as a profile stores them, to the
 * country ISO2 and city id the location searches need. Either is null until it
 * matches a stored row exactly.
 */
export function useResolvedCity(selected: {
    countryName?: string | null;
    cityName?: string | null;
}): { countryIso2: string | null; cityId: string | null } {
    const { countryName, cityName } = selected;

    const countriesQuery = useCountries();
    const countryIso2 = useMemo(
        () =>
            (countriesQuery.data ?? []).find((country) => sameName(country.name, countryName))
                ?.iso2 ?? null,
        [countriesQuery.data, countryName],
    );

    const cityQuery = useCitySearch(countryIso2, cityName ?? "", {
        enabled: Boolean(cityName?.trim()),
    });
    const cityId = useMemo(
        () => (cityQuery.data ?? []).find((city) => sameName(city.name, cityName))?.id ?? null,
        [cityQuery.data, cityName],
    );

    return { countryIso2, cityId };
}
