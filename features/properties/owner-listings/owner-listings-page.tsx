"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { fetchOwnerListingCities, fetchOwnerListings } from "@/lib/api/owner-listings";
import { profileApi } from "@/lib/api/profile";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { Button } from "@/components/ui/button";

import { FEATURE_RERA_VERIFICATION } from "@/config/index";
import { mapBrokerVerificationState } from "@/features/broker/map-profile-menu";
import { buildQuickChipCounts } from "@/features/properties/owner-listings/build-quick-chip-counts";
import { countNewListingsInServiceAreasThisWeek } from "@/features/properties/owner-listings/count-new-listings-this-week";
import { commissionRangeForType } from "@/features/properties/owner-listings/filter-owner-listings";
import {
    ownerListingsFilterVisibility,
    stripHiddenOwnerListingsFilters,
} from "@/features/properties/owner-listings/filter-visibility";
import { locationTreeToListings } from "@/features/properties/owner-listings/map-browse-listing";
import { OwnerListingsEmpty } from "@/features/properties/owner-listings/owner-listings-empty";
import { OwnerListingsGrid } from "@/features/properties/owner-listings/owner-listings-grid";
import { OwnerListingsHeader } from "@/features/properties/owner-listings/owner-listings-header";
import { OwnerListingsIntro } from "@/features/properties/owner-listings/owner-listings-intro";
import {
    OwnerListingsCardsSkeleton,
    OwnerListingsPageSkeleton,
} from "@/features/properties/owner-listings/owner-listings-skeleton";
import type {
    OwnerListingItem,
    OwnerListingsBandFilters,
    OwnerListingsFilters,
    OwnerListingSort,
} from "@/features/properties/owner-listings/types";
import { useOwnerListingsFilters } from "@/features/properties/owner-listings/use-owner-listings-filters";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/slices/dashboard-slice";

const EMPTY_AREAS: string[] = [];
const EMPTY_ITEMS: OwnerListingItem[] = [];

export function OwnerListingsPage() {
    const dispatch = useAppDispatch();
    const cachedProfile = useAppSelector((state) => state.dashboard.profile);
    const dashboardData = useAppSelector((state) => state.dashboard.data);
    const authUser = useAppSelector((state) => state.auth.user);
    const {
        filters,
        applyFilters,
        toggleQuickChip,
        clearFilters,
        hasActiveFilters,
        filterSignature,
        scopeReady,
    } = useOwnerListingsFilters();

    // Browsing only needs the profile, not the entire dashboard payload.
    const profileQuery = useQuery({
        queryKey: ["owner-listings-profile", authUser?.id],
        queryFn: ({ signal }) => profileApi.get(signal),
        enabled: !cachedProfile,
    });
    const profile = cachedProfile ?? profileQuery.data;
    useEffect(() => {
        if (!cachedProfile && profileQuery.data) dispatch(setProfile(profileQuery.data));
    }, [cachedProfile, dispatch, profileQuery.data]);

    const serviceAreas = profile?.broker?.serviceAreas ?? EMPTY_AREAS;
    const filterContext = useMemo(() => ({ serviceAreas }), [serviceAreas]);
    const blockedReason =
        serviceAreas.length === 0
            ? "no_service_areas"
            : FEATURE_RERA_VERIFICATION &&
                mapBrokerVerificationState(profile ?? null) === "PROFILE_INCOMPLETE"
              ? "profile_incomplete"
              : null;
    const enabled = Boolean(profile) && !blockedReason && scopeReady;
    const query = useInfiniteItems({
        queryKey: ["owner-listings", authUser?.id, filterSignature, serviceAreas.join("|")],
        enabled,
        queryFn: async ({ cursor, signal }) => {
            const page = await fetchOwnerListings(
                { ...filters, cursor: cursor ?? "", limit: 20 },
                filterContext,
                signal,
            );
            return { items: page.items, total: page.totalCount, nextCursor: page.nextCursor };
        },
    });
    const locations = useQuery({
        queryKey: ["owner-listing-cities", authUser?.id],
        queryFn: ({ signal }) => fetchOwnerListingCities(signal),
        enabled,
        staleTime: 5 * 60_000,
        select: (data) => ({
            listings: locationTreeToListings(data.items),
            serviceableCount: data.serviceableAreas?.listingCount,
        }),
    });
    const isInitialLoading = !scopeReady || query.isPending;
    const readyToMoveCountQuery = useQuery({
        queryKey: [
            "owner-listings-ready-count",
            authUser?.id,
            filterSignature,
            serviceAreas.join("|"),
        ],
        enabled:
            enabled &&
            !filters.readyToMove &&
            ownerListingsFilterVisibility(filters).showReadyToMove,
        queryFn: ({ signal }) =>
            fetchOwnerListings(
                { ...filters, readyToMove: true, cursor: "", limit: 1 },
                filterContext,
                signal,
            ),
        select: (result) => result.totalCount,
    });
    const readyToMoveCount = filters.readyToMove
        ? query.data
            ? query.total
            : undefined
        : readyToMoveCountQuery.data;
    const isReadyToMoveCountLoading = filters.readyToMove
        ? isInitialLoading
        : readyToMoveCountQuery.isPending;
    const complete = !isInitialLoading && !query.isError && !query.hasNextPage;
    // Facet totals cannot be inferred from a partially downloaded result set.
    const chipCounts = useMemo(
        () => (complete ? buildQuickChipCounts(query.items, serviceAreas) : undefined),
        [complete, query.items, serviceAreas],
    );
    const newThisWeekCount = useMemo(
        () => countNewListingsInServiceAreasThisWeek(query.items, serviceAreas),
        [query.items, serviceAreas],
    );

    const handleApplySheet = useCallback(
        (patch: Partial<OwnerListingsFilters>) => {
            applyFilters(stripHiddenOwnerListingsFilters({ ...filters, ...patch, cursor: "" }));
        },
        [applyFilters, filters],
    );
    const handleApplyBand = useCallback(
        (band: OwnerListingsBandFilters) =>
            handleApplySheet({
                ...band,
                // Sale keeps a percent range; rent keeps an amount. Switching Looking for drops the other.
                ...commissionRangeForType(band.type),
            }),
        [handleApplySheet],
    );
    const handleSortChange = useCallback(
        (sort: OwnerListingSort) => handleApplySheet({ sort }),
        [handleApplySheet],
    );
    const introSection = useMemo(
        () => (
            <OwnerListingsIntro
                userId={profile?.id ?? authUser?.id}
                hasApprovedRepresentation={(dashboardData?.youRepresent?.totalCount ?? 0) > 0}
                newThisWeekCount={newThisWeekCount}
                hasMoreResults={Boolean(query.hasNextPage)}
                poolSummary={
                    chipCounts
                        ? {
                              slotsOpenCount: chipCounts.slotsOpen,
                              newTodayCount: chipCounts.newToday,
                              commissionSetCount: chipCounts.commissionSet,
                              readyToMoveCount: chipCounts.readyToMove,
                          }
                        : undefined
                }
                serviceAreas={serviceAreas}
                totalCount={query.total}
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                isLoading={isInitialLoading}
                hasError={query.isError && query.items.length === 0}
            />
        ),
        [
            profile?.id,
            authUser?.id,
            dashboardData?.youRepresent?.totalCount,
            newThisWeekCount,
            chipCounts,
            query.hasNextPage,
            serviceAreas,
            query.total,
            filters,
            hasActiveFilters,
            isInitialLoading,
            query.isError,
            query.items.length,
        ],
    );

    if (!profile) {
        if (profileQuery.isError)
            return (
                <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
                    <h1 className="h6 text-ink">Could not load your profile</h1>
                    <p className="body-sm text-ink-muted">Check your connection and try again.</p>
                    <Button variant="outline" onClick={() => void profileQuery.refetch()}>
                        Try again
                    </Button>
                </div>
            );
        return <OwnerListingsPageSkeleton filters={filters} />;
    }
    if (blockedReason)
        return <OwnerListingsEmpty variant="blocked" blockedReason={blockedReason} />;

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>{introSection}</PortalSectionNav>
            <OwnerListingsHeader
                filters={filters}
                listings={locations.data?.listings ?? EMPTY_ITEMS}
                serviceableListingCount={locations.data?.serviceableCount}
                locationsLoading={locations.isPending}
                locationsError={locations.isError}
                onRetryLocations={() => void locations.refetch()}
                filterContext={filterContext}
                chipCounts={chipCounts}
                readyToMoveCount={readyToMoveCount}
                isReadyToMoveCountLoading={isReadyToMoveCountLoading}
                totalCount={query.total}
                isResultsLoading={isInitialLoading}
                onApplyBand={handleApplyBand}
                onApplySheet={handleApplySheet}
                onToggleQuickChip={toggleQuickChip}
                onSortChange={handleSortChange}
            />
            <section
                aria-label="Marketplace results"
                aria-busy={isInitialLoading || query.isFetching}
            >
                {isInitialLoading ? (
                    <OwnerListingsCardsSkeleton />
                ) : query.isError && query.items.length === 0 ? (
                    <div
                        role="alert"
                        className="flex flex-col items-center gap-4 py-12 text-center"
                    >
                        <h2 className="h6 text-ink">Could not load Marketplace properties</h2>
                        <p className="body-sm text-ink-muted">
                            Check your connection and try again.
                        </p>
                        <Button variant="outline" onClick={() => void query.refetch()}>
                            Try again
                        </Button>
                    </div>
                ) : query.items.length === 0 ? (
                    <OwnerListingsEmpty
                        variant={hasActiveFilters ? "filtered" : "first_run"}
                        searchQuery={filters.q}
                        onClearFilters={hasActiveFilters ? clearFilters : undefined}
                    />
                ) : (
                    <>
                        {query.isRefetchError && !query.isFetchNextPageError ? (
                            <div
                                role="alert"
                                className="
                                  body-sm flex flex-wrap items-center gap-3 py-3 text-ink-muted
                                "
                            >
                                Could not refresh listings. Showing the last loaded results.
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void query.refetch()}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : null}
                        <OwnerListingsGrid items={query.items} serviceAreas={serviceAreas} />
                        {query.isFetchingNextPage ? (
                            <div className="pbs-6">
                                <OwnerListingsCardsSkeleton
                                    count={5}
                                    label="Loading more properties"
                                />
                            </div>
                        ) : null}
                        <InfiniteListStatus
                            hasNextPage={Boolean(query.hasNextPage)}
                            isFetchingNextPage={query.isFetchingNextPage}
                            error={query.isFetchNextPageError ? query.error : null}
                            onLoadMore={() => void query.fetchNextPage()}
                        />
                    </>
                )}
            </section>
        </div>
    );
}
