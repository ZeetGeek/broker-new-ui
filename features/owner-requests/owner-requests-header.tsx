"use client";

import Link from "next/link";

import { ownerRequestsHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { filterChipClassName, FilterChipCount } from "@/components/shared/filter-chip";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { OwnerRequestsSummary, OwnerRequestsTab } from "@/features/owner-requests/types";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

export type OwnerRequestsSort = "recent" | "oldest";

const SORT_OPTIONS: { value: OwnerRequestsSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
];

const TAB_CHIPS: {
    key: OwnerRequestsTab;
    label: string;
    mobileLabel: string;
    description: string;
}[] = [
    {
        key: "requests",
        label: "Incoming Requests",
        mobileLabel: "Incoming Request",
        description: "Brokers waiting for you to say yes or no",
    },
    {
        key: "invitations",
        label: "Sent invites",
        mobileLabel: "Sent",
        description: "Invites you sent to brokers",
    },
    {
        key: "accepted",
        label: "Accepted",
        mobileLabel: "Accepted",
        description: "Brokers currently selling your listings",
    },
    {
        key: "rejected",
        label: "Rejected",
        mobileLabel: "Rejected",
        description: "Requests you turned down and invites brokers turned down",
    },
    {
        key: "cancelled",
        label: "Cancelled",
        mobileLabel: "Cancelled",
        description: "Representations you or the broker cancelled",
    },
];

function tabCount(summary: OwnerRequestsSummary | null, key: OwnerRequestsTab): number {
    if (!summary) return 0;
    switch (key) {
        case "requests":
            return summary.incomingPending;
        case "invitations":
            return summary.invitesPending;
        case "accepted":
            return summary.accepted;
        case "rejected":
            return summary.rejected;
        case "cancelled":
            return summary.cancelled;
    }
}

export function OwnerRequestsHeader({
    activeTab,
    summary,
    search,
    onSearchChange,
    sort,
    onSortChange,
    isLoading = false,
}: {
    activeTab: OwnerRequestsTab;
    summary: OwnerRequestsSummary | null;
    search: string;
    onSearchChange: (q: string) => void;
    sort: OwnerRequestsSort;
    onSortChange: (sort: OwnerRequestsSort) => void;
    isLoading?: boolean;
}) {
    const searchPlaceholder = "Search requests";

    return (
        <div className="relative z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        {TAB_CHIPS.map((chip) => {
                            const active = activeTab === chip.key;
                            const count = tabCount(summary, chip.key);

                            return (
                                <OwnerListingsChipsCarouselSlide key={chip.key}>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Link
                                                    href={ownerRequestsHref(chip.key)}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        filterChipClassName(active),
                                                        "gap-2",
                                                    )}
                                                >
                                                    <span className="md:hidden">
                                                        {chip.mobileLabel}
                                                    </span>
                                                    <span className="hidden md:inline">
                                                        {chip.label}
                                                    </span>
                                                    <FilterChipCount
                                                        count={count}
                                                        isActive={active}
                                                        isLoading={isLoading && !summary}
                                                    />
                                                    {chip.key === "requests" &&
                                                    (summary?.incomingPending ?? 0) > 0 ? (
                                                        <span
                                                            aria-label={`${summary?.incomingPending} waiting for you`}
                                                            className="
                                                              body-xs flex items-center
                                                              justify-center rounded-md bg-urgent
                                                              px-1 font-semibold text-surface
                                                              block-5 min-inline-5
                                                            "
                                                        >
                                                            {summary?.incomingPending}
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            }
                                        />
                                        <TooltipContent side="bottom">
                                            {chip.description}
                                        </TooltipContent>
                                    </Tooltip>
                                </OwnerListingsChipsCarouselSlide>
                            );
                        })}
                    </OwnerListingsChipsCarousel>

                    <div className="flex shrink-0 items-center gap-2.5">
                        <ListSearchField
                            value={search}
                            onChange={onSearchChange}
                            placeholder={searchPlaceholder}
                        />
                        <ListToolbarSelect
                            label="Sort list"
                            value={sort}
                            options={SORT_OPTIONS}
                            defaultValue="recent"
                            mobileLabel="Sort"
                            onChange={onSortChange}
                        />
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
