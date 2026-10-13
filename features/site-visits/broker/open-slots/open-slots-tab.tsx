"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatDistanceToNowStrict } from "date-fns";

import type { ApiPropertyOption } from "@/lib/api/broker-visits-map";
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

import type {
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import { PropertyRow } from "@/features/site-visits/broker/open-slots/property-row";
import {
    DEFAULT_SLOT_FILTERS,
    SlotFilters,
    type SlotFilterState,
} from "@/features/site-visits/broker/open-slots/slot-filters";
import {
    VisitsFilterChips,
    visitsRangeChipLabel,
} from "@/features/site-visits/broker/visits-filter-chips";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

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
        rangeValue === "today" ||
        rangeValue === "tomorrow" ||
        rangeValue === "month" ||
        rangeValue === "custom"
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

/** Sheet badge count — date range lives on the toolbar, so exclude it. */
export function countOpenSlotFilters(
    filters: SlotFilterState,
    buyerId?: string,
    propertyId?: string,
) {
    return (
        filters.timeBuckets.length +
        filters.localities.length +
        Number(Boolean(filters.purpose)) +
        Number(Boolean(filters.propertyType)) +
        Number(Boolean(filters.bhk)) +
        Number(Boolean(filters.minBudget)) +
        Number(Boolean(filters.maxBudget)) +
        Number(Boolean(filters.owner)) +
        Number(!filters.onlyAccepted) +
        Number(!filters.hideFull) +
        Number(Boolean(buyerId)) +
        Number(Boolean(propertyId))
    );
}

export function readOpenSlotFilters(params: URLSearchParams): SlotFilterState {
    return readFilters(params);
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
    filtersOpen = false,
    onFiltersOpenChange,
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
    filtersOpen?: boolean;
    onFiltersOpenChange?: (open: boolean) => void;
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
    const [draftFilters, setDraftFilters] = useState(filters);
    const [draftBuyerId, setDraftBuyerId] = useState(buyerId);
    const [draftPropertyId, setDraftPropertyId] = useState(selectedPropertyId);
    const setFiltersOpen = onFiltersOpenChange ?? (() => undefined);

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

    // Server already applies Open slots filters; only re-rank for buyer match.
    const shown = useMemo(() => sortSlotsForBuyer(items, buyerId), [buyerId, items]);

    const searchQuery = searchParams.get("q")?.trim() ?? "";
    const chips = [
        ...(searchQuery
            ? [
                  {
                      key: "query",
                      label: `“${searchQuery}”`,
                      clear: () =>
                          replaceParams((params) => {
                              params.delete("q");
                          }),
                  },
              ]
            : []),
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
                      label: visitsRangeChipLabel(
                          filters.range,
                          filters.customFrom,
                          filters.customTo,
                      ),
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

    const filtersDialog = (
        <Dialog
            open={filtersOpen}
            onOpenChange={(open) => {
                if (open) {
                    setDraftFilters(filters);
                    setDraftBuyerId(buyerId);
                    setDraftPropertyId(selectedPropertyId);
                }
                setFiltersOpen(open);
            }}
        >
            <DialogPopup className="gap-0 overflow-hidden p-0 max-inline-3xl sm:max-inline-3xl">
                <DialogHeader className="border-be border-border-warm px-5 py-4 text-start">
                    <DialogTitle>Filter open slots</DialogTitle>
                    <DialogDescription>
                        Set the time, property and owner criteria for this booking.
                    </DialogDescription>
                    <DialogClose />
                </DialogHeader>
                <div className="overflow-y-auto p-5 max-block-[68dvh]">
                    <SlotFilters
                        value={draftFilters}
                        onChange={setDraftFilters}
                        buyers={buyers}
                        buyerId={draftBuyerId}
                        onBuyerChange={setDraftBuyerId}
                        propertyOptions={propertyOptions}
                        propertyId={draftPropertyId}
                        onPropertyChange={setDraftPropertyId}
                    />
                </div>
                <footer className="border-bs border-border-warm bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Clear all"
                        onSecondary={() => {
                            setDraftFilters(DEFAULT_SLOT_FILTERS);
                            setDraftBuyerId(undefined);
                            setDraftPropertyId(undefined);
                        }}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            setFilters(draftFilters);
                            onBuyerChange(draftBuyerId);
                            onPropertyChange?.(draftPropertyId);
                            setFiltersOpen(false);
                        }}
                    />
                </footer>
            </DialogPopup>
        </Dialog>
    );

    if (isLoading && items.length === 0) {
        return (
            <>
                <VisitsTabSkeleton kind="slots" />
                {filtersDialog}
            </>
        );
    }
    if (isError) {
        return (
            <>
                <EmptyState kind="slots-error" onPrimary={onRefresh} />
                {filtersDialog}
            </>
        );
    }

    return (
        <section className="space-y-4">
            <VisitsFilterChips
                chips={chips}
                onClearAll={() => {
                    // Clear everything in one URL write. Do not call
                    // onBuyerChange / onPropertyChange afterward — those
                    // patch from stale searchParams and put filters back.
                    replaceParams((params) => {
                        writeFilters(params, DEFAULT_SLOT_FILTERS);
                        params.delete("q");
                        params.delete("buyer");
                        params.delete("propertyId");
                    });
                }}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="body-sm text-ink-muted">
                    <span className="font-semibold text-ink tabular-nums">{shown.length}</span>{" "}
                    {shown.length === 1 ? "property has" : "properties have"} visit times
                </p>
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

            {filtersDialog}
        </section>
    );
}
