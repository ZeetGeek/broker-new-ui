"use client";

import { useLocationOptions } from "@/hooks/use-locations";

import { ComboboxField } from "@/features/contacts/contact-form-ui";

export function ContactLocationFields({
    country,
    state,
    city,
    onCountryChange,
    onStateChange,
    onCityChange,
    countryError,
    stateError,
    cityError,
}: {
    country: string;
    state: string;
    city: string;
    onCountryChange: (country: string) => void;
    onStateChange: (state: string) => void;
    onCityChange: (city: string) => void;
    countryError?: string;
    stateError?: string;
    cityError?: string;
}) {
    const {
        countryOptions,
        stateOptions,
        cityOptions,
        countriesLoading,
        statesLoading,
        citiesLoading,
    } = useLocationOptions({
        countryName: country,
        stateName: state,
    });

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ComboboxField
                label="Country"
                required
                value={country}
                placeholder={countriesLoading ? "Loading…" : "Country"}
                emptyText="No country matches"
                options={countryOptions}
                error={countryError}
                onChange={(next) => {
                    onCountryChange(next);
                    onStateChange("");
                    onCityChange("");
                }}
            />
            <ComboboxField
                label="State"
                required
                value={state}
                placeholder={
                    !country ? "Pick a country first" : statesLoading ? "Loading…" : "State"
                }
                emptyText="No state matches"
                options={stateOptions}
                error={stateError}
                onChange={(next) => {
                    onStateChange(next);
                    onCityChange("");
                }}
            />
            <ComboboxField
                label="City"
                required
                value={city}
                placeholder={!state ? "Pick a state first" : citiesLoading ? "Loading…" : "City"}
                emptyText="No city matches"
                options={cityOptions}
                error={cityError}
                onChange={onCityChange}
            />
        </div>
    );
}
