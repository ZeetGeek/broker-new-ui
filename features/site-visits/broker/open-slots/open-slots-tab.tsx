"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

import { TIME_BUCKETS, VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { sortSlotsForBuyer } from "@/lib/visits/grouping";

import { AppModal } from "@/components/shared/app-modal";
import { VirtualStack } from "@/components/shared/virtual-stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { PersonSummary, PropertyWithSlots, VisitSlot } from "@/features/site-visits/broker/model";
import { BuyerMatchBar } from "@/features/site-visits/broker/open-slots/buyer-match-bar";
import { PropertyRow } from "@/features/site-visits/broker/open-slots/property-row";
import { DEFAULT_SLOT_FILTERS, SlotFilters, type SlotFilterState } from "@/features/site-visits/broker/open-slots/slot-filters";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

function activeCount(filters: SlotFilterState) {
    return filters.timeBuckets.length + filters.localities.length + Number(filters.range !== "week") + Number(Boolean(filters.purpose)) + Number(Boolean(filters.propertyType)) + Number(Boolean(filters.bhk)) + Number(Boolean(filters.budget)) + Number(Boolean(filters.owner)) + Number(!filters.onlyAccepted) + Number(!filters.hideFull);
}

function filterProperties(items: PropertyWithSlots[], filters: SlotFilterState, query: string) {
    return items.filter((item) => {
        if (filters.onlyAccepted && item.access !== "accepted") return false;
        if (filters.localities.length && !filters.localities.includes(item.property.locality)) return false;
        if (filters.purpose && item.property.purpose !== filters.purpose) return false;
        if (filters.propertyType && item.property.propertyType !== filters.propertyType) return false;
        if (filters.bhk && !item.property.configLabel.startsWith(filters.bhk)) return false;
        if (filters.budget && item.property.amountInr > Number(filters.budget)) return false;
        if (filters.owner && item.owner.id !== filters.owner) return false;
        if (query && !`${item.property.title} ${item.property.locality} ${item.owner.name}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (filters.timeBuckets.length) {
            const hasTime = item.slots.some((slot) => {
                const hour = Number(formatInTimeZone(slot.startsAt, VISITS_TIME_ZONE, "H"));
                return TIME_BUCKETS.some((bucket) => filters.timeBuckets.includes(bucket.id) && hour >= bucket.start && hour < bucket.end);
            });
            if (!hasTime) return false;
        }
        return true;
    });
}

export function OpenSlotsTab({
    items,
    buyers,
    buyerId,
    isLoading,
    isError,
    updatedAt,
    onBuyerChange,
    onBook,
    onOpenVisit,
    onRequest,
    onRefresh,
    rowErrors = {},
}: {
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
    const [filters, setFilters] = useState(DEFAULT_SLOT_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
        return () => window.clearTimeout(timer);
    }, [query]);
    const shown = useMemo(() => sortSlotsForBuyer(filterProperties(items, filters, debouncedQuery), buyerId), [buyerId, debouncedQuery, filters, items]);
    const count = activeCount(filters);

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
                        <div className="flex-1 min-inline-[220px]"><Input id="slot-search" value={query} onValueChange={(value) => setQuery(value)} placeholder="Search property, locality or owner" startIcon={Search} clearable /></div>
                        <Button variant="surface" size="md" onClick={() => setFiltersOpen(true)} className="
                          lg:hidden
                        "><SlidersHorizontal aria-hidden /> Filters ({count})</Button>
                        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Refresh slots"><RefreshCw aria-hidden /></Button>
                        <span className="body-xs text-ink-muted">Updated {formatDistanceToNowStrict(updatedAt, { addSuffix: true })}</span>
                    </div>

                    {count > 0 ? <div className="flex flex-wrap items-center gap-2"><span className="
                      body-xs font-semibold text-ink-muted
                    ">Active filters</span>{filters.onlyAccepted ? <button type="button" onClick={() => setFilters({ ...filters, onlyAccepted: false })} className="
                      body-xs flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1
                      font-semibold text-brand-text
                    ">Accepted only <X aria-hidden className="block-3 inline-3" /></button> : null}{filters.localities.map((locality) => <button key={locality} type="button" onClick={() => setFilters({ ...filters, localities: filters.localities.filter((item) => item !== locality) })} className="
                      body-xs flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1
                      font-semibold text-brand-text
                    ">{locality}<X aria-hidden className="block-3 inline-3" /></button>)}<button type="button" onClick={() => setFilters(DEFAULT_SLOT_FILTERS)} className="
                      body-xs ms-auto font-semibold text-brand-text
                      hover:underline
                    ">Clear all</button></div> : null}

                    {shown.length === 0 ? <EmptyState kind="no-slots" onPrimary={() => setFilters(DEFAULT_SLOT_FILTERS)} onSecondary={() => onRequest()} /> : shown.length > 40 ? <VirtualStack items={shown} estimateSize={292} getKey={(item) => item.property.id} renderItem={(item) => <PropertyRow item={item} buyerSelected={Boolean(buyerId)} hideFull={filters.hideFull} onBook={onBook} onOpenVisit={onOpenVisit} onRequest={() => onRequest(item.property.id)} inlineError={rowErrors[item.property.id]} />} /> : shown.map((item) => <PropertyRow key={item.property.id} item={item} buyerSelected={Boolean(buyerId)} hideFull={filters.hideFull} onBook={onBook} onOpenVisit={onOpenVisit} onRequest={() => onRequest(item.property.id)} inlineError={rowErrors[item.property.id]} />)}
                </div>
            </div>

            <AppModal open={filtersOpen} onOpenChange={setFiltersOpen} title="Filter open slots" description="Narrow properties and times without losing your buyer selection." footer={<><Button variant="surface" onClick={() => setFilters(DEFAULT_SLOT_FILTERS)}>Clear all</Button><Button onClick={() => setFiltersOpen(false)}>Show {shown.length} properties</Button></>}>
                <SlotFilters value={filters} onChange={setFilters} />
            </AppModal>
        </section>
    );
}
