import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import {
    MY_LISTINGS_GRID_CLASS,
    MY_LISTINGS_LIST_CLASS,
} from "@/features/properties/your-listings/my-listings-grid-class";
import type { MyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

export function MyListingsPageSkeleton({ view = "grid" }: { view?: MyListingsView }) {
    const isList = view === "list";

    return (
        <div className="flex flex-col gap-6">
            <div className="h-8 w-72 max-w-full animate-pulse rounded-control bg-surface-muted" />
            <div className="flex h-[38px] items-center gap-2.5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[38px] w-28 animate-pulse rounded-full bg-surface-muted"
                    />
                ))}
                <div className="ms-auto h-[38px] w-52 animate-pulse rounded-full bg-surface-muted" />
            </div>
            <div className={isList ? MY_LISTINGS_LIST_CLASS : MY_LISTINGS_GRID_CLASS}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <PropertyCardSkeleton key={index} variant="browse" layout={view} />
                ))}
            </div>
        </div>
    );
}

export function MyListingsResultsSkeleton({ view = "grid" }: { view?: MyListingsView }) {
    const isList = view === "list";
    return (
        <div className={isList ? MY_LISTINGS_LIST_CLASS : MY_LISTINGS_GRID_CLASS}>
            {Array.from({ length: 5 }).map((_, index) => (
                <PropertyCardSkeleton key={index} variant="browse" layout={view} />
            ))}
        </div>
    );
}
