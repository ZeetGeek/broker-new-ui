"use client";

import type { OwnerShowingFocus, OwnerShowingsSummary } from "@/lib/api/owner-slots";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
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
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => onChange(selected ? undefined : item.key)}
                                            className={cn(
                                                ownerListingsChipClassName(selected),
                                                warning &&
                                                    "border-pending/20 bg-urgent-soft/70 text-pending shadow-none",
                                            )}
                                        >
                                            <span className="md:hidden">{item.mobileLabel}</span>
                                            <span className="hidden md:inline">{item.label}</span>
                                            <span
                                                className={cn(
                                                    ownerListingsChipCountClassName(selected),
                                                    warning && "text-pending",
                                                )}
                                            >
                                                {formatChipCount(count, isLoading)}
                                            </span>
                                        </button>
                                    }
                                />
                                <TooltipContent side="bottom">{item.description}</TooltipContent>
                            </Tooltip>
                        </OwnerListingsChipsCarouselSlide>
                    );
                })}
            </OwnerListingsChipsCarousel>
        </TooltipProvider>
    );
}
