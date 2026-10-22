"use client";

import { SlidersHorizontal } from "@/components/shared/icons";

import { FilterChip, FilterChipCount, filterChipClassName } from "@/components/shared/filter-chip";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import type { BrokerVisitsTab } from "@/features/site-visits/broker/model";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";
import { VisitsRangeMenu } from "@/features/site-visits/broker/visits-range-menu";

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
    onClearFilters,
    rangeToolbar,
}: {
    value: BrokerVisitsTab;
    counts: Record<BrokerVisitsTab, number>;
    filtersCount?: number;
    onChange: (tab: BrokerVisitsTab) => void;
    onFilters: () => void;
    onClearFilters?: () => void;
    rangeToolbar?: {
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
        searchId?: string;
        searchPlaceholder?: string;
        searchAriaLabel?: string;
        customDescription?: string;
    };
}) {
    const filtersActive = filtersCount > 0;

    return (
        <div className="sticky inset-bs-0 z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        <OwnerListingsChipsCarouselSlide>
                            <FilterChip
                                label="Filters"
                                icon={SlidersHorizontal}
                                count={filtersCount}
                                isActive={filtersActive}
                                clearable={filtersActive && Boolean(onClearFilters)}
                                onClick={onFilters}
                                onClear={onClearFilters}
                                description="Filter the current visits section"
                            />
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
                                        className={filterChipClassName(active)}
                                    >
                                        <span className="md:hidden">{tab.mobileLabel}</span>
                                        <span className="hidden md:inline">{tab.label}</span>
                                        <FilterChipCount
                                            count={counts[tab.value]}
                                            isActive={active}
                                        />
                                    </button>
                                </OwnerListingsChipsCarouselSlide>
                            );
                        })}
                    </OwnerListingsChipsCarousel>

                    {rangeToolbar ? <VisitsRangeMenu {...rangeToolbar} /> : null}
                </div>
            </TooltipProvider>
        </div>
    );
}
