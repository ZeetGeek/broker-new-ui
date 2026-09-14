import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import {
    REQUESTS_GRID_CLASS,
    REQUESTS_LIST_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

export function RequestsListSkeleton({
    view = "grid",
    count = 5,
}: {
    view?: RequestsView;
    count?: number;
}) {
    const isList = view === "list";

    return (
        <div className={isList ? REQUESTS_LIST_CLASS : REQUESTS_GRID_CLASS} aria-hidden>
            {Array.from({ length: count }).map((_, index) => (
                <PropertyCardSkeleton
                    key={index}
                    variant={isList ? "browse" : "browse-overlay"}
                    layout={view}
                />
            ))}
        </div>
    );
}

export function RequestsPageSkeleton({ view = "grid" }: { view?: RequestsView }) {
    const isList = view === "list";

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
            <div className={isList ? REQUESTS_LIST_CLASS : REQUESTS_GRID_CLASS}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <PropertyCardSkeleton
                        key={index}
                        variant={isList ? "browse" : "browse-overlay"}
                        layout={view}
                    />
                ))}
            </div>
        </div>
    );
}
