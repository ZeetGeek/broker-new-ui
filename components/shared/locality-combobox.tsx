"use client";

import { type Ref, useMemo, useState } from "react";

import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { useDebouncedValue, useLocalitySearch } from "@/hooks/use-locations";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { MapPinned } from "@/components/shared/icons";
import {
    MobileMultiSelectDrawer,
    MobileSelectDrawer,
} from "@/components/shared/mobile-select-drawer";
import {
    SearchCombobox,
    type SearchComboboxProps,
    type SearchOption,
} from "@/components/shared/search-combobox";

type LocalitySearchProps<T extends SearchComboboxProps> = T extends SearchComboboxProps
    ? Omit<T, "options" | "onSearchChange" | "searching" | "onOpenChange">
    : never;

type LocalityComboboxProps = LocalitySearchProps<SearchComboboxProps> & {
    /** Localities are searched in this city. Required unless options are supplied. */
    cityId?: string | null;
    /** Preloaded areas, e.g. marketplace inventory or multi-city preferences. */
    options?: readonly SearchOption[];
    mobileDrawer?: boolean;
    mobileLabel?: string;
    mobileTriggerRef?: Ref<HTMLButtonElement>;
};

/**
 * Shared area input, single or multiple. Supply cityId for API autocomplete,
 * or options for inventory-backed filters and multi-city preferences.
 * Set allowCustom=false on filters so only existing inventory can be selected.
 */
export function LocalityCombobox({
    cityId,
    placeholder,
    disabled,
    options: suppliedOptions,
    allowCustom = true,
    emptyText = "Find an area",
    mobileDrawer = false,
    mobileLabel = "Locality",
    mobileTriggerRef,
    ...props
}: LocalityComboboxProps) {
    const [open, setOpen] = useState(false);
    const mobile = useMobileMenu();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    // Only query while the list is open, so a page with this field does not
    // search before anyone touches it.
    const remoteSearch = suppliedOptions === undefined;
    const query = useLocalitySearch(cityId, debouncedSearch, { enabled: open && remoteSearch });

    const options = useMemo<SearchOption[]>(
        () =>
            suppliedOptions
                ? suppliedOptions.filter((option) =>
                      `${option.value} ${option.detail ?? ""}`
                          .toLowerCase()
                          .includes(search.trim().toLowerCase()),
                  )
                : (query.data ?? []).map((locality) => ({
                      value: locality.name,
                      detail: locality.description,
                  })),
        [query.data, suppliedOptions, search],
    );

    if (mobileDrawer && mobile && props.multiple) {
        const selectedOptions = props.value.map((value) => ({
            value,
            label: formatPlaceName(value),
        }));
        const drawerOptions = [
            ...selectedOptions,
            ...options
                .filter(
                    (option) =>
                        !props.value.some(
                            (value) => value.trim().toLowerCase() === option.value.toLowerCase(),
                        ),
                )
                .map((option) => ({
                    ...option,
                    label: formatPlaceName(option.value),
                })),
        ];

        return (
            <MobileMultiSelectDrawer
                id={props.id}
                triggerRef={mobileTriggerRef}
                label={mobileLabel}
                value={props.value}
                options={drawerOptions}
                onChange={props.onValueChange}
                onBlur={props.onBlur}
                onOpenChange={setOpen}
                onSearchChange={setSearch}
                searching={
                    remoteSearch &&
                    open &&
                    (query.isFetching || search.trim() !== debouncedSearch.trim())
                }
                searchError={
                    remoteSearch && query.isError
                        ? "Couldn't load areas. Please try again."
                        : undefined
                }
                onRetry={() => void query.refetch()}
                allowCustom={allowCustom}
                startIcon={MapPinned}
                disabled={disabled || (remoteSearch && !cityId)}
                placeholder={
                    !remoteSearch || cityId
                        ? (placeholder ?? "Search an area")
                        : "Choose a city first"
                }
                emptyText={emptyText}
                errorText={props.errorText}
                helperText={props.helperText}
            />
        );
    }

    if (mobileDrawer && mobile && !props.multiple) {
        return (
            <MobileSelectDrawer
                id={props.id}
                triggerRef={mobileTriggerRef}
                label={mobileLabel}
                value={props.value}
                options={options.map((option) => ({
                    ...option,
                    label: formatPlaceName(option.value),
                }))}
                onChange={props.onValueChange}
                onBlur={props.onBlur}
                onOpenChange={setOpen}
                onSearchChange={setSearch}
                searching={
                    remoteSearch &&
                    open &&
                    (query.isFetching || search.trim() !== debouncedSearch.trim())
                }
                searchError={
                    remoteSearch && query.isError
                        ? "Couldn't load areas. Please try again."
                        : undefined
                }
                onRetry={() => void query.refetch()}
                allowCustom={allowCustom}
                startIcon={MapPinned}
                disabled={disabled || (remoteSearch && !cityId)}
                placeholder={
                    !remoteSearch || cityId
                        ? (placeholder ?? "Search an area")
                        : "Choose a city first"
                }
                emptyText={emptyText}
                errorText={props.errorText}
                helperText={props.helperText}
            />
        );
    }

    return (
        <SearchCombobox
            {...(props as SearchComboboxProps)}
            formatChipLabel={formatPlaceName}
            formatOptionLabel={formatPlaceName}
            options={options}
            onSearchChange={setSearch}
            onOpenChange={setOpen}
            searching={
                remoteSearch &&
                open &&
                (query.isFetching || search.trim() !== debouncedSearch.trim())
            }
            searchError={
                remoteSearch && query.isError ? "Couldn't load areas. Please try again." : undefined
            }
            onRetry={() => void query.refetch()}
            allowCustom={allowCustom}
            startIcon={MapPinned}
            disabled={disabled || (remoteSearch && !cityId)}
            placeholder={
                !remoteSearch || cityId ? (placeholder ?? "Search an area") : "Choose a city first"
            }
            emptyText={emptyText}
        />
    );
}
