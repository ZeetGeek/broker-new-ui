"use client";

import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { BrokerVisitsTab } from "@/features/site-visits/broker/model";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";
import { VisitsRangeMenu } from "@/features/site-visits/broker/visits-range-menu";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const TABS = [
    { value: "slots", label: "Open slots", mobileLabel: "Slots" },
    { value: "visits", label: "My visits", mobileLabel: "Visits" },
    { value: "requests", label: "Requests", mobileLabel: "Requests" },
] as const;

export function VisitsTabs({
    value,
    counts,
    filtersCount = 0,
    onChange,
    onFilters,
    slotToolbar,
}: {
    value: BrokerVisitsTab;
    counts: Record<BrokerVisitsTab, number>;
    filtersCount?: number;
    onChange: (tab: BrokerVisitsTab) => void;
    onFilters: () => void;
    slotToolbar?: {
        query: string;
        onQueryChange: (next: string) => void;
        range: SlotDateRange;
        customFrom: string;
        customTo: string;
        onRangeChange: (next: {
            range: SlotDateRange;
            customFrom?: string;
            customTo?: string;
        }) => void;
    };
}) {
    const filtersActive = filtersCount > 0;

    return (
        <div className="sticky inset-bs-0 z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        <OwnerListingsChipsCarouselSlide>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            className={cn(
                                                ownerListingsChipClassName(filtersActive),
                                                "gap-2",
                                            )}
                                            onClick={onFilters}
                                            aria-pressed={filtersActive}
                                        >
                                            <SlidersHorizontal
                                                aria-hidden
                                                className={cn(
                                                    "block-4 inline-4",
                                                    filtersActive
                                                        ? "text-brand-text"
                                                        : "text-brand",
                                                )}
                                                strokeWidth={1.75}
                                            />
                                            <span>Filters</span>
                                            {filtersActive ? (
                                                <span
                                                    className={ownerListingsChipCountClassName(
                                                        true,
                                                    )}
                                                >
                                                    {formatChipCount(filtersCount)}
                                                </span>
                                            ) : null}
                                        </button>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    Filter the current visits section
                                </TooltipContent>
                            </Tooltip>
                        </OwnerListingsChipsCarouselSlide>

                        {TABS.map((tab) => {
                            const active = value === tab.value;
                            return (
                                <OwnerListingsChipsCarouselSlide key={tab.value}>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => onChange(tab.value)}
                                        className={ownerListingsChipClassName(active)}
                                    >
                                        <span className="md:hidden">{tab.mobileLabel}</span>
                                        <span className="hidden md:inline">{tab.label}</span>
                                        <span className={ownerListingsChipCountClassName(active)}>
                                            {formatChipCount(counts[tab.value])}
                                        </span>
                                    </button>
                                </OwnerListingsChipsCarouselSlide>
                            );
                        })}
                    </OwnerListingsChipsCarousel>

                    {slotToolbar ? <VisitsRangeMenu {...slotToolbar} /> : null}
                </div>
            </TooltipProvider>
        </div>
    );
}
