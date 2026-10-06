"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ArrowDownUp, ChevronDown, Search } from "lucide-react";

import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

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
import type { OwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsViewToggle } from "@/features/properties/owner-listings/owner-listings-view-toggle";

const SORT_OPTIONS: { value: OwnerRequestsSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
];

const TAB_CHIPS: {
    key: OwnerBrokersTab;
    label: string;
    mobileLabel: string;
    description: string;
}[] = [
    {
        key: "browse",
        label: "Browse Brokers",
        mobileLabel: "Browse Brokers",
        description: "Find brokers and invite them to your listings",
    },
    {
        key: "active",
        label: "My Brokers / Active",
        mobileLabel: "My Brokers",
        description: "Brokers currently representing your properties",
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
            onChange={(event) => setDraft(event.target.value)}
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
    const label = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest first";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            ownerListingsChipClassName(!isDefaultSort),
                            "gap-2",
                            isDefaultSort && "text-ink-muted",
                        )}
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
                    </button>
                }
            />
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
    activeCount,
    search,
    onSearchChange,
    sort,
    onSortChange,
    view,
    onViewChange,
    isLoading = false,
}: {
    activeTab: OwnerBrokersTab;
    activeCount: number | null;
    search: string;
    onSearchChange: (q: string) => void;
    sort: OwnerRequestsSort;
    onSortChange: (sort: OwnerRequestsSort) => void;
    view: OwnerRequestsView;
    onViewChange: (view: OwnerRequestsView) => void;
    isLoading?: boolean;
}) {
    const searchPlaceholder = activeTab === "browse" ? "Search brokers" : "Search active brokers";

    return (
        <div className="sticky inset-bs-0 z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        {TAB_CHIPS.map((chip) => {
                            const active = activeTab === chip.key;

                            return (
                                <OwnerListingsChipsCarouselSlide key={chip.key}>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Link
                                                    href={ownerBrokersHref(chip.key)}
                                                    aria-current={active ? "page" : undefined}
                                                    className={cn(
                                                        ownerListingsChipClassName(active),
                                                        "gap-2",
                                                    )}
                                                >
                                                    <span className="md:hidden">
                                                        {chip.mobileLabel}
                                                    </span>
                                                    <span className="hidden md:inline">
                                                        {chip.label}
                                                    </span>
                                                    {chip.key === "active" ? (
                                                        <span
                                                            className={ownerListingsChipCountClassName(
                                                                active,
                                                            )}
                                                        >
                                                            {formatChipCount(
                                                                activeCount ?? 0,
                                                                isLoading && activeCount == null,
                                                            )}
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
                        <QueryInput
                            value={search}
                            onChange={onSearchChange}
                            placeholder={searchPlaceholder}
                        />
                        {activeTab === "active" ? (
                            <>
                                <OwnerListingsViewToggle view={view} onViewChange={onViewChange} />
                                <SortMenu sort={sort} onSortChange={onSortChange} />
                            </>
                        ) : null}
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
