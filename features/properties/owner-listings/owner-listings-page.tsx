"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchOwnerListingCities, fetchOwnerListings } from "@/lib/api/owner-listings";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppPagination } from "@/components/shared/app-pagination";

import {
    type BrokerVerificationState,
    mapBrokerVerificationState,
} from "@/features/broker/map-profile-menu";
import type { OwnerListingsPoolSummary } from "@/features/properties/owner-listings/build-owner-listings-summary-lines";
import { buildQuickChipCounts } from "@/features/properties/owner-listings/build-quick-chip-counts";
import { countNewListingsInServiceAreasThisWeek } from "@/features/properties/owner-listings/count-new-listings-this-week";
import { citiesToLocationListings } from "@/features/properties/owner-listings/map-browse-listing";
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
    OwnerListingItem,
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
const EMPTY_LOCATION_LISTINGS: OwnerListingItem[] = [];

/** Static page count so the pager stays visible while the pool is small. */
const STATIC_OWNER_LISTINGS_PAGES = 10;

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
    // Static pager for UI — always visible while listing volume is low.
    const [staticPage, setStaticPage] = useState(1);
    const [staticPageSize, setStaticPageSize] = useState(10);

    useEffect(() => {
        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

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
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [filterSignature, serviceAreasKey, filters, filterContext, onLoaded, onLoadingChange]);

    useEffect(() => {
        setStaticPage(1);
    }, [filterSignature]);

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
                            view === "list" ? "min-h-52" : "block-80",
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
        <div
            className={cn(
                "flex flex-col gap-8",
                isFetching && "opacity-60 transition-opacity duration-160",
            )}
        >
            <OwnerListingsGrid items={result.items} view={view} />
            <AppPagination
                page={staticPage}
                totalPages={STATIC_OWNER_LISTINGS_PAGES}
                onPageChange={setStaticPage}
                pageSize={staticPageSize}
                onPageSizeChange={(next) => {
                    setStaticPageSize(next);
                    setStaticPage(1);
                }}
                aria-label="Owner listings pages"
            />
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
    const filterContext = useMemo(() => ({ serviceAreas }), [serviceAreas]);

    const userId = profile?.id ?? authUser?.id;
    const hasApprovedRepresentation = (dashboardData?.youRepresent?.totalCount ?? 0) > 0;

    const [locationListings, setLocationListings] =
        useState<OwnerListingItem[]>(EMPTY_LOCATION_LISTINGS);
    const [poolItems, setPoolItems] = useState<OwnerListingItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [poolSummary, setPoolSummary] = useState<OwnerListingsPoolSummary>(EMPTY_POOL_SUMMARY);
    const [isResultsLoading, setIsResultsLoading] = useState(true);

    const newThisWeekCount = useMemo(
        () => countNewListingsInServiceAreasThisWeek(poolItems, serviceAreas),
        [poolItems, serviceAreas],
    );
    const chipCounts = useMemo(
        () => buildQuickChipCounts(poolItems, serviceAreas),
        [poolItems, serviceAreas],
    );

    const handleLoaded = useCallback((result: OwnerListingsResult) => {
        setTotalCount(result.totalCount);
        setPoolSummary(summarizePool(result.items));
        setPoolItems(result.items);
    }, []);

    const handleApplyBand = useCallback(
        (band: OwnerListingsBandFilters) => {
            const hasLocationFilter = band.cities.length > 0 || band.localities.length > 0;
            const next = {
                ...filters,
                ...band,
                cursor: "",
                ...(hasLocationFilter ? { yourAreas: false } : {}),
            };

            if (isMobile) {
                applyFilters({
                    ...next,
                    cities: band.cities,
                    localities: band.localities,
                    min: band.min,
                    max: band.max,
                });
                return;
            }

            applyFilters(next);
        },
        [applyFilters, filters, isMobile],
    );

    const handleApplySheet = useCallback(
        (patch: Partial<OwnerListingsFilters>) => {
            applyFilters({ ...filters, ...patch, cursor: "" });
        },
        [applyFilters, filters],
    );

    const handleSortChange = useCallback(
        (sort: OwnerListingSort) => {
            applyFilters({ ...filters, sort, cursor: "" });
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
            serviceAreas,
            totalCount,
            poolSummary,
            filters,
            hasActiveFilters,
            isResultsLoading,
        ],
    );

    useEffect(() => {
        if (dashboardStatus === "idle") {
            void dispatch(fetchBrokerDashboard());
        }
    }, [dashboardStatus, dispatch]);

    useEffect(() => {
        if (dashboardStatus !== "succeeded") return;

        let cancelled = false;
        void fetchOwnerListingCities()
            .then((data) => {
                if (!cancelled) {
                    setLocationListings(citiesToLocationListings(data.items));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLocationListings(EMPTY_LOCATION_LISTINGS);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [dashboardStatus, serviceAreasKey]);

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
                listings={locationListings}
                filterContext={filterContext}
                chipCounts={chipCounts}
                poolListings={poolItems}
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
