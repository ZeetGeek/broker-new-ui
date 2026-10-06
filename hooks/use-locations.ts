"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { locationsApi, type CountryItem, type StateItem } from "@/lib/api/locations";

import type { PropertyOption } from "@/constants/property";

/**
 * Location master data barely ever changes, and the backend already stores an
 * imported country permanently — so cache hard and never refetch on focus.
 */
const LOCATION_STALE_TIME = 24 * 60 * 60 * 1000;

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

export type LocationOptions = {
    countryOptions: PropertyOption[];
    stateOptions: PropertyOption[];
    cityOptions: PropertyOption[];
    countriesLoading: boolean;
    statesLoading: boolean;
    citiesLoading: boolean;
    selectedCountry: CountryItem | null;
    selectedState: StateItem | null;
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
}): LocationOptions {
    const { countryName, stateName } = selected;

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

    return {
        countryOptions: useMemo(() => toOptions(countries), [countries]),
        stateOptions: useMemo(() => toOptions(states), [states]),
        cityOptions: useMemo(() => toOptions(cities), [cities]),
        countriesLoading: countriesQuery.isPending,
        statesLoading: statesQuery.isFetching,
        citiesLoading: citiesQuery.isFetching,
        selectedCountry,
        selectedState,
    };
}
