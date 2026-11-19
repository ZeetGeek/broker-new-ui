"use client";

import { FilterChip } from "@/components/shared/filter-chip";
import { Home, User } from "@/components/shared/icons";
import {
    ListAddButton,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
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
    onAdd?: () => void;
}) {
    const isBuyers = filters.tab === "buyers";
    const addLabel = isBuyers ? "Add client" : "Add owner";

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
                                    label: "Clients",
                                    mobileLabel: "Clients",
                                    icon: User,
                                    count:
                                        summary != null && summary.buyerCount > 0
                                            ? summary.buyerCount
                                            : undefined,
                                    description: "People you’re helping find a property",
                                },
                                {
                                    value: "owners" as const,
                                    label: "Owners",
                                    mobileLabel: "Owners",
                                    icon: Home,
                                    count:
                                        summary != null && summary.ownerCount > 0
                                            ? summary.ownerCount
                                            : undefined,
                                    description: FEATURE_PLATFORM_OWNER
                                        ? "Owners you represent or added yourself"
                                        : "Owners you added yourself",
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

                        {!isBuyers && FEATURE_PLATFORM_OWNER
                            ? (
                                  [
                                      {
                                          value: "all" as const,
                                          label: "All",
                                          count:
                                              summary != null && summary.ownerCount > 0
                                                  ? summary.ownerCount
                                                  : undefined,
                                      },
                                      {
                                          value: "platform" as const,
                                          label: "Platform",
                                          count:
                                              summary != null && summary.platformOwnerCount > 0
                                                  ? summary.platformOwnerCount
                                                  : undefined,
                                      },
                                      {
                                          value: "custom" as const,
                                          label: "Added by you",
                                          count:
                                              summary != null && summary.customOwnerCount > 0
                                                  ? summary.customOwnerCount
                                                  : undefined,
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
                        <ListSearchField
                            placeholder="Search name, number or area"
                            aria-label="Search your clients"
                            value={filters.q}
                            onChange={(q) => onFiltersChange({ ...filters, q })}
                        />

                        <ListToolbarSelect
                            label="Sort clients"
                            value={filters.sort}
                            options={SORT_OPTIONS}
                            defaultValue="recent"
                            mobileLabel="Sort"
                            tooltip="Change the order of the list."
                            onChange={(sort) => onFiltersChange({ ...filters, sort })}
                        />

                        {onAdd ? (
                            <ListAddButton
                                label={addLabel}
                                shortcutId="add_contact"
                                onClick={onAdd}
                                className="hidden md:inline-flex"
                            />
                        ) : null}
                    </div>
                </div>
            </TooltipProvider>
        </div>
    );
}
