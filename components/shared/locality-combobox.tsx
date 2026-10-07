"use client";

import { useMemo, useState } from "react";

import { MapPinned } from "lucide-react";

import { useDebouncedValue, useLocalitySearch } from "@/hooks/use-locations";

import {
    SearchCombobox,
    type SearchComboboxProps,
    type SearchOption,
} from "@/components/shared/search-combobox";

type LocalityComboboxProps = Omit<
    SearchComboboxProps,
    "options" | "onSearchChange" | "searching" | "onOpenChange"
> & {
    /** Localities are listed for this city only. Null keeps the field disabled. */
    cityId: string | null | undefined;
};

/**
 * Locality picker for one city, single or multiple. Searches as the user
 * types; the backend answers from stored localities and falls back to Google
 * Maps for a search it has never seen.
 */
export function LocalityCombobox({
    cityId,
    placeholder,
    disabled,
    ...props
}: LocalityComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    // Only query while the list is open, so a page with this field does not
    // search before anyone touches it.
    const query = useLocalitySearch(cityId, debouncedSearch, { enabled: open });

    const options = useMemo<SearchOption[]>(
        () =>
            (query.data ?? []).map((locality) => ({
                value: locality.name,
                detail: locality.description,
            })),
        [query.data],
    );

    return (
        <SearchCombobox
            {...(props as SearchComboboxProps)}
            options={options}
            onSearchChange={setSearch}
            onOpenChange={setOpen}
            searching={open && (query.isFetching || search.trim() !== debouncedSearch.trim())}
            allowCustom
            startIcon={MapPinned}
            disabled={disabled || !cityId}
            placeholder={cityId ? (placeholder ?? "Search a locality") : "Choose a city first"}
            emptyText="Type to search localities"
        />
    );
}
