"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useCountries } from "@/hooks/use-locations";

import { Globe2 } from "@/components/shared/icons";
import { OptionCombobox } from "@/components/shared/option-combobox";

/**
 * The visitor's likely country from the browser language (`en-IN` → `IN`).
 * Only a starting suggestion — the picker is always shown and confirmed.
 */
function guessCountryIso2(): string {
    if (typeof navigator === "undefined") return "";
    for (const locale of navigator.languages ?? [navigator.language]) {
        const region = locale.split("-")[1];
        if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
    }
    return "";
}

const noSubscription = () => () => {};

/**
 * The suggested country, read without an effect: empty during server render
 * and hydration, the browser's region once on the client.
 */
export function useSuggestedCountryIso2(): string {
    return useSyncExternalStore(noSubscription, guessCountryIso2, () => "");
}

/**
 * Country of the market an account works in. Its value is the ISO2 code the
 * API expects; the label carries the flag, name and currency so the user sees
 * what prices will be shown in.
 */
export function CountryPicker({
    id,
    value,
    onValueChange,
    errorText,
    disabled,
}: {
    id: string;
    /** ISO2, e.g. `IN`. */
    value: string;
    onValueChange: (countryIso2: string) => void;
    errorText?: string;
    disabled?: boolean;
}) {
    const { data: countries = [], isLoading } = useCountries();

    const options = useMemo(
        () =>
            countries.map((country) => ({
                value: country.iso2,
                label: [
                    country.emoji,
                    country.name,
                    country.currency ? `(${country.currency.code})` : null,
                ]
                    .filter(Boolean)
                    .join(" "),
            })),
        [countries],
    );

    // A guessed code the list does not carry must not show as a raw "IN".
    const known = !value || options.some((option) => option.value === value);

    return (
        <OptionCombobox
            id={id}
            size="lg"
            value={known ? value : ""}
            options={options}
            onValueChange={onValueChange}
            placeholder="Choose your country"
            startIcon={Globe2}
            loading={isLoading}
            disabled={disabled}
            emptyText="No countries match"
            limit={50}
            errorText={errorText}
            helperText="You will see listings and prices from this country."
        />
    );
}
