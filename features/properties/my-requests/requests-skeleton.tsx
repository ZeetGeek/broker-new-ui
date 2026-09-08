import {
    REQUESTS_GRID_CLASS,
    REQUESTS_LIST_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

export function RequestsListSkeleton({
    view = "list",
    count = 4,
}: {
    view?: RequestsView;
    count?: number;
}) {
    return (
        <div className={view === "list" ? REQUESTS_LIST_CLASS : REQUESTS_GRID_CLASS} aria-hidden>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="animate-pulse rounded-card bg-surface-muted min-block-44"
                />
            ))}
        </div>
    );
}

export function RequestsPageSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="animate-pulse rounded-card bg-surface-muted block-20" aria-hidden />
            <div className="flex gap-2" aria-hidden>
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="animate-pulse rounded-full bg-surface-muted block-9 inline-24"
                    />
                ))}
            </div>
            <RequestsListSkeleton />
        </div>
    );
}
