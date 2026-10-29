"use client";

import { FilterChip, filterChipClassName, FilterChipCount } from "@/components/shared/filter-chip";
import { SlidersHorizontal } from "@/components/shared/icons";
import { TooltipProvider } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import type { BrokerVisitsTab } from "@/features/site-visits/broker/model";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";
import { VisitsRangeMenu } from "@/features/site-visits/broker/visits-range-menu";

export type VisitInventory = "platform" | "exclusive";

const PLATFORM_TABS = [
    { value: "slots", label: "Open slots", mobileLabel: "Slots" },
    { value: "visits", label: "My visits", mobileLabel: "Visits" },
    { value: "requests", label: "Requests", mobileLabel: "Requests" },
] as const;

const EXCLUSIVE_TABS = [
    { value: "slots", label: "Book slots", mobileLabel: "Book" },
    { value: "visits", label: "My visits", mobileLabel: "Visits" },
] as const;

const INVENTORY = [
    { value: "platform", label: "Owner listings" },
    { value: "exclusive", label: "Exclusive listings" },
] as const;

export function VisitsTabs({
    inventory,
    onInventoryChange,
    value,
    counts,
    filtersCount = 0,
    onChange,
    onFilters,
    onClearFilters,
    rangeToolbar,
}: {
    inventory: VisitInventory;
    onInventoryChange: (next: VisitInventory) => void;
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
    const tabs = inventory === "exclusive" ? EXCLUSIVE_TABS : PLATFORM_TABS;

    return (
        <div className="sticky inset-bs-0 z-10 flex flex-col gap-3">
            {FEATURE_PLATFORM_OWNER ? (
                <div
                    className="flex flex-wrap items-center gap-2"
                    role="tablist"
                    aria-label="Listing source"
                >
                    {INVENTORY.map((item) => {
                        const active = inventory === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => onInventoryChange(item.value)}
                                className={filterChipClassName(active)}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            ) : null}
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

                        {tabs.map((tab) => {
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
