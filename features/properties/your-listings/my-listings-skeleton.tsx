import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import { MY_LISTINGS_GRID_CLASS } from "@/features/properties/your-listings/my-listings-grid-class";

export function MyListingsPageSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div
                className="
              animate-pulse rounded-control bg-surface-muted block-8 inline-72 max-inline-full
            "
            />
            <div className="flex items-center gap-2.5 block-[38px]">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="
                          animate-pulse rounded-control bg-surface-muted block-[38px] inline-28
                        "
                    />
                ))}
                <div
                    className="
                  ms-auto animate-pulse rounded-control bg-surface-muted block-[38px] inline-52
                "
                />
            </div>
            <div className={MY_LISTINGS_GRID_CLASS}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <PropertyCardSkeleton key={index} variant="browse" />
                ))}
            </div>
        </div>
    );
}

export function MyListingsResultsSkeleton() {
    return (
        <div className={MY_LISTINGS_GRID_CLASS}>
            {Array.from({ length: 5 }).map((_, index) => (
                <PropertyCardSkeleton key={index} variant="browse" />
            ))}
        </div>
    );
}
