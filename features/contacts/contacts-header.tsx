"use client";

import { useEffect, useState } from "react";

import { ArrowDownUp, ChevronDown, Plus, Search, UserRound, Users } from "lucide-react";

import { getShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { FilterChip, filterChipClassName } from "@/components/shared/filter-chip";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type {
    ContactsFilters,
    ContactsSort,
    ContactsSummary,
    ContactsTab,
} from "@/features/contacts/types";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const SORT_OPTIONS: { value: ContactsSort; label: string }[] = [
    { value: "recent", label: "Recent first" },
    { value: "name", label: "By name" },
    { value: "most_active", label: "Most active" },
];

function ContactsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
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
            placeholder="Search name, number or area"
            aria-label="Search your contacts"
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

export function ContactsHeader({
    filters,
    onFiltersChange,
    summary,
    isLoading = false,
    onAdd,
}: {
    filters: ContactsFilters;
    onFiltersChange: (next: ContactsFilters) => void;
    summary: ContactsSummary | null;
    isLoading?: boolean;
    onAdd: () => void;
}) {
    const isBuyers = filters.tab === "buyers";
    const addLabel = isBuyers ? "Add buyer" : "Add owner";
    const addShortcut = getShortcut("add_contact");

    const setTab = (tab: ContactsTab) => {
        onFiltersChange({ ...filters, tab });
    };

    return (
        <div className="sticky inset-bs-0 z-10">
            <TooltipProvider>
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <OwnerListingsChipsCarousel>
                        {(
                            [
                                {
                                    value: "buyers" as const,
                                    label: "Buyers",
                                    mobileLabel: "Buyers",
                                    icon: Users,
                                    count: summary?.buyerCount ?? 0,
                                    description: "People you’re helping find a property",
                                },
                                {
                                    value: "owners" as const,
                                    label: "Owners",
                                    mobileLabel: "Owners",
                                    icon: UserRound,
                                    count: summary?.ownerCount ?? 0,
                                    description: "Owners you represent or added yourself",
                                },
                            ] as const
                        ).map((chip) => {
                            const active = filters.tab === chip.value;
                            return (
                                <OwnerListingsChipsCarouselSlide key={chip.value}>
                                    <FilterChip
                                        label={chip.label}
                                        mobileLabel={chip.mobileLabel}
                                        icon={chip.icon}
                                        count={chip.count}
                                        isLoading={isLoading}
                                        isActive={active}
                                        onClick={() => setTab(chip.value)}
                                        description={chip.description}
                                    />
                                </OwnerListingsChipsCarouselSlide>
                            );
                        })}

                        {!isBuyers
                            ? (
                                  [
                                      {
                                          value: "all" as const,
                                          label: "All",
                                          count: summary?.ownerCount ?? 0,
                                      },
                                      {
                                          value: "platform" as const,
                                          label: "Platform",
                                          count: summary?.platformOwnerCount ?? 0,
                                      },
                                      {
                                          value: "custom" as const,
                                          label: "Added by you",
                                          count: summary?.customOwnerCount ?? 0,
                                      },
                                  ] as const
                              ).map((chip) => {
                                  const active = filters.ownerOrigin === chip.value;
                                  const isDefault = chip.value === "all";
                                  return (
                                      <OwnerListingsChipsCarouselSlide key={chip.value}>
                                          <FilterChip
                                              label={chip.label}
                                              count={chip.count}
                                              isLoading={isLoading}
                                              isActive={active}
                                              clearable={!isDefault}
                                              onClick={() =>
                                                  onFiltersChange({
                                                      ...filters,
                                                      ownerOrigin:
                                                          active && !isDefault ? "all" : chip.value,
                                                  })
                                              }
                                          />
                                      </OwnerListingsChipsCarouselSlide>
                                  );
                              })
                            : null}
                    </OwnerListingsChipsCarousel>

                    <div className="flex shrink-0 items-center gap-2.5">
                        <ContactsQueryInput
                            value={filters.q}
                            onChange={(q) => onFiltersChange({ ...filters, q })}
                        />

                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <DropdownMenuTrigger
                                            render={
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        filterChipClassName(
                                                            filters.sort !== "recent",
                                                        ),
                                                        "gap-2",
                                                        filters.sort === "recent" &&
                                                            "text-ink-muted",
                                                    )}
                                                />
                                            }
                                        >
                                            <ArrowDownUp
                                                aria-hidden
                                                className="text-brand block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                            <span className="hidden sm:inline">
                                                {SORT_OPTIONS.find(
                                                    (option) => option.value === filters.sort,
                                                )?.label ?? "Recent first"}
                                            </span>
                                            <span className="sm:hidden">Sort</span>
                                            <ChevronDown
                                                aria-hidden
                                                className="opacity-60 block-3.5 inline-3.5"
                                                strokeWidth={1.75}
                                            />
                                        </DropdownMenuTrigger>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    Change the order of the list.
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="min-inline-44">
                                {SORT_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() =>
                                            onFiltersChange({ ...filters, sort: option.value })
                                        }
                                        className={cn(
                                            filters.sort === option.value &&
                                                "font-semibold text-brand",
                                        )}
                                    >
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            onClick={onAdd}
                            aria-label={addLabel}
                            className="hidden gap-2 px-3.5 block-[38px]! md:inline-flex"
                        >
                            <Plus aria-hidden strokeWidth={1.75} />
                            {addLabel}
                            {addShortcut ? (
                                <KbdGroup className="gap-0.5">
                                    {addShortcut.displayKeys.map((key) => (
                                        <Kbd
                                            key={key}
                                            className="
                                              border-surface/25 bg-surface/15 px-1.5 text-[10px]
                                              text-surface min-inline-4
                                              [box-shadow:none]
                                            "
                                        >
                                            {key}
                                        </Kbd>
                                    ))}
                                </KbdGroup>
                            ) : null}
                        </Button>
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
