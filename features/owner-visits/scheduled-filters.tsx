"use client";

import type { OwnerShowingFocus, OwnerShowingsSummary } from "@/lib/api/owner-slots";

import { FilterChip } from "@/components/shared/filter-chip";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const FILTERS: {
    key: OwnerShowingFocus;
    label: string;
    mobileLabel: string;
    field: keyof OwnerShowingsSummary;
    description: string;
    warning?: boolean;
}[] = [
    {
        key: "today",
        label: "Today",
        mobileLabel: "Today",
        field: "today",
        description: "Visits scheduled for today",
    },
    {
        key: "tomorrow",
        label: "Tomorrow",
        mobileLabel: "Tomorrow",
        field: "tomorrow",
        description: "Visits scheduled for tomorrow",
    },
    {
        key: "awaiting",
        label: "Needs your reply",
        mobileLabel: "Waiting",
        field: "awaitingOwner",
        description: "Bookings waiting for your confirmation",
        warning: true,
    },
    {
        key: "confirmed",
        label: "Confirmed",
        mobileLabel: "Confirmed",
        field: "confirmed",
        description: "Visits you have confirmed",
    },
    {
        key: "week",
        label: "This week",
        mobileLabel: "Week",
        field: "week",
        description: "All upcoming visits this week",
    },
    {
        key: "cancelled",
        label: "Cancelled",
        mobileLabel: "Cancelled",
        field: "cancelled",
        description: "Visits that were cancelled",
    },
];

export function OwnerScheduledFilters({
    summary,
    active,
    isLoading,
    onChange,
}: {
    summary: OwnerShowingsSummary;
    active?: OwnerShowingFocus;
    isLoading?: boolean;
    onChange: (next?: OwnerShowingFocus) => void;
}) {
    return (
        <TooltipProvider>
            <OwnerListingsChipsCarousel className="inline-full">
                {FILTERS.map((item) => {
                    const count = summary[item.field];
                    const selected = active === item.key;
                    const warning = Boolean(item.warning && count > 0 && !selected);
                    return (
                        <OwnerListingsChipsCarouselSlide key={item.key}>
                            <FilterChip
                                label={item.label}
                                mobileLabel={item.mobileLabel}
                                count={count}
                                isLoading={isLoading}
                                isActive={selected}
                                clearable
                                warning={warning}
                                onClick={() => onChange(selected ? undefined : item.key)}
                                description={item.description}
                            />
                        </OwnerListingsChipsCarouselSlide>
                    );
                })}
            </OwnerListingsChipsCarousel>
        </TooltipProvider>
    );
}
