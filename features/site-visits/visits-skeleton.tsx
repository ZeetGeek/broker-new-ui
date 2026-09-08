/**
 * Skeletons mirror the real layout — thumb, when-strip, two people, one action
 * row — so nothing reflows when the data lands. See docs/LOADING.md.
 */
function VisitCardSkeleton() {
    return (
        <div
            className="
              flex flex-col gap-3 rounded-card border-s-2 border-s-border-warm bg-surface p-4
            "
            aria-hidden
        >
            <div className="flex items-start gap-3">
                <div
                    className="
                      shrink-0 rounded-inner bg-surface-muted block-14 inline-18
                      sm:block-18 sm:inline-22
                    "
                />
                <div className="flex flex-1 flex-col gap-2">
                    <div className="rounded-full bg-surface-muted block-4 inline-40" />
                    <div className="rounded-full bg-surface-muted block-3 inline-28" />
                    <div className="rounded-full bg-surface-muted block-3 inline-20" />
                </div>
            </div>

            <div className="rounded-inner bg-surface-muted block-10" />

            <div className="flex items-center gap-2">
                <div
                    className="
                      shrink-0 rounded-full bg-surface-muted block-control-sm inline-control-sm
                    "
                />
                <div className="rounded-full bg-surface-muted block-3 inline-24" />
            </div>

            <div className="flex gap-2">
                <div className="rounded-control bg-surface-muted block-control-sm inline-24" />
                <div className="rounded-control bg-surface-muted block-control-sm inline-32" />
            </div>
        </div>
    );
}

export function VisitsListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div
            className="grid grid-cols-1 gap-3 lg:grid-cols-2"
            aria-busy
            aria-label="Loading your visits"
        >
            {Array.from({ length: rows }, (_, index) => (
                <VisitCardSkeleton key={index} />
            ))}
        </div>
    );
}

/** Matches the calendar's header row plus grid, so the swap does not jump. */
export function VisitsCalendarSkeleton() {
    return (
        <div
            className="overflow-hidden rounded-card bg-surface"
            aria-busy
            aria-label="Loading your calendar"
        >
            <div className="flex gap-2 border-be border-border-warm p-3">
                <div className="shrink-0 inline-12 sm:inline-14" />
                {Array.from({ length: 7 }, (_, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                        <div className="rounded-full bg-surface-muted block-3 inline-8" />
                        <div className="rounded-full bg-surface-muted block-6 inline-6" />
                    </div>
                ))}
            </div>
            <div className="bg-surface-muted/40 block-96" />
        </div>
    );
}
