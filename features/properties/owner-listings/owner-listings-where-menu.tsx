"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { MapPin, MapPinOff, Search, type LucideIcon } from "lucide-react";

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
    searchOwnerListingLocations,
    type OwnerListingLocationSearchHit,
} from "@/features/properties/owner-listings/build-owner-listings-location-tree";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

const rowClass = (checked: boolean) =>
    cn(
        "group/row my-0.5 items-center gap-3.5 rounded-xl px-2.5 py-3",
        "font-normal text-ink transition-colors duration-160",
        "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
        "focus:bg-surface-muted/70! focus:text-ink!",
        checked && "bg-brand-soft/35 data-highlighted:bg-brand-soft/45!",
        "**:data-muted-line:data-highlighted:text-ink-muted!",
        "**:data-muted-line:focus:text-ink-muted!",
        "[&_.text-brand]:data-highlighted:text-brand!",
        "[&_.text-brand]:focus:text-brand!",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:inline-flex",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:items-center",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:justify-center",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-brand",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-0",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:transition-opacity duration-160",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:block-4.5",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:inline-4.5",
        "**:data-[slot=dropdown-menu-checkbox-item-indicator]:[&_svg]:stroke-[2.25]",
        checked && "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-100",
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
            <span className="font-semibold text-ink">{text.slice(index, index + needle.length)}</span>
            {text.slice(index + needle.length)}
        </>
    );
}

function LocationIcon() {
    return (
        <MapPin
            aria-hidden
            className="block-4.5 inline-4.5 shrink-0 text-brand"
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
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                {isSearching ? (
                    <>
                        <span className="truncate text-[15px] leading-snug text-ink">
                            <HighlightMatch text={locality} query={query} />
                        </span>
                        <span className="truncate text-[13px] leading-snug text-ink-muted" data-muted-line>
                            {pathLabel}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="truncate text-[15px] leading-snug font-medium text-ink">
                            {locality}
                        </span>
                        <span className="truncate text-[13px] leading-snug text-ink-muted" data-muted-line>
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
            <Icon aria-hidden className="block-6 inline-6 text-brand" strokeWidth={1.75} />
            <div className="flex max-w-[16rem] flex-col gap-1">
                <p className="body-sm font-medium text-ink">{title}</p>
                <p className="body-sm text-pretty text-ink-muted">{description}</p>
            </div>
        </div>
    );
}

const WHERE_MENU_LIST_PANEL_CLASS = cn(
    "relative block-80 max-block-[min(20rem,calc(var(--available-height)-9rem))]",
    "min-block-52 shrink-0 overflow-hidden",
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
    const showEmptyState =
        !hasListings || (isSearching && searchHits.length === 0);

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

    const whereTooltipLabel = formatLocalitiesTooltip(selectedLocalities);

    const whereTrigger = (
        <DropdownMenuTrigger
            render={
                <OwnerListingsBandSegment
                    label="Where"
                    icon={MapPin}
                    value={formatLocalitiesLabel(selectedLocalities)}
                    className={className}
                    isOpen={open}
                />
            }
        />
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            {whereTooltipLabel ? (
                <TooltipProvider>
                    <Tooltip open={open ? false : undefined}>
                        <TooltipTrigger render={whereTrigger} />
                        <TooltipContent
                            side="bottom"
                            align="start"
                            sideOffset={12}
                            className="text-pretty max-inline-72"
                        >
                            {whereTooltipLabel}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                whereTrigger
            )}
            <DropdownMenuContent
                align="start"
                sideOffset={OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET}
                className={cn(
                    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
                    "grid min-inline-84 max-inline-[min(100vw-2rem,27rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden! p-0",
                    "max-block-[min(28rem,var(--available-height))]",
                )}
            >
                <div className="shrink-0 px-4 pb-1 pt-4">
                    <Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search areas"
                        startIcon={Search}
                        clearable
                        size="lg"
                        autoFocus={open}
                        aria-label="Search areas"
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
                                description="Owner listings will appear here once they are live in your city."
                            />
                        ) : (
                            <WhereMenuEmptyState
                                icon={Search}
                                title="No matching areas"
                                description={`Nothing found for "${query.trim()}". Try a nearby area or check the spelling.`}
                            />
                        )}
                    </div>
                ) : (
                    <div className={WHERE_MENU_LIST_PANEL_CLASS}>
                        <ScrollArea className="block-full overflow-hidden">
                            <div className="px-2 pb-2 pe-3 pt-0">
                                {isSearching
                                    ? renderSearchResults({
                                          hits: searchHits,
                                          query,
                                          selectedSet,
                                          onToggle: toggleLocality,
                                      })
                                    : cityGroups.map((cityGroup, cityIndex) => (
                                          <Fragment key={`${cityGroup.state}-${cityGroup.city}`}>
                                              {cityGroups.length > 1 ? (
                                                  <div
                                                      className={cn(
                                                          "flex items-center gap-2 px-2.5 pb-1",
                                                          cityIndex > 0 ? "mt-3 pt-1" : "pt-0",
                                                      )}
                                                  >
                                                      <span className="text-[11px] font-semibold tracking-[0.08em] text-ink-muted uppercase">
                                                          {cityGroup.city}
                                                      </span>
                                                      <span
                                                          className="h-px flex-1 bg-border-warm/70"
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
                                                      checked={selectedSet.has(leaf.locality)}
                                                      onToggle={() => toggleLocality(leaf.locality)}
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
