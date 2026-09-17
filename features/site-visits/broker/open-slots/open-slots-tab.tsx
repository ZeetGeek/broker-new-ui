"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import { TIME_BUCKETS } from "@/lib/visits/constants";
import { sortSlotsForBuyer } from "@/lib/visits/grouping";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { VirtualStack } from "@/components/shared/virtual-stack";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type {
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import type { ApiPropertyOption } from "@/lib/api/broker-visits-map";
import { BuyerMatchBar } from "@/features/site-visits/broker/open-slots/buyer-match-bar";
import { PropertyRow } from "@/features/site-visits/broker/open-slots/property-row";
import {
    DEFAULT_SLOT_FILTERS,
    SlotFilters,
    type SlotFilterState,
} from "@/features/site-visits/broker/open-slots/slot-filters";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const FILTER_KEYS = [
    "range",
    "from",
    "to",
    "time",
    "locality",
    "purpose",
    "type",
    "bhk",
    "minBudget",
    "maxBudget",
    "owner",
    "accepted",
    "full",
];

function readFilters(params: URLSearchParams): SlotFilterState {
    const rangeValue = params.get("range");
    const range =
        rangeValue === "today" || rangeValue === "tomorrow" || rangeValue === "custom"
            ? rangeValue
            : "week";
    const purpose = params.get("purpose");
    return {
        range,
        customFrom: params.get("from") ?? "",
        customTo: params.get("to") ?? "",
        timeBuckets: params.getAll("time"),
        localities: params.getAll("locality"),
        purpose: purpose === "sale" || purpose === "rent" ? purpose : "",
        propertyType: params.get("type") ?? "",
        bhk: params.get("bhk") ?? "",
        minBudget: params.get("minBudget") ?? "",
        maxBudget: params.get("maxBudget") ?? "",
        owner: params.get("owner") ?? "",
        onlyAccepted: params.get("accepted") !== "0",
        hideFull: params.get("full") !== "0",
    };
}

function writeFilters(params: URLSearchParams, filters: SlotFilterState) {
    FILTER_KEYS.forEach((key) => params.delete(key));
    if (filters.range !== "week") params.set("range", filters.range);
    if (filters.range === "custom" && filters.customFrom) params.set("from", filters.customFrom);
    if (filters.range === "custom" && filters.customTo) params.set("to", filters.customTo);
    filters.timeBuckets.forEach((value) => params.append("time", value));
    filters.localities.forEach((value) => params.append("locality", value));
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.propertyType) params.set("type", filters.propertyType);
    if (filters.bhk) params.set("bhk", filters.bhk);
    if (filters.minBudget) params.set("minBudget", filters.minBudget);
    if (filters.maxBudget) params.set("maxBudget", filters.maxBudget);
    if (filters.owner) params.set("owner", filters.owner);
    if (!filters.onlyAccepted) params.set("accepted", "0");
    if (!filters.hideFull) params.set("full", "0");
}

function activeCount(filters: SlotFilterState) {
    return (
        Number(filters.range !== "week") +
        filters.timeBuckets.length +
        filters.localities.length +
        Number(Boolean(filters.purpose)) +
        Number(Boolean(filters.propertyType)) +
        Number(Boolean(filters.bhk)) +
        Number(Boolean(filters.minBudget)) +
        Number(Boolean(filters.maxBudget)) +
        Number(Boolean(filters.owner)) +
        Number(!filters.onlyAccepted) +
        Number(!filters.hideFull)
    );
}

export function OpenSlotsTab({
    items,
    propertyOptions = [],
    selectedPropertyId,
    buyers,
    buyerId,
    isLoading,
    isError,
    isFetchingMore = false,
    hasMore = false,
    updatedAt,
    onBuyerChange,
    onPropertyChange,
    onBook,
    onOpenVisit,
    onRequest,
    onRefresh,
    onLoadMore,
    rowErrors = {},
}: {
    items: PropertyWithSlots[];
    propertyOptions?: ApiPropertyOption[];
    selectedPropertyId?: string;
    buyers: PersonSummary[];
    buyerId?: string;
    isLoading: boolean;
    isError: boolean;
    isFetchingMore?: boolean;
    hasMore?: boolean;
    updatedAt: number;
    onBuyerChange: (id?: string) => void;
    onPropertyChange?: (id?: string) => void;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: (propertyId?: string) => void;
    onRefresh: () => void;
    onLoadMore?: () => void;
    rowErrors?: Record<string, string>;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const filters = useMemo(
        () => readFilters(new URLSearchParams(searchParams.toString())),
        [searchParams],
    );
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState(filters);
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const urlQuery = searchParams.get("q") ?? "";

    const replaceParams = useCallback(
        (mutate: (params: URLSearchParams) => void) => {
            const next = new URLSearchParams(searchParams.toString());
            mutate(next);
            const queryString = next.toString();
            router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );
    const setFilters = useCallback(
        (nextFilters: SlotFilterState) =>
            replaceParams((params) => writeFilters(params, nextFilters)),
        [replaceParams],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const nextQuery = query.trim();
            if (nextQuery === urlQuery) return;
            replaceParams((params) =>
                nextQuery ? params.set("q", nextQuery) : params.delete("q"),
            );
        }, 250);
        return () => window.clearTimeout(timer);
    }, [query, replaceParams, urlQuery]);

    // Server already applies Open slots filters; only re-rank for buyer match.
    const shown = useMemo(() => sortSlotsForBuyer(items, buyerId), [buyerId, items]);
    const count = activeCount(filters);
    const propertySelectValue = selectedPropertyId || "all";
    const chips = [
        ...(selectedPropertyId
            ? [
                  {
                      key: "property",
                      label:
                          propertyOptions.find((option) => option.id === selectedPropertyId)
                              ?.title ?? "Selected property",
                      clear: () => onPropertyChange?.(undefined),
                  },
              ]
            : []),
        ...(filters.range !== "week"
            ? [
                  {
                      key: "range",
                      label:
                          filters.range === "custom"
                              ? `${filters.customFrom || "Start"} to ${filters.customTo || "End"}`
                              : filters.range[0].toUpperCase() + filters.range.slice(1),
                      clear: () =>
                          setFilters({ ...filters, range: "week", customFrom: "", customTo: "" }),
                  },
              ]
            : []),
        ...filters.timeBuckets.map((value) => ({
            key: `time-${value}`,
            label: TIME_BUCKETS.find((item) => item.id === value)?.label ?? value,
            clear: () =>
                setFilters({
                    ...filters,
                    timeBuckets: filters.timeBuckets.filter((item) => item !== value),
                }),
        })),
        ...filters.localities.map((value) => ({
            key: `locality-${value}`,
            label: value,
            clear: () =>
                setFilters({
                    ...filters,
                    localities: filters.localities.filter((item) => item !== value),
                }),
        })),
        ...(filters.purpose
            ? [
                  {
                      key: "purpose",
                      label: filters.purpose === "sale" ? "Sale" : "Rent",
                      clear: () => setFilters({ ...filters, purpose: "" }),
                  },
              ]
            : []),
        ...(filters.propertyType
            ? [
                  {
                      key: "type",
                      label: filters.propertyType,
                      clear: () => setFilters({ ...filters, propertyType: "" }),
                  },
              ]
            : []),
        ...(filters.bhk
            ? [
                  {
                      key: "bhk",
                      label: `${filters.bhk} BHK`,
                      clear: () => setFilters({ ...filters, bhk: "" }),
                  },
              ]
            : []),
        ...(filters.minBudget
            ? [
                  {
                      key: "minBudget",
                      label: `From ₹${Number(filters.minBudget).toLocaleString("en-IN")}`,
                      clear: () => setFilters({ ...filters, minBudget: "" }),
                  },
              ]
            : []),
        ...(filters.maxBudget
            ? [
                  {
                      key: "maxBudget",
                      label: `Up to ₹${Number(filters.maxBudget).toLocaleString("en-IN")}`,
                      clear: () => setFilters({ ...filters, maxBudget: "" }),
                  },
              ]
            : []),
        ...(filters.owner
            ? [
                  {
                      key: "owner",
                      label: "Selected owner",
                      clear: () => setFilters({ ...filters, owner: "" }),
                  },
              ]
            : []),
        ...(!filters.onlyAccepted
            ? [
                  {
                      key: "access",
                      label: "All properties",
                      clear: () => setFilters({ ...filters, onlyAccepted: true }),
                  },
              ]
            : []),
        ...(!filters.hideFull
            ? [
                  {
                      key: "full",
                      label: "Showing full slots",
                      clear: () => setFilters({ ...filters, hideFull: true }),
                  },
              ]
            : []),
    ];

    if (isLoading && items.length === 0) return <VisitsTabSkeleton kind="slots" />;
    if (isError) return <EmptyState kind="slots-error" onPrimary={onRefresh} />;

    return (
        <section className="space-y-4">
            <BuyerMatchBar buyers={buyers} value={buyerId} onChange={onBuyerChange} />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
                <label className="space-y-1.5">
                    <span className="body-xs font-semibold text-ink-muted">Property</span>
                    <Select
                        value={propertySelectValue}
                        onValueChange={(next) =>
                            onPropertyChange?.(!next || next === "all" ? undefined : next)
                        }
                    >
                        <SelectTrigger size="md">
                            <SelectValue placeholder="All properties" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All properties</SelectItem>
                            {propertyOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.title}
                                    {option.locality ? ` · ${option.locality}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            </div>

            <TooltipProvider>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <OwnerListingsChipsCarousel>
                        <OwnerListingsChipsCarouselSlide>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            className={ownerListingsChipClassName(count > 0)}
                                            onClick={() => {
                                                setDraftFilters(filters);
                                                setFiltersOpen(true);
                                            }}
                                            aria-pressed={count > 0}
                                        >
                                            <SlidersHorizontal
                                                aria-hidden
                                                className="text-brand block-4 inline-4"
                                            />
                                            Filters
                                            {count > 0 ? (
                                                <span
                                                    className={ownerListingsChipCountClassName(
                                                        true,
                                                    )}
                                                >
                                                    {formatChipCount(count)}
                                                </span>
                                            ) : null}
                                        </button>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    Date, locality, property and access filters
                                </TooltipContent>
                            </Tooltip>
                        </OwnerListingsChipsCarouselSlide>
                        {(["today", "tomorrow", "week"] as const).map((range) => (
                            <OwnerListingsChipsCarouselSlide key={range}>
                                <button
                                    type="button"
                                    className={ownerListingsChipClassName(filters.range === range)}
                                    aria-pressed={filters.range === range}
                                    onClick={() =>
                                        setFilters({
                                            ...filters,
                                            range,
                                            customFrom: "",
                                            customTo: "",
                                        })
                                    }
                                >
                                    {range === "week"
                                        ? "This week"
                                        : range[0].toUpperCase() + range.slice(1)}
                                </button>
                            </OwnerListingsChipsCarouselSlide>
                        ))}
                    </OwnerListingsChipsCarousel>

                    <div className="flex items-center gap-2 min-inline-0 md:min-inline-[360px]">
                        <Input
                            id="slot-search"
                            size="md"
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search property, locality or owner"
                            aria-label="Search open slots"
                            startIcon={Search}
                            clearable
                            wrapperClassName="flex-1 min-inline-0"
                        />
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="surface"
                                        size="icon-md"
                                        onClick={onRefresh}
                                        aria-label="Refresh slots"
                                    >
                                        <RefreshCw aria-hidden />
                                    </Button>
                                }
                            />
                            <TooltipContent side="bottom">Refresh available times</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </TooltipProvider>

            {chips.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                    {chips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={chip.clear}
                            className="body-xs flex items-center gap-1 rounded-md border border-brand/15 bg-brand-soft px-2.5 font-semibold text-brand-text block-control-md hover:bg-brand-soft-hover"
                        >
                            {chip.label}
                            <X aria-hidden className="block-3 inline-3" />
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFilters(DEFAULT_SLOT_FILTERS)}
                        className="body-xs px-2 font-semibold text-brand-text block-control-md hover:underline"
                    >
                        Clear all
                    </button>
                </div>
            ) : null}

            <div className="flex flex-wrap items-end justify-between gap-2 px-1">
                <div>
                    <h2 className="h5 text-ink">
                        {shown.length} {shown.length === 1 ? "property has" : "properties have"}{" "}
                        visit times
                    </h2>
                    <p className="body-sm text-ink-muted">
                        Choose a time or ask the owner for another one.
                    </p>
                </div>
                <p className="body-xs text-ink-muted">
                    Updated {formatDistanceToNowStrict(updatedAt, { addSuffix: true })}
                </p>
            </div>

            {shown.length === 0 ? (
                <EmptyState
                    kind="no-slots"
                    onPrimary={() => setFilters(DEFAULT_SLOT_FILTERS)}
                    onSecondary={() => onRequest()}
                />
            ) : shown.length > 40 ? (
                <VirtualStack
                    items={shown}
                    estimateSize={280}
                    getKey={(item) => item.property.id}
                    renderItem={(item) => (
                        <PropertyRow
                            item={item}
                            buyerSelected={Boolean(buyerId)}
                            hideFull={filters.hideFull}
                            onBook={onBook}
                            onOpenVisit={onOpenVisit}
                            onRequest={() => onRequest(item.property.id)}
                            inlineError={rowErrors[item.property.id]}
                        />
                    )}
                />
            ) : (
                <div className="space-y-3">
                    {shown.map((item) => (
                        <PropertyRow
                            key={item.property.id}
                            item={item}
                            buyerSelected={Boolean(buyerId)}
                            hideFull={filters.hideFull}
                            onBook={onBook}
                            onOpenVisit={onOpenVisit}
                            onRequest={() => onRequest(item.property.id)}
                            inlineError={rowErrors[item.property.id]}
                        />
                    ))}
                </div>
            )}

            {hasMore ? (
                <div className="flex justify-center pbs-2">
                    <Button
                        type="button"
                        variant="surface"
                        size="md"
                        disabled={isFetchingMore}
                        onClick={() => onLoadMore?.()}
                    >
                        {isFetchingMore ? "Loading…" : "Load more properties"}
                    </Button>
                </div>
            ) : null}

            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogPopup className="gap-0 overflow-hidden p-0 max-inline-3xl sm:max-inline-3xl">
                    <DialogHeader className="border-be border-border-warm px-5 py-4 text-start">
                        <DialogTitle>Filter open slots</DialogTitle>
                        <DialogDescription>
                            Set the time, property and owner criteria for this booking.
                        </DialogDescription>
                        <DialogClose />
                    </DialogHeader>
                    <div className="overflow-y-auto p-5 max-block-[68dvh]">
                        <SlotFilters value={draftFilters} onChange={setDraftFilters} />
                    </div>
                    <footer className="border-bs border-border-warm bg-surface px-5 py-4">
                        <AppModalFooter
                            secondaryLabel="Clear all"
                            onSecondary={() => setDraftFilters(DEFAULT_SLOT_FILTERS)}
                            primaryLabel="Apply filters"
                            onPrimary={() => {
                                setFilters(draftFilters);
                                setFiltersOpen(false);
                            }}
                        />
                    </footer>
                </DialogPopup>
            </Dialog>
        </section>
    );
}
