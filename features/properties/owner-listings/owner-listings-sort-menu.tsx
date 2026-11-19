"use client";

import { ListToolbarSelect } from "@/components/shared/list-toolbar";

import type {
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";

export type OwnerListingsSortMenuProps = {
    filters: OwnerListingsFilters;
    onSortChange: (sort: OwnerListingSort) => void;
    className?: string;
};

const SORT_OPTIONS: { value: OwnerListingSort; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "price_asc", label: "Price low" },
    { value: "price_desc", label: "Price high" },
];

export function OwnerListingsSortMenu({
    filters,
    onSortChange,
    className,
}: OwnerListingsSortMenuProps) {
    return (
        <ListToolbarSelect
            label="Sort listings"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={onSortChange}
            defaultValue="newest"
            mobileLabel="Sort"
            className={className}
        />
    );
}
