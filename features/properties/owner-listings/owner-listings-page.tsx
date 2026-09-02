"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchOwnerListings } from "@/lib/api/owner-listings";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";

import {
    type BrokerVerificationState,
    mapBrokerVerificationState,
} from "@/features/broker/map-profile-menu";
import type { OwnerListingsPoolSummary } from "@/features/properties/owner-listings/build-owner-listings-summary-lines";
import { buildQuickChipCounts } from "@/features/properties/owner-listings/build-quick-chip-counts";
import { countNewListingsInServiceAreasThisWeek } from "@/features/properties/owner-listings/count-new-listings-this-week";
import {
    MOCK_OWNER_LISTINGS,
    OWNER_LISTING_LOCALITIES,
} from "@/features/properties/owner-listings/mock-owner-listings";
import { OwnerListingsEmpty } from "@/features/properties/owner-listings/owner-listings-empty";
import { OwnerListingsGrid } from "@/features/properties/owner-listings/owner-listings-grid";
import {
    OWNER_LISTINGS_GRID_CLASS,
    OWNER_LISTINGS_LIST_CLASS,
} from "@/features/properties/owner-listings/owner-listings-grid-class";
import { OwnerListingsHeader } from "@/features/properties/owner-listings/owner-listings-header";
import { OwnerListingsIntro } from "@/features/properties/owner-listings/owner-listings-intro";
import { OwnerListingsPageSkeleton } from "@/features/properties/owner-listings/owner-listings-skeleton";
import type {
    OwnerListingsBandFilters,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingSort,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { useOwnerListingsFilters } from "@/features/properties/owner-listings/use-owner-listings-filters";
import {
    type OwnerListingsView,
    useOwnerListingsView,
} from "@/features/properties/owner-listings/use-owner-listings-view";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

function resolveBlockedReason(
    verificationState: BrokerVerificationState,
    serviceAreaCount: number,
): "no_service_areas" | "profile_incomplete" | null {
    if (serviceAreaCount === 0) return "no_service_areas";
    if (verificationState === "PROFILE_INCOMPLETE") return "profile_incomplete";
    return null;
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 47.9375rem)");
        const update = () => setIsMobile(mediaQuery.matches);
        update();
        mediaQuery.addEventListener("change", update);
        return () => mediaQuery.removeEventListener("change", update);
    }, []);

    return isMobile;
}

const EMPTY_SERVICE_AREAS: string[] = [];

const EMPTY_POOL_SUMMARY: OwnerListingsPoolSummary = {
    slotsOpenCount: 0,
    newTodayCount: 0,
    commissionSetCount: 0,
    readyToMoveCount: 0,
};

function summarizePool(items: OwnerListingsResult["items"]): OwnerListingsPoolSummary {
    return {
        slotsOpenCount: items.filter((item) => item.brokerSlotsOpen > 0).length,
        newTodayCount: items.filter((item) => item.isNew).length,
        commissionSetCount: items.filter((item) => item.commissionPercent > 0).length,
        readyToMoveCount: items.filter((item) => item.readyToMove).length,
    };
}

function OwnerListingsResults({
    filterSignature,
    serviceAreasKey,
    filters,
    filterContext,
    hasActiveFilters,
    onClearFilters,
    onLoaded,
    onLoadingChange,
    view,
}: {
    filterSignature: string;
    serviceAreasKey: string;
    filters: OwnerListingsFilters;
    filterContext: OwnerListingsFilterContext;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    onLoaded: (result: OwnerListingsResult) => void;
    onLoadingChange: (isLoading: boolean) => void;
    view: OwnerListingsView;
}) {
    const [result, setResult] = useState<OwnerListingsResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        let cancelled = false;

        setError(null);
        setIsFetching(true);
        onLoadingChange(true);

        void fetchOwnerListings(filters, filterContext)
            .then((data) => {
                if (cancelled) return;
                setResult(data);
                onLoaded(data);
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Could not load owner listings. Try again.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsFetching(false);
                    onLoadingChange(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // filterSignature + serviceAreasKey are stable fetch triggers; filters/context read at fire time.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable keys
    }, [filterSignature, serviceAreasKey]);

    if (error) {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load owner listings</p>
                <p className="body-sm text-ink-muted">{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!result) {
        if (!isFetching) {
            return null;
        }

        return (
            <div
                className={view === "list" ? OWNER_LISTINGS_LIST_CLASS : OWNER_LISTINGS_GRID_CLASS}
            >
                {Array.from({ length: view === "list" ? 6 : 10 }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "animate-pulse rounded-card bg-surface-muted",
                            view === "list" ? "block-36" : "block-80",
                        )}
                        aria-hidden
                    />
                ))}
            </div>
        );
    }

    if (result.items.length === 0) {
        return (
            <OwnerListingsEmpty
                variant={hasActiveFilters ? "filtered" : "first_run"}
                searchQuery={filters.q}
                onClearFilters={hasActiveFilters ? onClearFilters : undefined}
            />
        );
    }

    return (
        <div className={isFetching ? "opacity-60 transition-opacity duration-160" : undefined}>
            <OwnerListingsGrid items={result.items} view={view} />
        </div>
    );
}

export function OwnerListingsPage() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.dashboard.profile);
    const dashboardData = useAppSelector((state) => state.dashboard.data);
    const authUser = useAppSelector((state) => state.auth.user);
    const dashboardStatus = useAppSelector((state) => state.dashboard.status);
    const isMobile = useIsMobile();

    const {
        filters,
        applyFilters,
        toggleQuickChip,
        clearFilters,
        hasActiveFilters,
        filterSignature,
    } = useOwnerListingsFilters();
    const { view, setView } = useOwnerListingsView();

    const serviceAreas = profile?.broker?.serviceAreas ?? EMPTY_SERVICE_AREAS;
    const serviceAreasKey = serviceAreas.join("|");
    const filterContext = useMemo(() => ({ serviceAreas }), [serviceAreasKey]);

    const userId = profile?.id ?? authUser?.id;
    const hasApprovedRepresentation = (dashboardData?.youRepresent?.totalCount ?? 0) > 0;
    const newThisWeekCount = useMemo(
        () => countNewListingsInServiceAreasThisWeek(MOCK_OWNER_LISTINGS, serviceAreas),
        [serviceAreasKey],
    );
    const chipCounts = useMemo(
        () => buildQuickChipCounts(MOCK_OWNER_LISTINGS, serviceAreas),
        [serviceAreasKey],
    );

    const [totalCount, setTotalCount] = useState(0);
    const [poolSummary, setPoolSummary] = useState<OwnerListingsPoolSummary>(EMPTY_POOL_SUMMARY);
    const [isResultsLoading, setIsResultsLoading] = useState(true);

    const handleLoaded = useCallback((result: OwnerListingsResult) => {
        setTotalCount(result.totalCount);
        setPoolSummary(summarizePool(result.items));
    }, []);

    const handleApplyBand = useCallback(
        (band: OwnerListingsBandFilters) => {
            if (isMobile) {
                applyFilters({
                    ...filters,
                    localities: band.localities,
                    min: band.min,
                    max: band.max,
                });
                return;
            }

            applyFilters({ ...filters, ...band });
        },
        [applyFilters, filters, isMobile],
    );

    const handleApplySheet = useCallback(
        (patch: Partial<OwnerListingsFilters>) => {
            applyFilters({ ...filters, ...patch });
        },
        [applyFilters, filters],
    );

    const handleSortChange = useCallback(
        (sort: OwnerListingSort) => {
            applyFilters({ ...filters, sort });
        },
        [applyFilters, filters],
    );

    const introSection = useMemo(
        () => (
            <OwnerListingsIntro
                userId={userId}
                hasApprovedRepresentation={hasApprovedRepresentation}
                newThisWeekCount={newThisWeekCount}
                serviceAreas={serviceAreas}
                totalCount={totalCount}
                poolSummary={poolSummary}
                filters={filters}
                hasActiveFilters={hasActiveFilters}
                isLoading={isResultsLoading}
            />
        ),
        [
            userId,
            hasApprovedRepresentation,
            newThisWeekCount,
            serviceAreasKey,
            totalCount,
            poolSummary,
            filterSignature,
            hasActiveFilters,
            isResultsLoading,
        ],
    );

    useEffect(() => {
        if (dashboardStatus === "idle") {
            void dispatch(fetchBrokerDashboard());
        }
    }, [dashboardStatus, dispatch]);

    const verificationState = mapBrokerVerificationState(profile);
    const serviceAreaCount = serviceAreas.length;
    const blockedReason = resolveBlockedReason(verificationState, serviceAreaCount);

    if (dashboardStatus === "loading" || dashboardStatus === "idle") {
        return <OwnerListingsPageSkeleton />;
    }

    if (blockedReason) {
        return (
            <div className="flex flex-col gap-6">
                <OwnerListingsEmpty variant="blocked" blockedReason={blockedReason} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>{introSection}</PortalSectionNav>

            <OwnerListingsHeader
                filters={filters}
                localityOptions={OWNER_LISTING_LOCALITIES}
                filterContext={filterContext}
                chipCounts={chipCounts}
                isResultsLoading={isResultsLoading}
                onApplyBand={handleApplyBand}
                onApplySheet={handleApplySheet}
                onToggleQuickChip={toggleQuickChip}
                onSortChange={handleSortChange}
                view={view}
                onViewChange={setView}
            />

            <OwnerListingsResults
                filterSignature={filterSignature}
                serviceAreasKey={serviceAreasKey}
                filters={filters}
                filterContext={filterContext}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                onLoaded={handleLoaded}
                onLoadingChange={setIsResultsLoading}
                view={view}
            />
        </div>
    );
}
