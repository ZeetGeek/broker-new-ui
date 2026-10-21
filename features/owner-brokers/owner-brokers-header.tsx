"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
    ArrowDownUp,
    ChevronDown,
    Search,
    UserRound,
    UserRoundSearch,
} from "@/components/shared/icons";

import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { FilterChipCount, filterChipClassName } from "@/components/shared/filter-chip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

function QueryInput({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (q: string) => void;
    placeholder: string;
}) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onValueChange={setDraft}
            placeholder={placeholder}
            aria-label={placeholder}
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

function SortMenu({
    sort,
    onSortChange,
}: {
    sort: OwnerRequestsSort;
    onSortChange: (sort: OwnerRequestsSort) => void;
}) {
    const isDefaultSort = sort === "recent";
    const label = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Recent first";

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <DropdownMenuTrigger
                            render={
                                <button
                                    type="button"
                                    className={cn(
                                        filterChipClassName(!isDefaultSort),
                                        "gap-2",
                                        isDefaultSort && "text-ink-muted",
                                    )}
                                />
                            }
                        >
                            <ArrowDownUp
                                aria-hidden
                                className="text-brand block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">Sort</span>
                            <ChevronDown
                                aria-hidden
                                className="opacity-60 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                        </DropdownMenuTrigger>
                    }
                />
                <TooltipContent side="bottom">Change the order of the list.</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-inline-44">
                {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(sort === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

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
                        <QueryInput
                            value={search}
                            onChange={onSearchChange}
                            placeholder={searchPlaceholder}
                        />
                        {activeTab === "active" ? (
                            <SortMenu sort={sort} onSortChange={onSortChange} />
                        ) : null}
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
