"use client";

import { useCallback, useMemo, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";

import type {
    ApiLeadOption,
    ApiOwnerOption,
    ApiPropertyOption,
} from "@/lib/api/broker-visits-map";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
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
    leadOptionLabel,
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
    "owner",
    "time",
    "locality",
    "purpose",
    "type",
    "bhk",
    "minBudget",
    "maxBudget",
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
    return {
        range,
        customFrom: params.get("from") ?? "",
        customTo: params.get("to") ?? "",
        owner: params.get("owner") ?? "",
    };
}

function writeFilters(params: URLSearchParams, filters: SlotFilterState) {
    FILTER_KEYS.forEach((key) => params.delete(key));
    if (filters.range !== "week") params.set("range", filters.range);
    if (filters.range === "custom" && filters.customFrom) params.set("from", filters.customFrom);
    if (filters.range === "custom" && filters.customTo) params.set("to", filters.customTo);
    if (filters.owner) params.set("owner", filters.owner);
}

/** Sheet badge count — date range lives on the toolbar, so exclude it. */
export function countOpenSlotFilters(
    filters: SlotFilterState,
    buyerId?: string,
    propertyId?: string,
    leadId?: string,
) {
    return (
        Number(Boolean(filters.owner)) +
        Number(Boolean(buyerId)) +
        Number(Boolean(propertyId)) +
        Number(Boolean(leadId))
    );
}

export function readOpenSlotFilters(params: URLSearchParams): SlotFilterState {
    return readFilters(params);
}

export function OpenSlotsTab({
    items,
    propertyOptions = [],
    ownerOptions = [],
    leadOptions = [],
    selectedPropertyId,
    leadId,
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
    onLeadChange,
    onBook,
    onOpenVisit,
    onRequest,
    onRefresh,
    onLoadMore,
    rowErrors = {},
    mode = "platform",
}: {
    items: PropertyWithSlots[];
    propertyOptions?: ApiPropertyOption[];
    ownerOptions?: ApiOwnerOption[];
    leadOptions?: ApiLeadOption[];
    selectedPropertyId?: string;
    leadId?: string;
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
    onLeadChange?: (id?: string) => void;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: (propertyId?: string) => void;
    onRefresh: () => void;
    onLoadMore?: () => void;
    rowErrors?: Record<string, string>;
    mode?: "platform" | "exclusive";
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
    const [draftLeadId, setDraftLeadId] = useState(leadId);
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
        ...(buyerId
            ? [
                  {
                      key: "buyer",
                      label: buyers.find((buyer) => buyer.id === buyerId)?.name ?? "Selected buyer",
                      clear: () => onBuyerChange(undefined),
                  },
              ]
            : []),
        ...(leadId
            ? [
                  {
                      key: "lead",
                      label: (() => {
                          const lead = leadOptions.find((option) => option.id === leadId);
                          return lead ? leadOptionLabel(lead) : "Selected lead";
                      })(),
                      clear: () => onLeadChange?.(undefined),
                  },
              ]
            : []),
        ...(filters.owner
            ? [
                  {
                      key: "owner",
                      label:
                          ownerOptions.find((owner) => owner.id === filters.owner)?.name ??
                          "Selected owner",
                      clear: () => setFilters({ ...filters, owner: "" }),
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
    ];

    const filtersDialog = (
        <Dialog
            open={filtersOpen}
            onOpenChange={(open) => {
                if (open) {
                    setDraftFilters(filters);
                    setDraftBuyerId(buyerId);
                    setDraftLeadId(leadId);
                }
                setFiltersOpen(open);
            }}
        >
            <DialogPopup className="gap-0 overflow-hidden p-0 max-inline-3xl sm:max-inline-3xl">
                <DialogHeader className="border-be border-border-warm px-5 py-4 text-start">
                    <DialogTitle>Filter open slots</DialogTitle>
                    <DialogDescription>
                        Pick a buyer or owner to narrow the leads, then pick a lead to see its
                        property.
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
                        ownerOptions={ownerOptions}
                        leadOptions={leadOptions}
                        leadId={draftLeadId}
                        onLeadChange={setDraftLeadId}
                    />
                </div>
                <footer className="border-bs border-border-warm bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() => {
                            setDraftFilters(DEFAULT_SLOT_FILTERS);
                            setDraftBuyerId(undefined);
                            setDraftLeadId(undefined);
                        }}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            // One URL write: separate buyer / lead callbacks would
                            // each patch stale searchParams and undo each other.
                            replaceParams((params) => {
                                writeFilters(params, draftFilters);
                                if (draftBuyerId) params.set("buyer", draftBuyerId);
                                else params.delete("buyer");
                                if (draftLeadId) params.set("lead", draftLeadId);
                                else params.delete("lead");
                                params.delete("propertyId");
                            });
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
                        params.delete("lead");
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
                    kind={mode === "exclusive" ? "no-exclusive-slots" : "no-slots"}
                    onPrimary={() => setFilters(DEFAULT_SLOT_FILTERS)}
                    onSecondary={mode === "exclusive" ? undefined : () => onRequest()}
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
                            hideFull
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
                            hideFull
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
