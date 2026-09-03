"use client";

import { Fragment, useMemo, useState } from "react";

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
    groupOwnerListingLocationsByCity,
    type OwnerListingLocationSearchHit,
    searchOwnerListingLocations,
} from "@/features/properties/owner-listings/build-owner-listings-location-tree";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

const rowClass = (checked: boolean) =>
    cn(
        "group/row my-1 items-center gap-3 rounded-xl px-2.5 py-3 pe-10",
        "font-normal text-ink transition-[background-color,box-shadow] duration-160",
        "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
        "focus:bg-surface-muted/70! focus:text-ink!",
        "**:data-muted-line:data-highlighted:text-ink-muted!",
        "**:data-muted-line:focus:text-ink-muted!",
        // Keep pin brand-green on hover/focus (base checkbox forces accent-foreground on **:)
        "**:data-[slot=where-location-pin]:text-brand!",
        "focus:**:data-[slot=where-location-pin]:text-brand!",
        "data-highlighted:**:data-[slot=where-location-pin]:text-brand!",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:pointer-events-none",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:absolute",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:inset-e-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:inline-flex",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:items-center",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:justify-center",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-0",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-75",
        `
          duration-160
          **:data-[slot=dropdown-menu-checkbox-item-indicator]:transition-[opacity,transform]
        `,
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:block-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:inline-4",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:stroke-[2.25]",
        checked && [
            "**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink",
            "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-100",
            "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-100",
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

function LocationIcon() {
    return (
        <MapPin
            aria-hidden
            data-slot="where-location-pin"
            className="shrink-0 text-brand block-4.5 inline-4.5"
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
            <LocationIcon />
            <span className="flex flex-1 flex-col gap-0.5 text-start min-inline-0">
                {isSearching ? (
                    <>
                        <span className="truncate text-[15px] leading-snug text-ink">
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
                        <span className="truncate text-[15px] leading-snug font-medium text-ink">
                            {locality}
                        </span>
                        <span
                            className="truncate text-[13px] leading-snug text-ink-muted"
                            data-muted-line
                        >
                            {pathLabel}
                            <span aria-hidden> · </span>
                            <span className="tabular-nums">{formatListingCount(listingCount)}</span>
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
    const cityGroups = useMemo(
        () => groupOwnerListingLocationsByCity(locationTree),
        [locationTree],
    );
    const searchHits = useMemo(
        () => searchOwnerListingLocations(locationTree, query),
        [locationTree, query],
    );
    const selectedCitySet = useMemo(() => new Set(selectedCities), [selectedCities]);
    const selectedLocalitySet = useMemo(() => new Set(selectedLocalities), [selectedLocalities]);
    const hasListings = locationTree.length > 0;
    const isSearching = query.trim().length > 0;
    const showEmptyState = !hasListings || (isSearching && searchHits.length === 0);

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

    const whereTrigger = (
        <DropdownMenuTrigger
            render={
                <OwnerListingsBandSegment
                    label="Where"
                    icon={MapPin}
                    value={formatLocalitiesLabel(selectedLocalities, selectedCities)}
                    className={className}
                    isOpen={open}
                />
            }
        />
    );

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <TooltipProvider>
                <Tooltip open={open || !whereTooltipLabel ? false : undefined}>
                    <TooltipTrigger render={whereTrigger} />
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
                align="start"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    `
                      grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden! p-0
                      inline-(--anchor-width) max-inline-(--anchor-width) min-inline-0
                    `,
                    "max-block-[min(28rem,var(--available-height))]",
                )}
            >
                <div className="shrink-0 px-4 pbs-4 pbe-1">
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
                                title="No matching cities"
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
                                    : cityGroups.map((cityGroup, cityIndex) => (
                                          <Fragment key={`${cityGroup.state}-${cityGroup.city}`}>
                                              {cityGroups.length > 1 ? (
                                                  <div
                                                      className={cn(
                                                          "flex items-center gap-2 px-2.5 pbe-1",
                                                          cityIndex > 0 ? "mbs-3 pbs-1" : "pbs-0",
                                                      )}
                                                  >
                                                      <span
                                                          className="
                                                            text-[11px] font-semibold
                                                            tracking-[0.08em] text-ink-muted
                                                            uppercase
                                                          "
                                                      >
                                                          {cityGroup.city}
                                                      </span>
                                                      <span
                                                          className="
                                                            flex-1 bg-border-warm/70 block-px
                                                          "
                                                          aria-hidden
                                                      />
                                                  </div>
                                              ) : null}

                                              {cityGroup.localities.map((leaf) => (
                                                  <WhereLocationRow
                                                      key={`${cityGroup.city}-${leaf.locality}`}
                                                      locality={leaf.locality}
                                                      pathLabel={`${leaf.city}, ${leaf.state}`}
                                                      listingCount={leaf.listingCount}
                                                      query=""
                                                      checked={selectedLocalitySet.has(
                                                          leaf.locality,
                                                      )}
                                                      onToggle={() =>
                                                          toggleLocality(leaf.locality, leaf.city)
                                                      }
                                                  />
                                              ))}
                                          </Fragment>
                                      ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
