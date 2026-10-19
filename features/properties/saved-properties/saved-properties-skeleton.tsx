import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";

export function SavedPropertiesResultsSkeleton() {
    return (
        <div className={OWNER_LISTINGS_GRID_CLASS}>
            {Array.from({ length: 5 }).map((_, index) => (
                <PropertyCardSkeleton key={index} variant="browse" />
            ))}
        </div>
    );
}

export function SavedPropertiesSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div
                className="
                  animate-pulse rounded-control bg-surface-muted block-8 inline-72 max-inline-full
                "
            />
            <SavedPropertiesResultsSkeleton />
        </div>
    );
}
