"use client";

import { useMemo, useState } from "react";

import { type LucideIcon, MapPin, MapPinOff, Search } from "lucide-react";

import {
    formatLocationPathLabel,
    formatLocalitiesLabel,
    formatLocalitiesTooltip,
    formatPlaceName,
} from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    buildOwnerListingsLocationTree,
    flattenOwnerListingLocationLeaves,
    type OwnerListingLocationSearchHit,
    searchOwnerListingLocations,
} from "@/features/properties/owner-listings/build-owner-listings-location-tree";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

const rowClass = (checked: boolean) =>
    cn(
        `
          group/row my-1 cursor-pointer! items-center gap-3 rounded-inner border border-transparent
          px-2.5 py-3 pe-10
        `,
        "font-normal text-ink transition-[background-color,border-color,box-shadow] duration-160",
        "[--row-icon:var(--color-ink-subtle)]",
        "hover:[--row-icon:var(--color-brand)]",
        "focus:[--row-icon:var(--color-brand)]",
        "data-highlighted:[--row-icon:var(--color-brand)]",
        "**:data-muted-line:text-ink-muted!",
        "**:data-muted-line:*:text-ink-muted!",
        "hover:**:data-muted-line:text-ink-muted!",
        "hover:**:data-muted-line:*:text-ink-muted!",
        "focus:**:data-muted-line:text-ink-muted!",
        "focus:**:data-muted-line:*:text-ink-muted!",
        "data-highlighted:**:data-muted-line:text-ink-muted!",
        "data-highlighted:**:data-muted-line:*:text-ink-muted!",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:pointer-events-none",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:absolute",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:inset-e-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:inline-flex",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:items-center",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:justify-center",
        `
          duration-160
          **:data-[slot=dropdown-menu-checkbox-item-indicator]:transition-[opacity,transform]
        `,
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:block-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:inline-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:stroke-[2.25]",
        checked
            ? [
                  "border-brand bg-brand-soft! text-ink! shadow-sm ring-1 ring-brand/20",
                  "[--row-icon:var(--color-brand)]",
                  "hover:[--row-icon:var(--color-brand)]",
                  "focus:[--row-icon:var(--color-brand)]",
                  "data-highlighted:[--row-icon:var(--color-brand)]",
                  "data-checked:bg-brand-soft! data-checked:text-ink!",
                  `
                    data-checked:data-highlighted:bg-brand-soft!
                    data-checked:data-highlighted:text-ink!
                  `,
                  "data-checked:focus:bg-brand-soft! data-checked:focus:text-ink!",
                  "data-checked:hover:bg-brand-soft! data-checked:hover:text-ink!",
                  "**:data-[slot=where-location-title]:text-ink!",
                  "focus:**:data-[slot=where-location-title]:text-ink!",
                  "data-highlighted:**:data-[slot=where-location-title]:text-ink!",
                  "hover:**:data-[slot=where-location-title]:text-ink!",
                  "**:data-muted-line:text-ink-muted!",
                  "**:data-muted-line:*:text-ink-muted!",
                  "focus:**:data-muted-line:text-ink-muted!",
                  "focus:**:data-muted-line:*:text-ink-muted!",
                  "data-highlighted:**:data-muted-line:text-ink-muted!",
                  "data-highlighted:**:data-muted-line:*:text-ink-muted!",
                  "hover:**:data-muted-line:text-ink-muted!",
                  "hover:**:data-muted-line:*:text-ink-muted!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "focus:**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "data-highlighted:**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-100",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-100",
              ]
            : [
                  "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
                  "focus:bg-surface-muted/70! focus:text-ink!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-0",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-75",
              ],
    );

function formatListingCount(count: number): string {
    return count === 1 ? "1 listing" : `${count} listings`;
}

const WHERE_META_CLASS = cn(
    "truncate text-[12px] font-medium leading-snug tracking-[0.04em] text-ink-muted",
);

const WHERE_TITLE_CLASS = cn(
    "truncate text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink",
);

function HighlightMatch({ text, query }: { text: string; query: string }) {
    const display = formatPlaceName(text);
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return <>{display}</>;
    }

    const haystack = display.toLowerCase();
    const index = haystack.indexOf(needle);
    if (index === -1) {
        return <>{display}</>;
    }

    return (
        <>
            {display.slice(0, index)}
            <span className="font-semibold text-ink">
                {display.slice(index, index + needle.length)}
            </span>
            {display.slice(index + needle.length)}
        </>
    );
}

function LocationIcon() {
    return (
        <MapPin
            aria-hidden
            data-slot="where-location-pin"
            color="var(--row-icon)"
            className="shrink-0 transition-[color,stroke] duration-160 block-5 inline-5"
            strokeWidth={1.75}
        />
    );
}

function WhereLocationMeta({
    pathLabel,
    listingCount,
    showCount,
}: {
    pathLabel: string;
    listingCount?: number;
    showCount?: boolean;
}) {
    return (
        <span className={WHERE_META_CLASS} data-muted-line>
            <span className="capitalize">{pathLabel}</span>
            {showCount && listingCount != null ? (
                <>
                    <span className="mx-1.5 text-ink-subtle" aria-hidden>
                        ·
                    </span>
                    <span className="tabular-nums tracking-[0.02em]">
                        {formatListingCount(listingCount)}
                    </span>
                </>
            ) : null}
        </span>
    );
}

function WhereLocationRow({
    locality,
    city,
    state,
    listingCount,
    query,
    checked,
    onToggle,
}: {
    locality: string;
    city: string;
    state: string;
    listingCount: number;
    query: string;
    checked: boolean;
    onToggle: () => void;
}) {
    const isSearching = query.trim().length > 0;
    const title = formatPlaceName(locality);
    const pathLabel = formatLocationPathLabel(city, state);

    return (
        <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={onToggle}
            className={rowClass(checked)}
        >
            <LocationIcon />
            <span className="flex flex-1 flex-col gap-1 text-start min-inline-0">
                <span data-slot="where-location-title" className={WHERE_TITLE_CLASS}>
                    {isSearching ? <HighlightMatch text={locality} query={query} /> : title}
                </span>
                <WhereLocationMeta
                    pathLabel={pathLabel}
                    listingCount={listingCount}
                    showCount={!isSearching}
                />
            </span>
        </DropdownMenuCheckboxItem>
    );
}

function WhereMenuEmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
            <Icon aria-hidden className="text-brand block-6 inline-6" strokeWidth={1.75} />
            <div className="flex flex-col gap-1 max-inline-[16rem]">
                <p className="body-sm font-medium text-ink">{title}</p>
                <p className="body-sm text-pretty text-ink-muted">{description}</p>
            </div>
        </div>
    );
}

const WHERE_MENU_LIST_PANEL_CLASS = cn(
    "relative block-80 max-block-[min(20rem,calc(var(--available-height)-9rem))]",
    "shrink-0 overflow-hidden min-block-52",
);

function renderSearchResults({
    hits,
    query,
    selectedSet,
    onToggle,
}: {
    hits: OwnerListingLocationSearchHit[];
    query: string;
    selectedSet: Set<string>;
    onToggle: (locality: string, city: string) => void;
}) {
    return hits.map((hit) => (
        <WhereLocationRow
            key={`${hit.state}-${hit.city}-${hit.locality}`}
            locality={hit.locality}
            city={hit.city}
            state={hit.state}
            listingCount={hit.listingCount}
            query={query}
            checked={selectedSet.has(hit.locality)}
            onToggle={() => onToggle(hit.locality, hit.city)}
        />
    ));
}

export type OwnerListingsWhereMenuProps = {
    listings: OwnerListingItem[];
    selectedCities: string[];
    selectedLocalities: string[];
    onWhereChange: (next: { cities: string[]; localities: string[]; yourAreas: boolean }) => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function OwnerListingsWhereMenu({
    listings,
    selectedCities,
    selectedLocalities,
    onWhereChange,
    onOpenChange,
    className,
}: OwnerListingsWhereMenuProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const locationTree = useMemo(() => buildOwnerListingsLocationTree(listings), [listings]);
    const locationLeaves = useMemo(() => {
        const leaves = flattenOwnerListingLocationLeaves(locationTree);
        return [...leaves].sort((left, right) =>
            left.locality.localeCompare(right.locality, "en-IN"),
        );
    }, [locationTree]);
    const searchHits = useMemo(
        () => searchOwnerListingLocations(locationTree, query),
        [locationTree, query],
    );
    const selectedLocalitySet = useMemo(() => new Set(selectedLocalities), [selectedLocalities]);
    const hasListings = locationTree.length > 0;
    const isSearching = query.trim().length > 0;
    const showEmptyState = !hasListings || (isSearching && searchHits.length === 0);
    const isAnywhereSelected = selectedCities.length === 0 && selectedLocalities.length === 0;

    const selectAnywhere = () => {
        setQuery("");
        onWhereChange({ cities: [], localities: [], yourAreas: false });
    };

    const clearSelection = () => {
        selectAnywhere();
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setQuery("");
        }
        onOpenChange?.(nextOpen);
    };

    const toggleLocality = (locality: string, city: string) => {
        const removing = selectedLocalitySet.has(locality);
        const nextLocalities = removing
            ? selectedLocalities.filter((item) => item !== locality)
            : [...selectedLocalities, locality];

        if (nextLocalities.length === 0) {
            onWhereChange({ cities: [], localities: [], yourAreas: false });
            return;
        }

        const nextCities = Array.from(
            new Set(
                nextLocalities.map((loc) => {
                    if (loc === locality) return city;
                    const leaf = locationLeaves.find((entry) => entry.locality === loc);
                    return leaf?.city ?? city;
                }),
            ),
        );

        onWhereChange({
            cities: nextCities,
            localities: nextLocalities,
            yourAreas: false,
        });
    };

    const whereTooltipLabel = formatLocalitiesTooltip(selectedLocalities, selectedCities, false);

    return (
        <div className={cn("inline-full min-inline-0", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <TooltipProvider>
                    <Tooltip open={open || !whereTooltipLabel ? false : undefined}>
                        <TooltipTrigger
                            className="flex inline-full min-inline-0"
                            render={
                                <DropdownMenuTrigger
                                    className="flex inline-full min-inline-0"
                                    render={
                                        <OwnerListingsBandSegment
                                            label="Where"
                                            icon={MapPin}
                                            value={formatLocalitiesLabel(
                                                selectedLocalities,
                                                selectedCities,
                                                false,
                                            )}
                                            className="inline-full"
                                            isOpen={open}
                                        />
                                    }
                                />
                            }
                        />
                        {whereTooltipLabel ? (
                            <TooltipContent
                                side="bottom"
                                align="start"
                                sideOffset={12}
                                className="text-pretty max-inline-72"
                            >
                                {whereTooltipLabel}
                            </TooltipContent>
                        ) : null}
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent
                    align="center"
                    sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                    className={cn(
                        OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                        OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
                        `grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden! p-0`,
                        "max-block-[min(28rem,var(--available-height))]",
                    )}
                >
                    <div className="flex shrink-0 flex-col gap-3 px-4 pbs-4 pbe-1">
                        <OwnerListingsBandMenuHeader
                            description="Pick cities or areas"
                            onClear={clearSelection}
                        />
                        <Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search cities or areas"
                            startIcon={Search}
                            clearable
                            size="lg"
                            autoFocus={open}
                            aria-label="Search cities or areas"
                            className="text-ink shadow-sm"
                            wrapperClassName="text-ink"
                            onKeyDown={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                        />
                    </div>

                    {showEmptyState && isSearching ? (
                        <div
                            className={cn(
                                WHERE_MENU_LIST_PANEL_CLASS,
                                "flex items-center justify-center",
                            )}
                        >
                            <WhereMenuEmptyState
                                icon={Search}
                                title="No matching areas"
                                description={`Nothing found for "${query.trim()}". Try another city or area.`}
                            />
                        </div>
                    ) : (
                        <div className={WHERE_MENU_LIST_PANEL_CLASS}>
                            <ScrollArea className="overflow-hidden block-full">
                                <div className="px-3 pe-3 pbs-0 pbe-3">
                                    {!isSearching ? (
                                        <DropdownMenuCheckboxItem
                                            checked={isAnywhereSelected}
                                            onCheckedChange={selectAnywhere}
                                            className={rowClass(isAnywhereSelected)}
                                        >
                                            <LocationIcon />
                                            <span
                                                className="
                                                  flex flex-1 flex-col gap-1 text-start min-inline-0
                                                "
                                            >
                                                <span
                                                    data-slot="where-location-title"
                                                    className={WHERE_TITLE_CLASS}
                                                >
                                                    Anywhere
                                                </span>
                                                <WhereLocationMeta pathLabel="All listed properties" />
                                            </span>
                                        </DropdownMenuCheckboxItem>
                                    ) : null}

                                    {isSearching ? (
                                        renderSearchResults({
                                            hits: searchHits,
                                            query,
                                            selectedSet: selectedLocalitySet,
                                            onToggle: toggleLocality,
                                        })
                                    ) : hasListings ? (
                                        locationLeaves.map((leaf) => (
                                            <WhereLocationRow
                                                key={`${leaf.state}-${leaf.city}-${leaf.locality}`}
                                                locality={leaf.locality}
                                                city={leaf.city}
                                                state={leaf.state}
                                                listingCount={leaf.listingCount}
                                                query=""
                                                checked={selectedLocalitySet.has(leaf.locality)}
                                                onToggle={() =>
                                                    toggleLocality(leaf.locality, leaf.city)
                                                }
                                            />
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center py-10">
                                            <WhereMenuEmptyState
                                                icon={MapPinOff}
                                                title="No listings yet"
                                                description="Owner listings will appear here once they are live in a city."
                                            />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
