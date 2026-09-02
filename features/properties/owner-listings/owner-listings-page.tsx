"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchOwnerListings } from "@/lib/api/owner-listings";

import {
    type BrokerVerificationState,
    mapBrokerVerificationState,
} from "@/features/broker/map-profile-menu";
import { OwnerListingsEmpty } from "@/features/properties/owner-listings/owner-listings-empty";
import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";
import { OwnerListingsGrid } from "@/features/properties/owner-listings/owner-listings-grid";
import { OwnerListingsHeader } from "@/features/properties/owner-listings/owner-listings-header";
import { OwnerListingsPageSkeleton } from "@/features/properties/owner-listings/owner-listings-skeleton";
import type {
    OwnerListingSort,
    OwnerListingsBandFilters,
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";
import { OWNER_LISTING_LOCALITIES } from "@/features/properties/owner-listings/mock-owner-listings";
import { useOwnerListingsFilters } from "@/features/properties/owner-listings/use-owner-listings-filters";
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

function OwnerListingsResults({
    filterSignature,
    serviceAreasKey,
    filters,
    filterContext,
    hasActiveFilters,
    onClearFilters,
    onLoaded,
    onLoadingChange,
}: {
    filterSignature: string;
    serviceAreasKey: string;
    filters: OwnerListingsFilters;
    filterContext: OwnerListingsFilterContext;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    onLoaded: (result: OwnerListingsResult) => void;
    onLoadingChange: (isLoading: boolean) => void;
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
            <div className={OWNER_LISTINGS_GRID_CLASS}>
                {Array.from({ length: 10 }).map((_, index) => (
                    <div
                        key={index}
                        className="animate-pulse rounded-card bg-surface-muted block-80"
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
            <OwnerListingsGrid items={result.items} />
        </div>
    );
}

export function OwnerListingsPage() {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.dashboard.profile);
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

    const serviceAreas = profile?.broker?.serviceAreas ?? EMPTY_SERVICE_AREAS;
    const serviceAreasKey = serviceAreas.join("|");
    const filterContext = useMemo(
        () => ({ serviceAreas }),
        [serviceAreasKey],
    );

    const [totalCount, setTotalCount] = useState(0);
    const [isResultsLoading, setIsResultsLoading] = useState(true);

    const handleLoaded = useCallback((result: OwnerListingsResult) => {
        setTotalCount(result.totalCount);
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
        <div className="flex flex-col gap-4">
            <OwnerListingsHeader
                filters={filters}
                serviceAreas={serviceAreas}
                localityOptions={OWNER_LISTING_LOCALITIES}
                totalCount={totalCount}
                isLoading={isResultsLoading}
                filterContext={filterContext}
                onApplyBand={handleApplyBand}
                onApplySheet={handleApplySheet}
                onToggleQuickChip={toggleQuickChip}
                onSortChange={handleSortChange}
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
            />
        </div>
    );
}
