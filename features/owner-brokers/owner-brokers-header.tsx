"use client";

import Link from "next/link";

import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { filterChipClassName, FilterChipCount } from "@/components/shared/filter-chip";
import { UserRound, UserRoundSearch } from "@/components/shared/icons";
import { ListSearchField, ListToolbarSelect } from "@/components/shared/list-toolbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { OwnerBrokersTab } from "@/features/owner-brokers/types";
import type { OwnerRequestsSort } from "@/features/owner-requests/owner-requests-header";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const SORT_OPTIONS: { value: OwnerRequestsSort; label: string }[] = [
    { value: "recent", label: "Recent first" },
    { value: "oldest", label: "Oldest first" },
];

const TAB_CHIPS: {
    key: OwnerBrokersTab;
    label: string;
    mobileLabel: string;
    description: string;
    icon: typeof UserRoundSearch;
}[] = [
    {
        key: "browse",
        label: "Browse",
        mobileLabel: "Browse",
        description: "Find brokers and invite them to your listings",
        icon: UserRoundSearch,
    },
    {
        key: "active",
        label: "My Brokers",
        mobileLabel: "My Brokers",
        description: "Brokers currently representing your properties",
        icon: UserRound,
    },
];

export function OwnerBrokersHeader({
    activeTab,
    browseCount,
    activeCount,
    search,
    onSearchChange,
    sort,
    onSortChange,
    isLoading = false,
}: {
    activeTab: OwnerBrokersTab;
    browseCount: number | null;
    activeCount: number | null;
    search: string;
    onSearchChange: (q: string) => void;
    sort: OwnerRequestsSort;
    onSortChange: (sort: OwnerRequestsSort) => void;
    isLoading?: boolean;
}) {
    const searchPlaceholder =
        activeTab === "browse" ? "Search name, agency or area" : "Search name or property";

    return (
        <div className="sticky inset-bs-0 z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        {TAB_CHIPS.map((chip) => {
                            const active = activeTab === chip.key;
                            const Icon = chip.icon;
                            const count = chip.key === "browse" ? browseCount : activeCount;

                            return (
                                <OwnerListingsChipsCarouselSlide key={chip.key}>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Link
                                                    href={ownerBrokersHref(chip.key)}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        filterChipClassName(active),
                                                        "gap-2",
                                                    )}
                                                >
                                                    <Icon
                                                        aria-hidden
                                                        className={cn(
                                                            "block-4 inline-4",
                                                            active
                                                                ? "text-brand-text"
                                                                : "text-brand",
                                                        )}
                                                        strokeWidth={1.75}
                                                    />
                                                    <span className="md:hidden">
                                                        {chip.mobileLabel}
                                                    </span>
                                                    <span className="hidden md:inline">
                                                        {chip.label}
                                                    </span>
                                                    <FilterChipCount
                                                        count={count ?? 0}
                                                        isActive={active}
                                                        isLoading={isLoading && count == null}
                                                    />
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
                        {activeTab === "active" ? (
                            <ListToolbarSelect
                                label="Sort list"
                                value={sort}
                                options={SORT_OPTIONS}
                                defaultValue="recent"
                                mobileLabel="Sort"
                                onChange={onSortChange}
                            />
                        ) : null}
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
