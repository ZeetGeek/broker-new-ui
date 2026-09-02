"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { MapPin, Search } from "lucide-react";

import { formatLocalitiesLabel } from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    buildOwnerListingsLocationTree,
    groupOwnerListingLocationsByCity,
    searchOwnerListingLocations,
    type OwnerListingLocationSearchHit,
} from "@/features/properties/owner-listings/build-owner-listings-location-tree";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

function formatListingCount(count: number): string {
    return count === 1 ? "1 listing" : `${count} listings`;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return <>{text}</>;
    }

    const haystack = text.toLowerCase();
    const index = haystack.indexOf(needle);
    if (index === -1) {
        return <>{text}</>;
    }

    return (
        <>
            {text.slice(0, index)}
            <span className="font-semibold text-ink">
                {text.slice(index, index + needle.length)}
            </span>
            {text.slice(index + needle.length)}
        </>
    );
}

function LocationPinIcon() {
    return (
        <span
            className="
              inline-flex shrink-0 items-center justify-center rounded-inner bg-surface-muted
              text-ink block-11 inline-11
            "
            aria-hidden
        >
            <MapPin className="block-4 inline-4" strokeWidth={1.75} />
        </span>
    );
}

function WhereLocationRow({
    locality,
    pathLabel,
    listingCount,
    query,
    checked,
    onToggle,
}: {
    locality: string;
    pathLabel: string;
    listingCount: number;
    query: string;
    checked: boolean;
    onToggle: () => void;
}) {
    const combinedLabel = `${locality}, ${pathLabel}`;

    return (
        <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={onToggle}
            className="items-center gap-3 rounded-inner px-3 py-3"
        >
            <LocationPinIcon />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                {query.trim() ? (
                    <span className="body-sm truncate text-ink">
                        <HighlightMatch text={combinedLabel} query={query} />
                    </span>
                ) : (
                    <>
                        <span className="body-sm truncate font-medium text-ink">{locality}</span>
                        <span className="body-sm truncate text-ink-muted">
                            {pathLabel} · {formatListingCount(listingCount)}
                        </span>
                    </>
                )}
            </span>
        </DropdownMenuCheckboxItem>
    );
}

function renderSearchResults({
    hits,
    query,
    selectedSet,
    onToggle,
}: {
    hits: OwnerListingLocationSearchHit[];
    query: string;
    selectedSet: Set<string>;
    onToggle: (locality: string) => void;
}) {
    return hits.map((hit) => (
        <WhereLocationRow
            key={`${hit.state}-${hit.city}-${hit.locality}`}
            locality={hit.locality}
            pathLabel={hit.pathLabel}
            listingCount={hit.listingCount}
            query={query}
            checked={selectedSet.has(hit.locality)}
            onToggle={() => onToggle(hit.locality)}
        />
    ));
}

export type OwnerListingsWhereMenuProps = {
    listings: OwnerListingItem[];
    selectedLocalities: string[];
    onSelectedLocalitiesChange: (localities: string[]) => void;
    className?: string;
};

export function OwnerListingsWhereMenu({
    listings,
    selectedLocalities,
    onSelectedLocalitiesChange,
    className,
}: OwnerListingsWhereMenuProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const locationTree = useMemo(() => buildOwnerListingsLocationTree(listings), [listings]);
    const cityGroups = useMemo(
        () => groupOwnerListingLocationsByCity(locationTree),
        [locationTree],
    );
    const searchHits = useMemo(
        () => searchOwnerListingLocations(locationTree, query),
        [locationTree, query],
    );
    const selectedSet = useMemo(() => new Set(selectedLocalities), [selectedLocalities]);
    const hasListings = locationTree.length > 0;
    const isSearching = query.trim().length > 0;

    useEffect(() => {
        if (!open) {
            setQuery("");
        }
    }, [open]);

    const toggleLocality = (locality: string) => {
        onSelectedLocalitiesChange(
            selectedSet.has(locality)
                ? selectedLocalities.filter((item) => item !== locality)
                : [...selectedLocalities, locality],
        );
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                render={
                    <OwnerListingsBandSegment
                        label="Where"
                        icon={MapPin}
                        value={formatLocalitiesLabel(selectedLocalities)}
                        className={className}
                    />
                }
            />
            <DropdownMenuContent
                align="start"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    "min-inline-80 max-inline-[min(100vw-2rem,26rem)] overflow-hidden p-0",
                )}
            >
                <div className="border-b border-border-warm p-3">
                    <Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search areas"
                        startIcon={Search}
                        clearable
                        size="lg"
                        autoFocus={open}
                        aria-label="Search areas"
                        onKeyDown={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                    />

                    {selectedLocalities.length > 0 ? (
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                            <p className="body-sm text-ink-muted">
                                {selectedLocalities.length} area
                                {selectedLocalities.length === 1 ? "" : "s"} selected
                            </p>
                            <button
                                type="button"
                                onClick={() => onSelectedLocalitiesChange([])}
                                className="
                                  body-sm font-medium text-brand underline-offset-4
                                  hover:underline
                                "
                            >
                                Clear
                            </button>
                        </div>
                    ) : null}
                </div>

                <ScrollArea className="block-80 max-block-[min(22rem,var(--available-height))]">
                    <div className="p-1.5 pe-2.5">
                        {!hasListings ? (
                            <p className="body-sm px-3 py-10 text-center text-ink-muted">
                                No listings yet
                            </p>
                        ) : isSearching && searchHits.length === 0 ? (
                            <p className="body-sm px-3 py-10 text-center text-ink-muted">
                                No matching areas
                            </p>
                        ) : isSearching ? (
                            renderSearchResults({
                                hits: searchHits,
                                query,
                                selectedSet,
                                onToggle: toggleLocality,
                            })
                        ) : (
                            cityGroups.map((cityGroup) => (
                                <Fragment key={`${cityGroup.state}-${cityGroup.city}`}>
                                    {cityGroups.length > 1 ? (
                                        <p className="eyebrow px-3 pb-1 pt-2 text-ink-muted">
                                            {cityGroup.city}
                                        </p>
                                    ) : null}

                                    {cityGroup.localities.map((leaf) => (
                                        <WhereLocationRow
                                            key={`${cityGroup.city}-${leaf.locality}`}
                                            locality={leaf.locality}
                                            pathLabel={`${leaf.city}, ${leaf.state}`}
                                            listingCount={leaf.listingCount}
                                            query=""
                                            checked={selectedSet.has(leaf.locality)}
                                            onToggle={() => toggleLocality(leaf.locality)}
                                        />
                                    ))}
                                </Fragment>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
