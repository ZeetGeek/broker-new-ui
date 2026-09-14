"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { addDays, formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import { TIME_BUCKETS, VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { sortSlotsForBuyer } from "@/lib/visits/grouping";
import { istDateKey } from "@/lib/visits/time";

import { VirtualStack } from "@/components/shared/virtual-stack";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { PersonSummary, PropertyWithSlots, VisitSlot } from "@/features/site-visits/broker/model";
import { BuyerMatchBar } from "@/features/site-visits/broker/open-slots/buyer-match-bar";
import { PropertyRow } from "@/features/site-visits/broker/open-slots/property-row";
import { DEFAULT_SLOT_FILTERS, SlotFilters, type SlotFilterState } from "@/features/site-visits/broker/open-slots/slot-filters";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

const FILTER_KEYS = ["range", "from", "to", "time", "locality", "purpose", "type", "bhk", "minBudget", "maxBudget", "owner", "accepted", "full"];

function readFilters(params: URLSearchParams): SlotFilterState {
    const rangeValue = params.get("range");
    const range = rangeValue === "today" || rangeValue === "tomorrow" || rangeValue === "custom" ? rangeValue : "week";
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
    return 1 + filters.timeBuckets.length + filters.localities.length + Number(Boolean(filters.purpose)) + Number(Boolean(filters.propertyType)) + Number(Boolean(filters.bhk)) + Number(Boolean(filters.minBudget)) + Number(Boolean(filters.maxBudget)) + Number(Boolean(filters.owner)) + Number(filters.onlyAccepted) + Number(filters.hideFull);
}

function filterProperties(items: PropertyWithSlots[], filters: SlotFilterState, query: string) {
    const today = istDateKey(new Date());
    const tomorrow = istDateKey(addDays(new Date(), 1));
    const weekEnd = istDateKey(addDays(new Date(), 7));
    return items.flatMap((item) => {
        if (filters.onlyAccepted && item.access !== "accepted" && item.propertySource !== "own_listing") return [];
        if (filters.localities.length && !filters.localities.includes(item.property.locality)) return [];
        if (filters.purpose && item.property.purpose !== filters.purpose) return [];
        if (filters.propertyType && item.property.propertyType !== filters.propertyType) return [];
        if (filters.bhk && !item.property.configLabel.startsWith(filters.bhk)) return [];
        if (filters.minBudget && item.property.amountInr < Number(filters.minBudget)) return [];
        if (filters.maxBudget && item.property.amountInr > Number(filters.maxBudget)) return [];
        if (filters.owner && item.owner.id !== filters.owner) return [];
        if (query && !`${item.property.title} ${item.property.locality} ${item.owner.name}`.toLowerCase().includes(query.toLowerCase())) return [];
        const slots = item.slots.filter((slot) => {
            const day = istDateKey(slot.startsAt);
            if (filters.range === "today" && day !== today) return false;
            if (filters.range === "tomorrow" && day !== tomorrow) return false;
            if (filters.range === "week" && (day < today || day > weekEnd)) return false;
            if (filters.range === "custom" && filters.customFrom && day < filters.customFrom) return false;
            if (filters.range === "custom" && filters.customTo && day > filters.customTo) return false;
            if (filters.timeBuckets.length) {
                const hour = Number(formatInTimeZone(slot.startsAt, VISITS_TIME_ZONE, "H"));
                if (!TIME_BUCKETS.some((bucket) => filters.timeBuckets.includes(bucket.id) && hour >= bucket.start && hour < bucket.end)) return false;
            }
            return true;
        });
        if (item.slots.length > 0 && slots.length === 0) return [];
        return [{ ...item, slots }];
    });
}

export function OpenSlotsTab({ items, buyers, buyerId, isLoading, isError, updatedAt, onBuyerChange, onBook, onOpenVisit, onRequest, onRefresh, rowErrors = {} }: {
    items: PropertyWithSlots[];
    buyers: PersonSummary[];
    buyerId?: string;
    isLoading: boolean;
    isError: boolean;
    updatedAt: number;
    onBuyerChange: (id?: string) => void;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: (propertyId?: string) => void;
    onRefresh: () => void;
    rowErrors?: Record<string, string>;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
    const urlQuery = searchParams.get("q") ?? "";

    const replaceParams = useCallback((mutate: (params: URLSearchParams) => void) => {
        const next = new URLSearchParams(searchParams.toString());
        mutate(next);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);
    const setFilters = useCallback((nextFilters: SlotFilterState) => replaceParams((params) => writeFilters(params, nextFilters)), [replaceParams]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const nextQuery = query.trim();
            setDebouncedQuery(nextQuery);
            if (nextQuery === urlQuery) return;
            replaceParams((params) => nextQuery ? params.set("q", nextQuery) : params.delete("q"));
        }, 250);
        return () => window.clearTimeout(timer);
    }, [query, replaceParams, urlQuery]);

    const shown = useMemo(() => sortSlotsForBuyer(filterProperties(items, filters, debouncedQuery), buyerId), [buyerId, debouncedQuery, filters, items]);
    const count = activeCount(filters);
    const chips = [
        { key: "range", label: filters.range === "week" ? "This week" : filters.range === "custom" ? `${filters.customFrom || "Start"} to ${filters.customTo || "End"}` : filters.range[0].toUpperCase() + filters.range.slice(1), clear: () => setFilters({ ...filters, range: "week", customFrom: "", customTo: "" }) },
        ...filters.timeBuckets.map((value) => ({ key: `time-${value}`, label: TIME_BUCKETS.find((item) => item.id === value)?.label ?? value, clear: () => setFilters({ ...filters, timeBuckets: filters.timeBuckets.filter((item) => item !== value) }) })),
        ...filters.localities.map((value) => ({ key: `locality-${value}`, label: value, clear: () => setFilters({ ...filters, localities: filters.localities.filter((item) => item !== value) }) })),
        ...(filters.purpose ? [{ key: "purpose", label: filters.purpose === "sale" ? "Sale" : "Rent", clear: () => setFilters({ ...filters, purpose: "" }) }] : []),
        ...(filters.propertyType ? [{ key: "type", label: filters.propertyType, clear: () => setFilters({ ...filters, propertyType: "" }) }] : []),
        ...(filters.bhk ? [{ key: "bhk", label: `${filters.bhk} BHK`, clear: () => setFilters({ ...filters, bhk: "" }) }] : []),
        ...(filters.minBudget ? [{ key: "minBudget", label: `From ₹${Number(filters.minBudget).toLocaleString("en-IN")}`, clear: () => setFilters({ ...filters, minBudget: "" }) }] : []),
        ...(filters.maxBudget ? [{ key: "maxBudget", label: `Up to ₹${Number(filters.maxBudget).toLocaleString("en-IN")}`, clear: () => setFilters({ ...filters, maxBudget: "" }) }] : []),
        ...(filters.owner ? [{ key: "owner", label: "Selected owner", clear: () => setFilters({ ...filters, owner: "" }) }] : []),
        ...(filters.onlyAccepted ? [{ key: "accepted", label: "Accepted only", clear: () => setFilters({ ...filters, onlyAccepted: false }) }] : []),
        ...(filters.hideFull ? [{ key: "full", label: "Full slots hidden", clear: () => setFilters({ ...filters, hideFull: false }) }] : []),
    ];

    if (isLoading && items.length === 0) return <VisitsTabSkeleton kind="slots" />;
    if (isError) return <EmptyState kind="slots-error" onPrimary={onRefresh} />;

    return (
        <section className="space-y-4">
            <BuyerMatchBar buyers={buyers} value={buyerId} onChange={onBuyerChange} />
            <div className="grid gap-4 lg:grid-cols-[264px_minmax(0,1fr)]">
                <aside className="
                  hidden self-start rounded-card border border-border-warm bg-surface p-4
                  lg:sticky lg:inset-bs-4 lg:block
                "><SlotFilters value={filters} onChange={setFilters} /></aside>
                <div className="space-y-4 min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 min-inline-[220px]"><Input id="slot-search" value={query} onValueChange={setQuery} placeholder="Search property, locality or owner" startIcon={Search} clearable /></div>
                        <Button variant="surface" size="md" onClick={() => setFiltersOpen(true)} className="
                          lg:hidden
                        "><SlidersHorizontal aria-hidden /> Filters ({count})</Button>
                        <Button variant="ghost" size="md" onClick={onRefresh} aria-label="Refresh slots"><RefreshCw aria-hidden /></Button>
                        <span className="body-xs text-ink-muted">Updated {formatDistanceToNowStrict(updatedAt, { addSuffix: true })}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                        {chips.map((chip) => <button key={chip.key} type="button" onClick={chip.clear} className="
                          body-xs flex items-center gap-1 rounded-md bg-brand-soft px-2.5
                          font-semibold text-brand-text min-block-11
                          hover:bg-brand-soft-hover
                          focus-visible:ring-3 focus-visible:ring-brand/25
                        ">{chip.label}<X aria-hidden className="block-3 inline-3" /></button>)}
                        <button type="button" onClick={() => setFilters(DEFAULT_SLOT_FILTERS)} className="
                          body-xs ms-auto px-2 font-semibold text-brand-text min-block-11
                          hover:underline
                        ">Clear all</button>
                    </div>

                    {shown.length === 0 ? <EmptyState kind="no-slots" onPrimary={() => setFilters(DEFAULT_SLOT_FILTERS)} onSecondary={() => onRequest()} /> : shown.length > 40 ? <VirtualStack items={shown} estimateSize={292} getKey={(item) => item.property.id} renderItem={(item) => <PropertyRow item={item} buyerSelected={Boolean(buyerId)} hideFull={filters.hideFull} onBook={onBook} onOpenVisit={onOpenVisit} onRequest={() => onRequest(item.property.id)} inlineError={rowErrors[item.property.id]} />} /> : shown.map((item) => <PropertyRow key={item.property.id} item={item} buyerSelected={Boolean(buyerId)} hideFull={filters.hideFull} onBook={onBook} onOpenVisit={onOpenVisit} onRequest={() => onRequest(item.property.id)} inlineError={rowErrors[item.property.id]} />)}
                </div>
            </div>

            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogPopup className="
                  inset-s-0! inset-bs-auto! inset-be-0! flex translate-0! flex-col gap-0
                  overflow-hidden rounded-b-none p-0 inline-full max-block-[92dvh] max-inline-none
                  lg:hidden
                ">
                    <div className="mx-auto mbs-2 rounded-full bg-border-warm block-1 inline-12" aria-hidden />
                    <DialogHeader className="
                      border-be border-border-warm px-4 pbs-3 pbe-4 text-start
                    "><DialogTitle className="h4 font-bold text-ink">Filter open slots</DialogTitle><DialogDescription>Narrow properties and times without losing the selected buyer.</DialogDescription></DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4"><SlotFilters value={filters} onChange={setFilters} /></div>
                    <footer className="
                      sticky inset-be-0 flex gap-3 border-bs border-border-warm bg-surface p-4
                    "><Button variant="surface" size="lg" onClick={() => setFilters(DEFAULT_SLOT_FILTERS)} className="
                      flex-1
                    ">Clear all</Button><Button size="lg" onClick={() => setFiltersOpen(false)} className="
                      flex-1
                    ">Show {shown.length}</Button></footer>
                </DialogPopup>
            </Dialog>
        </section>
    );
}
