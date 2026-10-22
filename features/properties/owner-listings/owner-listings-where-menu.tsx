"use client";

import { useMemo, useState } from "react";

import {
    formatLocalitiesLabel,
    formatLocalitiesTooltip,
    formatLocationPathLabel,
    formatPlaceName,
} from "@/lib/format/owner-listings-labels";
import { cn } from "@/lib/utils";

import {
    type AppIcon,
    Building2,
    ChevronLeft,
    ChevronRight,
    Globe2,
    LandPlot,
    MapPin,
    MapPinned,
    MapPinOff,
    Search,
} from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    buildOwnerListingsLocationTree,
    encodeOwnerListingStateKey,
    findCityGroup,
    findCountryGroup,
    findStateGroup,
    type OwnerListingLocationSearchHit,
    searchOwnerListingLocations,
    toggleStringList,
} from "@/features/properties/owner-listings/build-owner-listings-location-tree";
import {
    OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS,
    OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET,
    OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS,
} from "@/features/properties/owner-listings/owner-listings-band-menu-content";
import { OwnerListingsBandMenuHeader } from "@/features/properties/owner-listings/owner-listings-band-menu-header";
import { OwnerListingsBandSegment } from "@/features/properties/owner-listings/owner-listings-band-segment";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

type WhereBrowseLevel =
    | { kind: "root" }
    | { kind: "country"; country: string }
    | { kind: "state"; country: string; state: string }
    | { kind: "city"; country: string; state: string; city: string };

const rowClass = (checked: boolean) =>
    cn(
        `
          group/row my-1 cursor-pointer! items-center gap-3 rounded-inner border border-transparent
          px-2.5 py-3
        `,
        "font-normal text-ink transition-[background-color,border-color,box-shadow] duration-160",
        "[--row-icon:var(--color-ink-subtle)]",
        "hover:[--row-icon:var(--color-brand)]",
        "focus:[--row-icon:var(--color-brand)]",
        "data-highlighted:[--row-icon:var(--color-brand)]",
        "**:data-muted-line:text-ink-muted!",
        "**:data-muted-line:*:text-ink-muted!",
        checked
            ? [
                  "border-brand bg-brand-soft! text-ink! shadow-sm ring-1 ring-brand/20",
                  "[--row-icon:var(--color-brand)]",
                  "data-checked:bg-brand-soft! data-checked:text-ink!",
                  "**:data-[slot=where-location-title]:text-ink!",
              ]
            : [
                  "data-highlighted:bg-surface-muted/70! data-highlighted:text-ink!",
                  "focus:bg-surface-muted/70! focus:text-ink!",
              ],
    );

const checkboxRowClass = (checked: boolean) =>
    cn(
        rowClass(checked),
        "pe-10",
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
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:text-ink!",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-100",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-100",
              ]
            : [
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:opacity-0",
                  "**:data-[slot=dropdown-menu-checkbox-item-indicator]:scale-75",
              ],
    );

function formatListingCount(count: number): string {
    return count === 1 ? "1 listing" : `${count} listings`;
}

function formatChildCount(count: number, singular: string, plural: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

const WHERE_META_CLASS = cn(
    "truncate text-[12px] leading-snug font-medium tracking-[0.04em] text-ink-muted",
);

const WHERE_TITLE_CLASS = cn(
    "truncate text-[15px] leading-snug font-medium tracking-[-0.01em] text-ink",
);

const WHERE_MENU_LIST_PANEL_CLASS = cn(
    "relative overflow-hidden min-block-0",
    "max-block-[min(18rem,calc(var(--available-height)-11rem))]",
);

const KIND_LABEL: Record<OwnerListingLocationSearchHit["kind"], string> = {
    country: "Countries",
    state: "States",
    city: "Cities",
    locality: "Areas",
};

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

function LocationIcon({ icon: Icon = MapPin }: { icon?: AppIcon }) {
    return (
        <Icon
            aria-hidden
            data-slot="where-location-pin"
            color="var(--row-icon)"
            className="shrink-0 transition-[color,stroke] duration-160 block-5 inline-5"
            strokeWidth={1.75}
        />
    );
}

function WhereLocationMeta({ pathLabel }: { pathLabel: string }) {
    return (
        <span className={WHERE_META_CLASS} data-muted-line>
            <span className="capitalize">{pathLabel}</span>
        </span>
    );
}

function WhereListingCountBadge({ count, label }: { count: number; label?: string }) {
    return (
        <span
            className="
              body-xs inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft
              px-1.5 font-semibold tracking-normal text-brand-text tabular-nums block-5 min-inline-5
            "
            aria-label={label ?? formatListingCount(count)}
        >
            {count > 99 ? "99+" : count}
        </span>
    );
}

function WhereMenuEmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: AppIcon;
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

function WhereBrowseRow({
    title,
    meta,
    childCount,
    childLabel,
    query,
    icon,
    checked,
    onToggleSelect,
    onDrill,
}: {
    title: string;
    meta: string;
    /** States in country / cities in state / areas in city. */
    childCount: number;
    childLabel: string;
    query?: string;
    icon?: AppIcon;
    checked: boolean;
    onToggleSelect: () => void;
    onDrill: () => void;
}) {
    return (
        <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={onToggleSelect}
            className={cn(
                checkboxRowClass(checked),
                `pe-14 **:data-[slot=dropdown-menu-checkbox-item-indicator]:inset-e-11`,
            )}
        >
            <LocationIcon icon={icon} />
            <span className="flex flex-1 flex-col gap-1 text-start min-inline-0">
                <span className="flex items-center gap-2 min-inline-0">
                    <span data-slot="where-location-title" className={WHERE_TITLE_CLASS}>
                        {query ? (
                            <HighlightMatch text={title} query={query} />
                        ) : (
                            formatPlaceName(title)
                        )}
                    </span>
                    <WhereListingCountBadge count={childCount} label={childLabel} />
                </span>
                <WhereLocationMeta pathLabel={meta} />
            </span>
            <button
                type="button"
                aria-label={`Browse ${formatPlaceName(title)}`}
                className={cn(
                    `
                      absolute inset-e-1.5 inline-flex items-center justify-center rounded-control
                      text-ink-subtle block-8 inline-8
                      hover:bg-ink/5 hover:text-ink
                    `,
                    "transition-[background-color,color] duration-160",
                )}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDrill();
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
            >
                <ChevronRight aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </button>
        </DropdownMenuCheckboxItem>
    );
}

function WhereLocalityRow({
    locality,
    city,
    state,
    country,
    listingCount,
    query,
    checked,
    onToggle,
}: {
    locality: string;
    city: string;
    state: string;
    country: string;
    listingCount: number;
    query?: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <DropdownMenuCheckboxItem
            checked={checked}
            onCheckedChange={onToggle}
            className={checkboxRowClass(checked)}
        >
            <LocationIcon />
            <span className="flex flex-1 flex-col gap-1 text-start min-inline-0">
                <span className="flex items-center gap-2 min-inline-0">
                    <span data-slot="where-location-title" className={WHERE_TITLE_CLASS}>
                        {query ? (
                            <HighlightMatch text={locality} query={query} />
                        ) : (
                            formatPlaceName(locality)
                        )}
                    </span>
                    <WhereListingCountBadge count={listingCount} />
                </span>
                <WhereLocationMeta pathLabel={formatLocationPathLabel(city, state, country)} />
            </span>
        </DropdownMenuCheckboxItem>
    );
}

function WhereNavBar({
    level,
    childCount,
    onBack,
}: {
    level: WhereBrowseLevel;
    childCount: number;
    onBack: () => void;
}) {
    if (level.kind === "root") return null;

    const title =
        level.kind === "country"
            ? formatPlaceName(level.country)
            : level.kind === "state"
              ? formatPlaceName(level.state)
              : formatPlaceName(level.city);

    const subtitle =
        level.kind === "country"
            ? formatChildCount(childCount, "state", "states")
            : level.kind === "state"
              ? formatChildCount(childCount, "city", "cities")
              : formatChildCount(childCount, "area", "areas");

    return (
        <div className="flex items-center gap-2.5 border-bs border-border-warm/70 pbs-3">
            <button
                type="button"
                onClick={onBack}
                className="
                  inline-flex shrink-0 items-center justify-center rounded-control border
                  border-border-warm bg-surface text-ink shadow-sm
                  transition-[background-color,border-color] duration-160 block-9 inline-9
                  hover:border-ink/25 hover:bg-surface-muted/60
                "
                aria-label="Go back"
            >
                <ChevronLeft className="block-4 inline-4" strokeWidth={1.75} />
            </button>
            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                <p className="truncate text-sm font-semibold text-ink">{title}</p>
                <p className="body-xs truncate text-ink-muted">{subtitle}</p>
            </div>
        </div>
    );
}

function groupSearchHits(hits: OwnerListingLocationSearchHit[]) {
    const groups: {
        kind: OwnerListingLocationSearchHit["kind"];
        items: OwnerListingLocationSearchHit[];
    }[] = [];

    for (const kind of ["country", "state", "city", "locality"] as const) {
        const items = hits.filter((hit) => hit.kind === kind);
        if (items.length > 0) {
            groups.push({ kind, items });
        }
    }

    return groups;
}

export type OwnerListingsWhereSelection = {
    countries: string[];
    states: string[];
    cities: string[];
    localities: string[];
    yourAreas: boolean;
};

export type OwnerListingsWhereMenuProps = {
    isLoading?: boolean;
    hasError?: boolean;
    onRetry?: () => void;
    listings: OwnerListingItem[];
    selectedCountries: string[];
    selectedStates: string[];
    selectedCities: string[];
    selectedLocalities: string[];
    yourAreas: boolean;
    serviceAreas?: string[];
    /** Owner listings inside the service areas. Badge hidden while unknown. */
    serviceableListingCount?: number;
    onWhereChange: (next: OwnerListingsWhereSelection) => void;
    /** Apply the reset to the results while the menu stays open. */
    onCommit?: () => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
};

export function OwnerListingsWhereMenu({
    isLoading = false,
    hasError = false,
    onRetry,
    listings,
    selectedCountries,
    selectedStates,
    selectedCities,
    selectedLocalities,
    yourAreas,
    serviceAreas = [],
    serviceableListingCount,
    onWhereChange,
    onCommit,
    onOpenChange,
    className,
}: OwnerListingsWhereMenuProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [browseLevel, setBrowseLevel] = useState<WhereBrowseLevel>({ kind: "root" });
    const [whereTooltipOpen, setWhereTooltipOpen] = useState(false);

    const locationTree = useMemo(() => buildOwnerListingsLocationTree(listings), [listings]);
    const searchHits = useMemo(
        () => searchOwnerListingLocations(locationTree, query),
        [locationTree, query],
    );
    const searchGroups = useMemo(() => groupSearchHits(searchHits), [searchHits]);
    const selectedLocalitySet = useMemo(() => new Set(selectedLocalities), [selectedLocalities]);
    const hasListings = locationTree.length > 0;
    const isSearching = query.trim().length > 0;
    const showEmptyState = !hasListings || (isSearching && searchHits.length === 0);
    const hasNoPinnedPlace =
        selectedCountries.length === 0 &&
        selectedStates.length === 0 &&
        selectedCities.length === 0 &&
        selectedLocalities.length === 0;
    const isServiceableSelected = hasNoPinnedPlace && yourAreas;
    const isAnywhereSelected = hasNoPinnedPlace && !yourAreas;

    const serviceableMeta =
        serviceAreas.length > 0
            ? serviceAreas.map(formatPlaceName).join(" · ")
            : "Set areas in your profile";

    const headerDescription = isSearching
        ? "Matching places"
        : browseLevel.kind === "root"
          ? "Pick a country, state, city, or area"
          : "Select one or more, or open a place to browse";

    const emitWhere = (patch: Partial<OwnerListingsWhereSelection>) => {
        onWhereChange({
            countries: selectedCountries,
            states: selectedStates,
            cities: selectedCities,
            localities: selectedLocalities,
            yourAreas: false,
            ...patch,
        });
    };

    const selectServiceable = () => {
        setQuery("");
        setBrowseLevel({ kind: "root" });
        onWhereChange({
            countries: [],
            states: [],
            cities: [],
            localities: [],
            yourAreas: true,
        });
    };

    const selectAnywhere = () => {
        setQuery("");
        setBrowseLevel({ kind: "root" });
        onWhereChange({
            countries: [],
            states: [],
            cities: [],
            localities: [],
            yourAreas: false,
        });
    };

    const clearSelection = () => {
        selectAnywhere();
        onCommit?.();
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            setQuery("");
            setBrowseLevel({ kind: "root" });
        }
        onOpenChange?.(nextOpen);
    };

    const isCountrySelected = (country: string) =>
        selectedCountries.some((item) => item.toLowerCase() === country.toLowerCase());

    const isStateSelected = (country: string, state: string) => {
        const key = encodeOwnerListingStateKey(country, state).toLowerCase();
        return selectedStates.some((item) => item.toLowerCase() === key);
    };

    const isCitySelected = (city: string) =>
        selectedCities.some((item) => item.toLowerCase() === city.toLowerCase());

    const toggleCountrySelect = (country: string) => {
        emitWhere({ countries: toggleStringList(selectedCountries, country) });
    };

    const toggleStateSelect = (country: string, state: string) => {
        emitWhere({
            states: toggleStringList(selectedStates, encodeOwnerListingStateKey(country, state)),
        });
    };

    const toggleCitySelect = (city: string) => {
        emitWhere({ cities: toggleStringList(selectedCities, city) });
    };

    const drillCountry = (country: string) => {
        setQuery("");
        setBrowseLevel({ kind: "country", country });
    };

    const drillState = (country: string, state: string) => {
        setQuery("");
        setBrowseLevel({ kind: "state", country, state });
    };

    const drillCity = (country: string, state: string, city: string) => {
        setQuery("");
        setBrowseLevel({ kind: "city", country, state, city });
    };

    const toggleLocality = (locality: string) => {
        emitWhere({ localities: toggleStringList(selectedLocalities, locality) });
    };

    const browseChildCount = useMemo(() => {
        if (browseLevel.kind === "country") {
            return findCountryGroup(locationTree, browseLevel.country)?.states.length ?? 0;
        }
        if (browseLevel.kind === "state") {
            return (
                findStateGroup(locationTree, browseLevel.country, browseLevel.state)?.cities
                    .length ?? 0
            );
        }
        if (browseLevel.kind === "city") {
            return (
                findCityGroup(
                    locationTree,
                    browseLevel.country,
                    browseLevel.state,
                    browseLevel.city,
                )?.localities.length ?? 0
            );
        }
        return 0;
    }, [browseLevel, locationTree]);

    const goBack = () => {
        if (browseLevel.kind === "city") {
            setBrowseLevel({
                kind: "state",
                country: browseLevel.country,
                state: browseLevel.state,
            });
            return;
        }
        if (browseLevel.kind === "state") {
            setBrowseLevel({ kind: "country", country: browseLevel.country });
            return;
        }
        setBrowseLevel({ kind: "root" });
    };

    const whereTooltipLabel = formatLocalitiesTooltip(
        selectedLocalities,
        selectedCities,
        yourAreas,
        selectedCountries,
        selectedStates,
    );
    const showWhereTooltip = !open && Boolean(whereTooltipLabel);

    const renderBrowseList = () => {
        if (browseLevel.kind === "city") {
            const cityGroup = findCityGroup(
                locationTree,
                browseLevel.country,
                browseLevel.state,
                browseLevel.city,
            );
            if (!cityGroup) return null;
            return cityGroup.localities.map((leaf) => (
                <WhereLocalityRow
                    key={`${leaf.country}-${leaf.state}-${leaf.city}-${leaf.locality}`}
                    locality={leaf.locality}
                    city={leaf.city}
                    state={leaf.state}
                    country={leaf.country}
                    listingCount={leaf.listingCount}
                    checked={selectedLocalitySet.has(leaf.locality)}
                    onToggle={() => toggleLocality(leaf.locality)}
                />
            ));
        }

        if (browseLevel.kind === "state") {
            const stateGroup = findStateGroup(locationTree, browseLevel.country, browseLevel.state);
            if (!stateGroup) return null;
            return stateGroup.cities.map((cityGroup) => (
                <WhereBrowseRow
                    key={`${cityGroup.country}-${cityGroup.state}-${cityGroup.city}`}
                    title={cityGroup.city}
                    meta={formatListingCount(cityGroup.listingCount)}
                    childCount={cityGroup.localities.length}
                    childLabel={formatChildCount(cityGroup.localities.length, "area", "areas")}
                    icon={Building2}
                    checked={isCitySelected(cityGroup.city)}
                    onToggleSelect={() => toggleCitySelect(cityGroup.city)}
                    onDrill={() => drillCity(cityGroup.country, cityGroup.state, cityGroup.city)}
                />
            ));
        }

        if (browseLevel.kind === "country") {
            const countryGroup = findCountryGroup(locationTree, browseLevel.country);
            if (!countryGroup) return null;
            return countryGroup.states.map((stateGroup) => (
                <WhereBrowseRow
                    key={`${stateGroup.country}-${stateGroup.state}`}
                    title={stateGroup.state}
                    meta={formatListingCount(stateGroup.listingCount)}
                    childCount={stateGroup.cities.length}
                    childLabel={formatChildCount(stateGroup.cities.length, "city", "cities")}
                    icon={LandPlot}
                    checked={isStateSelected(stateGroup.country, stateGroup.state)}
                    onToggleSelect={() => toggleStateSelect(stateGroup.country, stateGroup.state)}
                    onDrill={() => drillState(stateGroup.country, stateGroup.state)}
                />
            ));
        }

        // Root: Anywhere + Serviceable, then the tree from countries down.
        return (
            <>
                <DropdownMenuCheckboxItem
                    checked={isAnywhereSelected}
                    onCheckedChange={selectAnywhere}
                    className={checkboxRowClass(isAnywhereSelected)}
                >
                    <LocationIcon icon={MapPinOff} />
                    <span className="flex flex-1 flex-col gap-1 text-start min-inline-0">
                        <span data-slot="where-location-title" className={WHERE_TITLE_CLASS}>
                            Anywhere
                        </span>
                        <WhereLocationMeta pathLabel="All listed properties" />
                    </span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={isServiceableSelected}
                    onCheckedChange={selectServiceable}
                    className={checkboxRowClass(isServiceableSelected)}
                >
                    <LocationIcon icon={MapPinned} />
                    <span className="flex flex-1 flex-col gap-1 text-start min-inline-0">
                        <span className="flex items-center gap-2 min-inline-0">
                            <span data-slot="where-location-title" className={WHERE_TITLE_CLASS}>
                                Serviceable areas
                            </span>
                            {serviceAreas.length > 0 && serviceableListingCount != null ? (
                                <WhereListingCountBadge count={serviceableListingCount} />
                            ) : null}
                        </span>
                        <WhereLocationMeta pathLabel={serviceableMeta} />
                    </span>
                </DropdownMenuCheckboxItem>

                {locationTree.map((countryGroup) => (
                    <WhereBrowseRow
                        key={countryGroup.country}
                        title={countryGroup.country}
                        meta={formatListingCount(countryGroup.listingCount)}
                        childCount={countryGroup.states.length}
                        childLabel={formatChildCount(countryGroup.states.length, "state", "states")}
                        icon={Globe2}
                        checked={isCountrySelected(countryGroup.country)}
                        onToggleSelect={() => toggleCountrySelect(countryGroup.country)}
                        onDrill={() => drillCountry(countryGroup.country)}
                    />
                ))}
            </>
        );
    };

    return (
        <div className={cn("inline-full min-inline-0", className)}>
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <TooltipProvider>
                    <Tooltip
                        open={showWhereTooltip && whereTooltipOpen}
                        onOpenChange={(nextOpen) => {
                            setWhereTooltipOpen(showWhereTooltip ? nextOpen : false);
                        }}
                    >
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
                                                yourAreas,
                                                selectedCountries,
                                                selectedStates,
                                            )}
                                            className="inline-full"
                                            isOpen={open}
                                            isActive={!isAnywhereSelected}
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
                        "flex flex-col overflow-hidden! p-0",
                        "max-block-[min(28rem,var(--available-height))]",
                    )}
                >
                    <div className="flex shrink-0 flex-col gap-3 px-4 pbs-4 pbe-3">
                        <OwnerListingsBandMenuHeader
                            description={headerDescription}
                            showReset={!isAnywhereSelected}
                            onClear={clearSelection}
                        />
                        <Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search places"
                            startIcon={Search}
                            clearable
                            size="lg"
                            autoFocus={open}
                            aria-label="Search country, state, city or area"
                            className="text-sm text-ink shadow-sm placeholder:text-sm"
                            wrapperClassName="text-ink"
                            onKeyDown={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                        />
                        {!isSearching ? (
                            <WhereNavBar
                                level={browseLevel}
                                childCount={browseChildCount}
                                onBack={goBack}
                            />
                        ) : null}
                    </div>

                    {isLoading ? (
                        <div
                            role="status"
                            aria-busy="true"
                            className="flex flex-col gap-3 p-4 min-block-48"
                        >
                            <span className="sr-only">Loading places</span>
                            {Array.from({ length: 4 }, (_, index) => (
                                <span
                                    key={index}
                                    aria-hidden
                                    className="
                                      block animate-pulse rounded-control bg-surface-muted block-8
                                      inline-full
                                      motion-reduce:animate-none
                                    "
                                />
                            ))}
                        </div>
                    ) : hasError ? (
                        <div
                            role="alert"
                            className="
                              flex flex-col items-center justify-center gap-3 px-4 py-6 min-block-48
                            "
                        >
                            <p className="body-sm text-ink-muted">Could not load places.</p>
                            <button
                                type="button"
                                onClick={onRetry}
                                className="body-sm px-4 font-semibold text-brand min-block-11"
                            >
                                Try again
                            </button>
                        </div>
                    ) : showEmptyState && isSearching ? (
                        <div
                            className={cn(
                                WHERE_MENU_LIST_PANEL_CLASS,
                                "flex items-center justify-center px-3 py-10",
                            )}
                        >
                            <WhereMenuEmptyState
                                icon={Search}
                                title="No properties here yet"
                                description={`No one has listed a property for "${query.trim()}" yet. Try another place, or check back later.`}
                            />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                WHERE_MENU_LIST_PANEL_CLASS,
                                "overflow-y-auto overscroll-contain px-3 pbe-3",
                            )}
                        >
                            {isSearching ? (
                                searchGroups.map((group) => (
                                    <div key={group.kind} className="flex flex-col">
                                        <p
                                            className="
                                              body-xs px-2.5 py-2 font-semibold tracking-wide
                                              text-ink-muted uppercase
                                            "
                                        >
                                            {KIND_LABEL[group.kind]}
                                        </p>
                                        {group.items.map((hit) => {
                                            if (hit.kind === "locality") {
                                                return (
                                                    <WhereLocalityRow
                                                        key={`locality-${hit.country}-${hit.state}-${hit.city}-${hit.locality}`}
                                                        locality={hit.locality}
                                                        city={hit.city}
                                                        state={hit.state}
                                                        country={hit.country}
                                                        listingCount={hit.listingCount}
                                                        query={query}
                                                        checked={selectedLocalitySet.has(
                                                            hit.locality,
                                                        )}
                                                        onToggle={() =>
                                                            toggleLocality(hit.locality)
                                                        }
                                                    />
                                                );
                                            }

                                            const title =
                                                hit.kind === "country"
                                                    ? hit.country
                                                    : hit.kind === "state"
                                                      ? hit.state
                                                      : hit.city;
                                            const icon =
                                                hit.kind === "country"
                                                    ? Globe2
                                                    : hit.kind === "state"
                                                      ? LandPlot
                                                      : Building2;
                                            const checked =
                                                hit.kind === "country"
                                                    ? isCountrySelected(hit.country)
                                                    : hit.kind === "state"
                                                      ? isStateSelected(hit.country, hit.state)
                                                      : isCitySelected(hit.city);

                                            const childCount =
                                                hit.kind === "country"
                                                    ? (findCountryGroup(locationTree, hit.country)
                                                          ?.states.length ?? 0)
                                                    : hit.kind === "state"
                                                      ? (findStateGroup(
                                                            locationTree,
                                                            hit.country,
                                                            hit.state,
                                                        )?.cities.length ?? 0)
                                                      : (findCityGroup(
                                                            locationTree,
                                                            hit.country,
                                                            hit.state,
                                                            hit.city,
                                                        )?.localities.length ?? 0);

                                            const childLabel =
                                                hit.kind === "country"
                                                    ? formatChildCount(
                                                          childCount,
                                                          "state",
                                                          "states",
                                                      )
                                                    : hit.kind === "state"
                                                      ? formatChildCount(
                                                            childCount,
                                                            "city",
                                                            "cities",
                                                        )
                                                      : formatChildCount(
                                                            childCount,
                                                            "area",
                                                            "areas",
                                                        );

                                            return (
                                                <WhereBrowseRow
                                                    key={`${hit.kind}-${title}-${hit.pathLabel}`}
                                                    title={title}
                                                    meta={formatListingCount(hit.listingCount)}
                                                    childCount={childCount}
                                                    childLabel={childLabel}
                                                    query={query}
                                                    icon={icon}
                                                    checked={checked}
                                                    onToggleSelect={() => {
                                                        if (hit.kind === "country") {
                                                            toggleCountrySelect(hit.country);
                                                            return;
                                                        }
                                                        if (hit.kind === "state") {
                                                            toggleStateSelect(
                                                                hit.country,
                                                                hit.state,
                                                            );
                                                            return;
                                                        }
                                                        toggleCitySelect(hit.city);
                                                    }}
                                                    onDrill={() => {
                                                        if (hit.kind === "country") {
                                                            drillCountry(hit.country);
                                                            return;
                                                        }
                                                        if (hit.kind === "state") {
                                                            drillState(hit.country, hit.state);
                                                            return;
                                                        }
                                                        drillCity(hit.country, hit.state, hit.city);
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))
                            ) : hasListings ? (
                                renderBrowseList()
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
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
