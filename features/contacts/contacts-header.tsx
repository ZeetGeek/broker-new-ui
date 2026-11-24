"use client";

import { CRM_SEARCH_HELP } from "@/lib/search/search-help";

import { FilterChip } from "@/components/shared/filter-chip";
import { Home, User } from "@/components/shared/icons";
import {
    ListAddButton,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import { PEOPLE_ROLE_DOT_CLASS } from "@/components/shared/people-role-dot";
import {
    ResponsiveListStatus,
    ResponsiveListToolbar,
} from "@/components/shared/responsive-list-toolbar";
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
        <div className="sticky inset-bs-0 z-10 bg-canvas">
            <TooltipProvider>
                <ResponsiveListToolbar
                    selection={
                        <ResponsiveListStatus
                            label="Contacts"
                            value={filters.tab}
                            options={[
                                {
                                    value: "buyers",
                                    label: "Clients",
                                    count: summary?.buyerCount,
                                    dotClassName: PEOPLE_ROLE_DOT_CLASS.client,
                                },
                                {
                                    value: "owners",
                                    label: "Owners",
                                    count: summary?.ownerCount,
                                    dotClassName: PEOPLE_ROLE_DOT_CLASS.owner,
                                },
                            ]}
                            isLoading={isLoading}
                            onChange={(value) => {
                                if (value === "buyers" || value === "owners") setTab(value);
                            }}
                        >
                            <FilterChip
                                label="Clients"
                                icon={User}
                                count={summary?.buyerCount}
                                isLoading={isLoading}
                                isActive={isBuyers}
                                onClick={() => setTab("buyers")}
                                description="People you’re helping find a property"
                            />
                            <FilterChip
                                label="Owners"
                                icon={Home}
                                count={summary?.ownerCount}
                                isLoading={isLoading}
                                isActive={!isBuyers}
                                onClick={() => setTab("owners")}
                                description={
                                    FEATURE_PLATFORM_OWNER
                                        ? "Owners you represent or added yourself"
                                        : "Owners you added yourself"
                                }
                            />
                        </ResponsiveListStatus>
                    }
                    search={
                        <ListSearchField
                            fullWidth
                            searchHelp={isBuyers ? CRM_SEARCH_HELP.clients : CRM_SEARCH_HELP.owners}
                            aria-label={isBuyers ? "Search clients" : "Search owners"}
                            value={filters.q}
                            onChange={(q) => onFiltersChange({ ...filters, q })}
                        />
                    }
                    actions={
                        <>
                            <ListToolbarSelect
                                label={isBuyers ? "Sort clients" : "Sort owners"}
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
                                    shortcutId={isBuyers ? "add_contact" : "add_owner"}
                                    onClick={onAdd}
                                    className="hidden md:inline-flex"
                                />
                            ) : null}
                        </>
                    }
                >
                    {!isBuyers && FEATURE_PLATFORM_OWNER ? (
                        <div className="mbs-3">
                            <OwnerListingsChipsCarousel>
                                {(
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
                                                            active && !isDefault
                                                                ? "all"
                                                                : chip.value,
                                                    })
                                                }
                                            />
                                        </OwnerListingsChipsCarouselSlide>
                                    );
                                })}
                            </OwnerListingsChipsCarousel>
                        </div>
                    ) : null}
                </ResponsiveListToolbar>
            </TooltipProvider>
        </div>
    );
}
