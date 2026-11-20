"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
    EMPTY_PROPERTY_CRITERIA,
    normalizePropertyCriteria,
    propertyCriteriaCount,
    type PropertyListCriteria,
} from "@/lib/properties/list-criteria";
import { BROKER_MY_DEALS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { FilterChip, FilterChipCount } from "@/components/shared/filter-chip";
import { SlidersHorizontal } from "@/components/shared/icons";
import {
    LIST_SEARCH_WIDTH_CLASS,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type {
    InvitesFilters,
    InviteSort,
    InvitesSummary,
} from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type {
    DealListingType,
    RequestsFilters,
    RequestSort,
    RequestsSummary,
} from "@/features/properties/my-requests/types";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";
import { OwnerListingsFilterSheet } from "@/features/properties/owner-listings/owner-listings-filter-sheet";
import {
    DEFAULT_OWNER_LISTINGS_FILTERS,
    type OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

const SENT_SORT_OPTIONS: { value: RequestSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "waiting_longest", label: "Waiting longest" },
    { value: "price_desc", label: "Price high" },
    { value: "price_asc", label: "Price low" },
];

export const DEALS_TOOLBAR_CLASS = "flex flex-wrap items-center justify-between gap-3 sm:gap-4";
export const DEALS_SEARCH_CLASS = cn(LIST_SEARCH_WIDTH_CLASS, "shadow-sm");
export const DEALS_SORT_CLASS = "justify-between inline-24 sm:inline-40";

const INVITE_SORT_OPTIONS: { value: InviteSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "price_desc", label: "Price high" },
    { value: "price_asc", label: "Price low" },
];

function countTypeFilter(type: DealListingType): number {
    return type ? 1 : 0;
}

function DealsSortMenu({
    sort,
    options,
    onSortChange,
}: {
    sort: string;
    options: { value: string; label: string }[];
    onSortChange: (sort: string) => void;
}) {
    return (
        <ListToolbarSelect
            label="Sort deals"
            value={sort}
            options={options}
            onChange={onSortChange}
            defaultValue="recent"
            mobileLabel="Sort"
            className={DEALS_SORT_CLASS}
        />
    );
}

function ownerSheetFilters(
    criteria: Partial<PropertyListCriteria> | undefined,
    type: DealListingType,
): OwnerListingsFilters {
    const value = normalizePropertyCriteria({ ...criteria, type });
    return {
        ...DEFAULT_OWNER_LISTINGS_FILTERS,
        type: value.type,
        min: value.min,
        max: value.max,
        minAreaSqft: value.minAreaSqft,
        maxAreaSqft: value.maxAreaSqft,
        category: value.category,
        propertyType: value.propertyType,
        bhk: value.bhk,
        bathrooms: value.bathrooms,
        balconies: value.balconies,
        parking: value.parking,
        floors: value.floors,
        facing: value.facing,
        propertyConditions: value.propertyConditions,
        propertyAges: value.propertyAges,
        suitableFor: value.suitableFor,
        furnishing: value.furnishing,
        listedWithinDays: value.listedWithinDays,
        minCommissionPercent: value.minCommissionPercent,
        maxCommissionPercent: value.maxCommissionPercent,
        minCommissionAmount: value.minCommissionAmount,
        maxCommissionAmount: value.maxCommissionAmount,
    };
}

function criteriaFromSheet(
    patch: Partial<OwnerListingsFilters>,
    discovery: PropertyListCriteria | undefined,
) {
    return normalizePropertyCriteria({
        ...discovery,
        type: patch.type ?? discovery?.type,
        min: patch.min ?? discovery?.min,
        max: patch.max ?? discovery?.max,
        minAreaSqft: patch.minAreaSqft ?? discovery?.minAreaSqft,
        maxAreaSqft: patch.maxAreaSqft ?? discovery?.maxAreaSqft,
        category: patch.category ?? discovery?.category,
        propertyType: patch.propertyType ?? discovery?.propertyType,
        bhk: patch.bhk,
        bathrooms: patch.bathrooms,
        balconies: patch.balconies,
        parking: patch.parking,
        floors: patch.floors,
        facing: patch.facing,
        propertyConditions: patch.propertyConditions,
        propertyAges: patch.propertyAges,
        suitableFor: patch.suitableFor,
        furnishing: patch.furnishing,
        listedWithinDays: patch.listedWithinDays,
        minCommissionPercent: patch.minCommissionPercent,
        maxCommissionPercent: patch.maxCommissionPercent,
        minCommissionAmount: patch.minCommissionAmount,
        maxCommissionAmount: patch.maxCommissionAmount,
    });
}

function SentFilterDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: RequestsFilters;
    onApply: (next: Partial<RequestsFilters>) => void;
}) {
    const appliedFilters = useMemo(
        () => ownerSheetFilters(filters.propertyFilters, filters.type),
        [filters.propertyFilters, filters.type],
    );
    const discoveryFilters = useMemo(
        () => ({ ...filters.propertyFilters, type: filters.type }),
        [filters.propertyFilters, filters.type],
    );

    return (
        <OwnerListingsFilterSheet
            open={open}
            onOpenChange={onOpenChange}
            appliedFilters={appliedFilters}
            discoveryFilters={discoveryFilters}
            showDiscoveryFilters
            onApply={(patch, discovery) => {
                const next = criteriaFromSheet(patch, discovery);
                onApply({ type: next.type, propertyFilters: { ...next, type: "" }, page: 1 });
            }}
        />
    );
}

function InviteFilterDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: InvitesFilters;
    onApply: (next: Partial<InvitesFilters>) => void;
}) {
    const appliedFilters = useMemo(
        () => ownerSheetFilters(filters.propertyFilters, filters.type),
        [filters.propertyFilters, filters.type],
    );
    const discoveryFilters = useMemo(
        () => ({ ...filters.propertyFilters, type: filters.type }),
        [filters.propertyFilters, filters.type],
    );

    return (
        <OwnerListingsFilterSheet
            open={open}
            onOpenChange={onOpenChange}
            appliedFilters={appliedFilters}
            discoveryFilters={discoveryFilters}
            showDiscoveryFilters
            onApply={(patch, discovery) => {
                const next = criteriaFromSheet(patch, discovery);
                onApply({ type: next.type, propertyFilters: { ...next, type: "" }, page: 1 });
            }}
        />
    );
}

export type MyDealsHeaderProps = {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    sentFilters: RequestsFilters;
    inviteFilters: InvitesFilters;
    onPatchSent: (patch: Partial<RequestsFilters>) => void;
    onPatchInvites: (patch: Partial<InvitesFilters>) => void;
    isLoading?: boolean;
};

export function MyDealsHeader({
    activeTab,
    sentSummary,
    inviteSummary,
    sentFilters,
    inviteFilters,
    onPatchSent,
    onPatchInvites,
    isLoading = false,
}: MyDealsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const isSent = activeTab === "sent";
    const isInvites = activeTab === "invites";
    const isAccepted = activeTab === "accepted";
    const isRejected = activeTab === "rejected";
    const isCancelled = activeTab === "cancelled";

    const sheetFilterCount = useMemo(() => {
        if (isInvites)
            return (
                countTypeFilter(inviteFilters.type) +
                propertyCriteriaCount(inviteFilters.propertyFilters)
            );
        return (
            countTypeFilter(sentFilters.type) + propertyCriteriaCount(sentFilters.propertyFilters)
        );
    }, [inviteFilters, isInvites, sentFilters]);

    const sentWaitingCount = sentSummary?.counts.pending ?? 0;
    const inviteWaitingCount = inviteSummary?.waitingOnYouCount ?? 0;
    const acceptedCount =
        (sentSummary?.counts.approved ?? 0) + (inviteSummary?.counts.accepted ?? 0);
    const rejectedCount =
        (sentSummary?.counts.declined ?? 0) + (inviteSummary?.counts.declined ?? 0);
    const cancelledCount = (sentSummary?.counts.ended ?? 0) + (inviteSummary?.counts.ended ?? 0);

    const clearType = () => {
        if (isInvites) {
            onPatchInvites({ type: "", propertyFilters: { ...EMPTY_PROPERTY_CRITERIA }, page: 1 });
        } else {
            onPatchSent({ type: "", propertyFilters: { ...EMPTY_PROPERTY_CRITERIA }, page: 1 });
        }
    };

    return (
        <>
            <div className="sticky inset-bs-0 z-10">
                <TooltipProvider>
                    <div className={DEALS_TOOLBAR_CLASS}>
                        <OwnerListingsChipsCarousel>
                            <OwnerListingsChipsCarouselSlide>
                                <FilterChip
                                    label="Filters"
                                    icon={SlidersHorizontal}
                                    count={sheetFilterCount || undefined}
                                    reserveCountSpace
                                    isLoading={isLoading}
                                    isActive={sheetFilterCount > 0}
                                    clearable={sheetFilterCount > 0}
                                    onClick={() => setSheetOpen(true)}
                                    onClear={clearType}
                                    description="Sale or rent"
                                />
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={BROKER_MY_DEALS_HREF}
                                                aria-current={isAccepted ? "page" : undefined}
                                                className={ownerListingsChipClassName(isAccepted)}
                                            >
                                                Representing
                                                <FilterChipCount
                                                    reserveSpace
                                                    count={acceptedCount}
                                                    isActive={isAccepted}
                                                    isLoading={
                                                        isLoading && !sentSummary && !inviteSummary
                                                    }
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Properties you can sell for the owner
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=sent`}
                                                aria-current={isSent ? "page" : undefined}
                                                className={ownerListingsChipClassName(isSent)}
                                            >
                                                <span className="md:hidden">Sent</span>
                                                <span className="hidden md:inline">
                                                    Sent by you
                                                </span>
                                                <FilterChipCount
                                                    reserveSpace
                                                    count={sentWaitingCount}
                                                    isActive={isSent}
                                                    isLoading={isLoading && !sentSummary}
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Requests you sent that are still waiting
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=invites`}
                                                aria-current={isInvites ? "page" : undefined}
                                                className={cn(
                                                    ownerListingsChipClassName(isInvites),
                                                    "gap-2",
                                                )}
                                            >
                                                <span className="md:hidden">Invites</span>
                                                <span className="hidden md:inline">
                                                    Owner invitations
                                                </span>
                                                <FilterChipCount
                                                    reserveSpace
                                                    count={inviteWaitingCount}
                                                    isActive={isInvites}
                                                    isLoading={isLoading && !inviteSummary}
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Owner invites waiting for your answer
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=rejected`}
                                                aria-current={isRejected ? "page" : undefined}
                                                className={ownerListingsChipClassName(isRejected)}
                                            >
                                                Rejected
                                                <FilterChipCount
                                                    reserveSpace
                                                    count={rejectedCount}
                                                    isActive={isRejected}
                                                    isLoading={
                                                        isLoading && !sentSummary && !inviteSummary
                                                    }
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Owner rejections and invites you turned down
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=cancelled`}
                                                aria-current={isCancelled ? "page" : undefined}
                                                className={ownerListingsChipClassName(isCancelled)}
                                            >
                                                Cancelled
                                                <FilterChipCount
                                                    count={cancelledCount}
                                                    isActive={isCancelled}
                                                    isLoading={
                                                        isLoading && !sentSummary && !inviteSummary
                                                    }
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Representations you or the owner cancelled
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>
                        </OwnerListingsChipsCarousel>

                        <div className="flex shrink-0 items-center gap-2.5 max-inline-full">
                            {isInvites ? (
                                <ListSearchField
                                    placeholder="Search requests and invitations"
                                    aria-label="Search requests and invitations"
                                    wrapperClassName={DEALS_SEARCH_CLASS}
                                    value={inviteFilters.q}
                                    onChange={(q) => onPatchInvites({ q })}
                                />
                            ) : (
                                <ListSearchField
                                    placeholder="Search requests and invitations"
                                    aria-label="Search requests and invitations"
                                    wrapperClassName={DEALS_SEARCH_CLASS}
                                    value={sentFilters.q}
                                    onChange={(q) => onPatchSent({ q })}
                                />
                            )}
                            {isInvites ? (
                                <DealsSortMenu
                                    sort={inviteFilters.sort}
                                    options={INVITE_SORT_OPTIONS}
                                    onSortChange={(sort) =>
                                        onPatchInvites({ sort: sort as InviteSort })
                                    }
                                />
                            ) : (
                                <DealsSortMenu
                                    sort={sentFilters.sort}
                                    options={SENT_SORT_OPTIONS}
                                    onSortChange={(sort) =>
                                        onPatchSent({ sort: sort as RequestSort })
                                    }
                                />
                            )}
                        </div>
                    </div>
                </TooltipProvider>
            </div>

            {isInvites ? (
                <InviteFilterDialog
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={inviteFilters}
                    onApply={onPatchInvites}
                />
            ) : (
                <SentFilterDialog
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={sentFilters}
                    onApply={onPatchSent}
                />
            )}
        </>
    );
}
