"use client";

import { useMemo } from "react";

import { useSelfDestructBanner } from "@/lib/onboarding/use-self-destruct-banner";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { Skeleton } from "@/components/shared/skeleton";

import {
    buildOwnerListingsSummaryLines,
    OWNER_LISTINGS_APPROVAL_MESSAGE,
    type OwnerListingsPoolSummary,
} from "@/features/properties/owner-listings/build-owner-listings-summary-lines";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";
import { DEFAULT_OWNER_LISTINGS_FILTERS } from "@/features/properties/owner-listings/types";
import { useAppSelector } from "@/store/hooks";

const INTRO_TITLE = "Find your next deal";

const EMPTY_POOL_SUMMARY: OwnerListingsPoolSummary = {
    slotsOpenCount: 0,
    newTodayCount: 0,
    commissionSetCount: 0,
    readyToMoveCount: 0,
};

export type OwnerListingsIntroProps = {
    userId: string | undefined;
    hasApprovedRepresentation: boolean;
    newThisWeekCount: number;
    serviceAreas: string[];
    totalCount: number;
    poolSummary?: OwnerListingsPoolSummary;
    filters: OwnerListingsFilters;
    hasActiveFilters: boolean;
    isLoading?: boolean;
    hasError?: boolean;
    hasMoreResults?: boolean;
};

function OwnerListingsBrowseSummary({
    totalCount,
    newThisWeekCount,
    serviceAreas,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading,
    hasError,
    hasMoreResults,
}: Pick<
    OwnerListingsIntroProps,
    | "totalCount"
    | "newThisWeekCount"
    | "serviceAreas"
    | "poolSummary"
    | "filters"
    | "hasActiveFilters"
    | "isLoading"
    | "hasError"
    | "hasMoreResults"
>) {
    const lines = useMemo(
        () =>
            buildOwnerListingsSummaryLines({
                totalCount,
                newThisWeekCount,
                serviceAreas,
                filters,
                poolSummary: poolSummary ?? EMPTY_POOL_SUMMARY,
                isLoading: isLoading ?? false,
                hasActiveFilters,
                hasMoreResults,
            }),
        [
            totalCount,
            newThisWeekCount,
            serviceAreas,
            poolSummary,
            filters,
            hasActiveFilters,
            isLoading,
            hasMoreResults,
        ],
    );

    return (
        <RotatingHeaderSummary
            lines={lines}
            isLoading={isLoading}
            loadingLabel="Loading property count"
            loadingPlaceholder={OWNER_LISTINGS_APPROVAL_MESSAGE}
            errorMessage={hasError ? "Could not load properties. Please try again." : undefined}
        />
    );
}

/** Same heading and message slot as the loaded header, with no data-dependent copy. */
export function OwnerListingsIntroSkeleton() {
    const userId = useAppSelector((state) => state.dashboard.profile?.id ?? state.auth.user?.id);
    const hasApprovedRepresentation = useAppSelector(
        (state) => (state.dashboard.data?.youRepresent?.totalCount ?? 0) > 0,
    );
    return (
        <OwnerListingsIntro
            userId={userId}
            hasApprovedRepresentation={hasApprovedRepresentation}
            totalCount={0}
            newThisWeekCount={0}
            serviceAreas={[]}
            filters={DEFAULT_OWNER_LISTINGS_FILTERS}
            hasActiveFilters={false}
            isLoading
        />
    );
}

type BrowseHeaderProps = Pick<
    OwnerListingsIntroProps,
    | "totalCount"
    | "newThisWeekCount"
    | "serviceAreas"
    | "poolSummary"
    | "filters"
    | "hasActiveFilters"
    | "isLoading"
    | "hasError"
    | "hasMoreResults"
> & {
    title: string;
    titleClassName: string;
};

function BrowseHeader({
    title,
    titleClassName,
    totalCount,
    newThisWeekCount,
    serviceAreas,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading,
    hasError,
    hasMoreResults,
}: BrowseHeaderProps) {
    return (
        <h1 className={`${titleClassName} text-start min-inline-0`}>
            {isLoading ? (
                <span className="relative inline-block align-bottom" aria-hidden>
                    <span className="invisible">{title}.</span>
                    <span
                        aria-hidden
                        className="
                          absolute inset-s-0 inset-bs-[0.12em] overflow-hidden rounded-control
                          bg-border-warm block-[0.8em] inline-full
                        "
                    >
                        <Skeleton className="bg-ink/3 block-full inline-full" />
                    </span>
                </span>
            ) : (
                <span className="text-ink">{title}.</span>
            )}{" "}
            <OwnerListingsBrowseSummary
                totalCount={totalCount}
                newThisWeekCount={newThisWeekCount}
                serviceAreas={serviceAreas}
                poolSummary={poolSummary}
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                isLoading={isLoading}
                hasError={hasError}
                hasMoreResults={hasMoreResults}
            />
        </h1>
    );
}

export function OwnerListingsIntro({
    userId,
    hasApprovedRepresentation,
    newThisWeekCount,
    serviceAreas,
    totalCount,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading = false,
    hasError = false,
    hasMoreResults = false,
}: OwnerListingsIntroProps) {
    const isExpanded = useSelfDestructBanner({
        bannerKey: "owner_listings_intro",
        userId,
        milestoneReached: hasApprovedRepresentation,
    });

    const headerProps = {
        totalCount,
        newThisWeekCount,
        serviceAreas,
        poolSummary,
        filters,
        hasActiveFilters,
        isLoading,
        hasError,
        hasMoreResults,
    };

    if (isExpanded) {
        return (
            <div className="flex flex-col gap-3 text-start">
                <BrowseHeader title={INTRO_TITLE} titleClassName="h3" {...headerProps} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 text-start">
            <BrowseHeader title={INTRO_TITLE} titleClassName="h3" {...headerProps} />
        </div>
    );
}
