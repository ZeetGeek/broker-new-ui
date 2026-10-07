"use client";

import { useMemo, useState } from "react";

import { MapPin } from "lucide-react";

import { useCitySearch, useDebouncedValue } from "@/hooks/use-locations";

import { SearchCombobox, type SearchOption } from "@/components/shared/search-combobox";

type CityComboboxProps = {
    id?: string;
    /** ISO2 of the country to search in. Null keeps the field disabled. */
    countryIso2: string | null | undefined;
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    errorText?: string;
    helperText?: string;
};

/**
 * Single city picker searched across a whole country, for forms that hold a
 * city without a state. Each option shows its state so same-named cities can
 * be told apart.
 */
export function CityCombobox({ countryIso2, ...props }: CityComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);
    const query = useCitySearch(countryIso2, debouncedSearch, { enabled: open });

    const options = useMemo<SearchOption[]>(
        () => (query.data ?? []).map((city) => ({ value: city.name, detail: city.stateName })),
        [query.data],
    );

    return (
        <SearchCombobox
            {...props}
            options={options}
            onSearchChange={setSearch}
            onOpenChange={setOpen}
            searching={open && (query.isFetching || search.trim() !== debouncedSearch.trim())}
            allowCustom
            startIcon={MapPin}
            disabled={!countryIso2}
            placeholder={countryIso2 ? "Search your city" : "Enter your country first"}
            emptyText="Type to search cities"
        />
    );
}
