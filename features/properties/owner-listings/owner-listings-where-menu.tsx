"use client";

import { useMemo, useState } from "react";

import { type LucideIcon, MapPin, MapPinOff, Search } from "lucide-react";

import { formatLocalitiesLabel, formatLocalitiesTooltip } from "@/lib/format/owner-listings-labels";
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
        "group/row my-1 cursor-pointer! items-center gap-3 rounded-xl border border-transparent px-2.5 py-3 pe-10",
        "font-normal text-ink transition-[background-color,border-color,box-shadow] duration-160",
        "**:data-muted-line:data-highlighted:text-ink-muted!",
        "**:data-muted-line:focus:text-ink-muted!",
        // Pin + check indicator shared plumbing
        "**:data-[slot=where-location-pin]:transition-colors",
        "**:data-[slot=where-location-pin]:duration-160",
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
                  // Active: lock look — no hover/focus color shift on pin or subtitle
                  "border-brand bg-brand-soft! text-ink! shadow-sm ring-1 ring-brand/20",
                  "data-checked:bg-brand-soft! data-checked:text-ink!",
                  "data-checked:data-highlighted:bg-brand-soft! data-checked:data-highlighted:text-ink!",
                  "data-checked:focus:bg-brand-soft! data-checked:focus:text-ink!",
                  "data-checked:hover:bg-brand-soft! data-checked:hover:text-ink!",
                  // Title stays ink (beat base focus:**:text-accent-foreground)
                  "**:data-[slot=where-location-title]:text-ink!",
                  "focus:**:data-[slot=where-location-title]:text-ink!",
                  "data-highlighted:**:data-[slot=where-location-title]:text-ink!",
                  "hover:**:data-[slot=where-location-title]:text-ink!",
                  // Subtitle + listing count stay muted (incl. nested spans)
                  "**:data-muted-line:text-ink-muted!",
                  "**:data-muted-line:*:text-ink-muted!",
                  "focus:**:data-muted-line:text-ink-muted!",
                  "focus:**:data-muted-line:*:text-ink-muted!",
                  "data-highlighted:**:data-muted-line:text-ink-muted!",
                  "data-highlighted:**:data-muted-line:*:text-ink-muted!",
                  "hover:**:data-muted-line:text-ink-muted!",
                  "hover:**:data-muted-line:*:text-ink-muted!",
                  // Pin stays brand — never reverts on hover/focus
                  "**:data-[slot=where-location-pin]:text-brand!",
                  "focus:**:data-[slot=where-location-pin]:text-brand!",
                  "data-highlighted:**:data-[slot=where-location-pin]:text-brand!",
                  "hover:**:data-[slot=where-location-pin]:text-brand!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "focus:**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "data-highlighted:**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-100",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-100",
              ]
            : [
                  // Idle: muted hover only when not selected
                  "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
                  "focus:bg-surface-muted/70! focus:text-ink!",
                  "**:data-[slot=where-location-pin]:text-ink-subtle!",
                  "group-hover/row:**:data-[slot=where-location-pin]:text-brand!",
                  "focus:**:data-[slot=where-location-pin]:text-brand!",
                  "data-highlighted:**:data-[slot=where-location-pin]:text-brand!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-0",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-75",
              ],
    );

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

function LocationIcon({ checked }: { checked?: boolean }) {
    return (
        <MapPin
            aria-hidden
            data-slot="where-location-pin"
            // Explicit stroke when selected — CSS hover/focus cannot repaint it black
            color={checked ? "var(--color-brand)" : "currentColor"}
            className={cn(
                "block-6 inline-6 shrink-0",
                checked
                    ? null
                    : "text-ink-subtle transition-colors duration-160 group-hover/row:text-brand data-highlighted:text-brand",
            )}
            strokeWidth={1.75}
        />
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
    const isSearching = query.trim().length > 0;

    return (
        <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={onToggle}
            className={rowClass(checked)}
        >
            <LocationIcon checked={checked} />
            <span className="flex flex-1 flex-col gap-0.5 text-start min-inline-0">
                {isSearching ? (
                    <>
                        <span
                            data-slot="where-location-title"
                            className="truncate text-[15px] leading-snug capitalize text-ink"
                        >
                            <HighlightMatch text={locality} query={query} />
                        </span>
                        <span
                            className="truncate text-[13px] leading-snug text-ink-muted"
                            data-muted-line
                        >
                            {pathLabel}
                        </span>
                    </>
                ) : (
                    <>
                        <span
                            data-slot="where-location-title"
                            className="truncate text-[15px] leading-snug font-medium capitalize text-ink"
                        >
                            {locality}
                        </span>
                        <span
                            className="truncate text-[13px] leading-snug text-ink-muted"
                            data-muted-line
                            style={checked ? { color: "var(--color-ink-muted)" } : undefined}
                        >
                            {pathLabel}
                            <span aria-hidden> · </span>
                            <span
                                className="tabular-nums"
                                style={
                                    checked ? { color: "var(--color-ink-muted)" } : undefined
                                }
                            >
                                {formatListingCount(listingCount)}
                            </span>
                        </span>
                    </>
                )}
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
            pathLabel={hit.pathLabel}
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
    onLocationChange: (cities: string[], localities: string[]) => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function OwnerListingsWhereMenu({
    listings,
    selectedCities,
    selectedLocalities,
    onLocationChange,
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
    const selectedCitySet = useMemo(() => new Set(selectedCities), [selectedCities]);
    const selectedLocalitySet = useMemo(() => new Set(selectedLocalities), [selectedLocalities]);
    const hasListings = locationTree.length > 0;
    const isSearching = query.trim().length > 0;
    const showEmptyState = !hasListings || (isSearching && searchHits.length === 0);

    const clearSelection = () => {
        setQuery("");
        onLocationChange([], []);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setQuery("");
        }
        onOpenChange?.(nextOpen);
    };

    const toggleLocality = (locality: string, city: string) => {
        const nextLocalities = selectedLocalitySet.has(locality)
            ? selectedLocalities.filter((item) => item !== locality)
            : [...selectedLocalities, locality];

        let nextCities = selectedCities;
        if (!selectedLocalitySet.has(locality) && !selectedCitySet.has(city)) {
            nextCities = [...selectedCities, city];
        }

        onLocationChange(nextCities, nextLocalities);
    };

    const whereTooltipLabel = formatLocalitiesTooltip(selectedLocalities, selectedCities);

    return (
        <div className={cn("min-w-0 w-full", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <TooltipProvider>
                    <Tooltip open={open || !whereTooltipLabel ? false : undefined}>
                        <TooltipTrigger
                            className="flex min-w-0 w-full"
                            render={
                                <DropdownMenuTrigger
                                    className="flex min-w-0 w-full"
                                    render={
                                        <OwnerListingsBandSegment
                                            label="Where"
                                            icon={MapPin}
                                            value={formatLocalitiesLabel(
                                                selectedLocalities,
                                                selectedCities,
                                            )}
                                            className="w-full"
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
                        `
                          grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden! p-0
                        `,
                        "max-block-[min(28rem,var(--available-height))]",
                    )}
                >
                <div className="shrink-0 flex flex-col gap-3 px-4 pbs-4 pbe-1">
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

                {showEmptyState ? (
                    <div
                        className={cn(
                            WHERE_MENU_LIST_PANEL_CLASS,
                            "flex items-center justify-center",
                        )}
                    >
                        {!hasListings ? (
                            <WhereMenuEmptyState
                                icon={MapPinOff}
                                title="No listings yet"
                                description="Owner listings will appear here once they are live in a city."
                            />
                        ) : (
                            <WhereMenuEmptyState
                                icon={Search}
                                title="No matching areas"
                                description={`Nothing found for "${query.trim()}". Try another city or area.`}
                            />
                        )}
                    </div>
                ) : (
                    <div className={WHERE_MENU_LIST_PANEL_CLASS}>
                        <ScrollArea className="overflow-hidden block-full">
                            <div className="px-3 pe-3 pbs-0 pbe-3">
                                {isSearching
                                    ? renderSearchResults({
                                          hits: searchHits,
                                          query,
                                          selectedSet: selectedLocalitySet,
                                          onToggle: toggleLocality,
                                      })
                                    : locationLeaves.map((leaf) => (
                                          <WhereLocationRow
                                              key={`${leaf.state}-${leaf.city}-${leaf.locality}`}
                                              locality={leaf.locality}
                                              pathLabel={`${leaf.city}, ${leaf.state}`}
                                              listingCount={leaf.listingCount}
                                              query=""
                                              checked={selectedLocalitySet.has(leaf.locality)}
                                              onToggle={() =>
                                                  toggleLocality(leaf.locality, leaf.city)
                                              }
                                          />
                                      ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
