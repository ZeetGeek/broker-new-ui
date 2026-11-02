"use client";

import { useEffect } from "react";

import { useLocationOptions } from "@/hooks/use-locations";
import { useMarket } from "@/hooks/use-market";

import { Building2, Globe2, Map } from "@/components/shared/icons";

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
    const market = useMarket();
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

    // The country is chosen once, at registration. A contact saved under another
    // country is moved over, and its state / city — which belonged there — cleared.
    useEffect(() => {
        if (!market || country === market.name) return;
        onCountryChange(market.name);
        if (country) {
            onStateChange("");
            onCityChange("");
        }
    }, [market, country, onCountryChange, onStateChange, onCityChange]);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ComboboxField
                label="Country"
                loading={countriesLoading && countryOptions.length === 0}
                startIcon={Globe2}
                required
                value={country}
                placeholder={countriesLoading ? "Loading…" : "Country"}
                emptyText="No country matches"
                options={countryOptions}
                error={countryError}
                disabled={Boolean(market)}
                hint={market ? "Set from your account" : undefined}
                onChange={(next) => {
                    onCountryChange(next);
                    onStateChange("");
                    onCityChange("");
                }}
            />
            <ComboboxField
                label="State"
                loading={Boolean(country) && statesLoading && stateOptions.length === 0}
                startIcon={Map}
                disabled={!country}
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
                loading={Boolean(state) && citiesLoading && cityOptions.length === 0}
                startIcon={Building2}
                disabled={!state}
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
