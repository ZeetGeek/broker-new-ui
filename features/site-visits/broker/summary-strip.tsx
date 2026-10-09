"use client";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { BrokerVisitSummary, SummaryFilter } from "@/features/site-visits/broker/model";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const SUMMARY_ITEMS: {
    key: SummaryFilter;
    label: string;
    mobileLabel: string;
    field: keyof BrokerVisitSummary;
    description: string;
    warning?: boolean;
}[] = [
    { key: "today", label: "Today", mobileLabel: "Today", field: "today", description: "Visits scheduled for today" },
    { key: "tomorrow", label: "Tomorrow", mobileLabel: "Tomorrow", field: "tomorrow", description: "Visits scheduled for tomorrow" },
    { key: "awaiting", label: "Waiting for owner", mobileLabel: "Waiting", field: "awaitingOwner", description: "Bookings waiting for owner confirmation", warning: true },
    { key: "feedback", label: "Needs outcome", mobileLabel: "Outcome", field: "needsOutcome", description: "Finished visits that still need an outcome", warning: true },
    { key: "week", label: "This week", mobileLabel: "Week", field: "weekTotal", description: "All upcoming visits this week" },
    { key: "cancelled", label: "Cancelled", mobileLabel: "Cancelled", field: "cancelledThisWeek", description: "Visits cancelled this week" },
];

export function SummaryStrip({
    summary,
    active,
    onChange,
}: {
    summary: BrokerVisitSummary;
    active?: SummaryFilter;
    onChange: (next?: SummaryFilter) => void;
}) {
    return (
        <TooltipProvider>
            <OwnerListingsChipsCarousel className="inline-full">
                {SUMMARY_ITEMS.map((item) => {
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
                                                warning && "border-pending/20 bg-urgent-soft/70 text-pending shadow-none",
                                            )}
                                        >
                                            <span className="md:hidden">{item.mobileLabel}</span>
                                            <span className="hidden md:inline">{item.label}</span>
                                            <span className={cn(ownerListingsChipCountClassName(selected), warning && "text-pending")}>
                                                {formatChipCount(count)}
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
