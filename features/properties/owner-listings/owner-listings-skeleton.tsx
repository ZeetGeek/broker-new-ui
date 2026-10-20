"use client";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { filterChipClassName } from "@/components/shared/filter-chip";
import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";
import { Skeleton } from "@/components/shared/skeleton";

import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";
import { OwnerListingsIntroSkeleton } from "@/features/properties/owner-listings/owner-listings-intro";
import { ownerListingsFilterVisibility } from "@/features/properties/owner-listings/filter-visibility";
import {
    DEFAULT_OWNER_LISTINGS_FILTERS,
    type OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";
import { formatSortLabel } from "@/lib/format/owner-listings-labels";

const intro = <OwnerListingsIntroSkeleton />;

function SkeletonLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-block">
            <span className="invisible">{children}</span>
            <Skeleton className="absolute inset-x-0 inset-bs-1/2 -translate-y-1/2 block-3" />
        </span>
    );
}

function OwnerListingsToolbarSkeleton({ filters }: { filters: OwnerListingsFilters }) {
    const visibility = ownerListingsFilterVisibility(filters);
    return (
        <div aria-hidden className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="-my-1.5 flex flex-1 gap-2.5 overflow-hidden px-0.5 py-1.5 min-inline-0">
                <div className={filterChipClassName(false)}>
                    <Skeleton className="block-4 inline-4" />
                    <SkeletonLabel>Filters</SkeletonLabel>
                    <span className="flex items-center justify-center block-5 inline-8">
                        <Skeleton className="block-4 inline-7" />
                    </span>
                </div>
                {visibility.showReadyToMove ? (
                    <div className={filterChipClassName(false)}>
                        <SkeletonLabel>
                            <span className="md:hidden">Move-in</span>
                            <span className="hidden md:inline">Ready to move</span>
                        </SkeletonLabel>
                        <span className="flex items-center justify-center block-5 inline-8">
                            <Skeleton className="block-4 inline-7" />
                        </span>
                    </div>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2.5 max-inline-full">
                <div className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px] min-inline-44 inline-44 sm:min-inline-52 sm:inline-52 lg:min-inline-64 lg:inline-64">
                    <Skeleton className="shrink-0 block-4 inline-4" />
                    <Skeleton className="block-3 inline-24" />
                </div>
                <div className={`${filterChipClassName(false)} gap-2`}>
                    <Skeleton className="block-4 inline-4" />
                    <SkeletonLabel>
                        <span className="hidden sm:inline">{formatSortLabel(filters.sort)}</span>
                        <span className="sm:hidden">Sort</span>
                    </SkeletonLabel>
                    <Skeleton className="block-3.5 inline-3.5" />
                </div>
            </div>
        </div>
    );
}

export function OwnerListingsCardsSkeleton({
    count = 10,
    label = "Loading properties",
}: {
    count?: number;
    label?: string;
}) {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">{label}</span>
            <div className={OWNER_LISTINGS_GRID_CLASS}>
                {Array.from({ length: count }, (_, index) => (
                    <PropertyCardSkeleton key={index} variant="browse-overlay" />
                ))}
            </div>
        </div>
    );
}

export function OwnerListingsPageSkeleton({
    filters = DEFAULT_OWNER_LISTINGS_FILTERS,
}: {
    filters?: OwnerListingsFilters;
}) {
    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>{intro}</PortalSectionNav>
            <div aria-hidden className="flex flex-col gap-6">
                <div
                    className="
                      flex items-center gap-2 overflow-hidden rounded-card border border-border-warm
                      bg-surface p-2
                    "
                >
                    {Array.from({ length: 6 }, (_, index) => (
                        <div
                            key={index}
                            className={
                                index > 1
                                    ? "hidden flex-1 flex-col gap-2 px-4 py-3 min-inline-32 md:flex"
                                    : "flex flex-1 flex-col gap-2 px-4 py-3 min-inline-36"
                            }
                        >
                            <Skeleton className="block-3 inline-16" />
                            <Skeleton className="block-4 inline-24" />
                        </div>
                    ))}
                </div>
                <OwnerListingsToolbarSkeleton filters={filters} />
            </div>
            <OwnerListingsCardsSkeleton />
        </div>
    );
}

export function OwnerListingDetailSkeleton() {
    return (
        <div role="status" aria-busy="true" className="flex flex-col gap-6 pbe-24 lg:pbe-8">
            <span className="sr-only">Loading property details</span>
            <Skeleton className="block-5 inline-28" />
            <Skeleton
                className="
                  aspect-4/3 rounded-card inline-full
                  md:aspect-auto md:block-104
                  lg:block-120
                "
            />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)] lg:gap-10">
                <div className="flex flex-col gap-8 min-inline-0">
                    <div className="flex flex-col gap-3">
                        <Skeleton className="block-9 inline-3/4" />
                        <Skeleton className="block-6 inline-1/2" />
                    </div>
                    <Skeleton className="rounded-card block-28 inline-full" />
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 6 }, (_, index) => (
                            <Skeleton key={index} className="block-20" />
                        ))}
                    </div>
                    <Skeleton className="block-24 inline-full" />
                </div>
                <div
                    className="
                      flex flex-col gap-4 self-start rounded-card border border-border-warm
                      bg-surface p-5
                    "
                >
                    <Skeleton className="block-12 inline-48" />
                    <Skeleton className="block-20 inline-full" />
                    <Skeleton className="block-11 inline-full" />
                </div>
            </div>
            <div
                aria-hidden
                className="
                  fixed inset-x-0 inset-be-0 z-30 border-bs border-border-warm bg-surface p-3
                  lg:hidden
                "
            >
                <Skeleton className="block-11 inline-full" />
            </div>
        </div>
    );
}
