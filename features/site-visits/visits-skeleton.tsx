/**
 * Skeletons mirror the real layout — a day header, then rows with a time
 * gutter, a thumb, and three text lines — so nothing reflows when the data
 * lands. See docs/LOADING.md.
 */
function VisitRowSkeleton() {
    return (
        <div className="flex gap-3 border-be border-border-warm px-3 py-3.5 sm:gap-4 sm:px-4">
            <div className="flex shrink-0 flex-col gap-1.5 inline-16 sm:inline-20">
                <div className="rounded-sm bg-surface-muted block-4 inline-14" />
                <div className="rounded-sm bg-surface-muted block-3 inline-8" />
            </div>

            <div className="shrink-0 rounded-full bg-surface-muted inline-0.5" />

            <div
                className="
                  hidden shrink-0 rounded-inner bg-surface-muted
                  sm:block sm:block-18 sm:inline-22
                "
            />

            <div className="flex flex-1 flex-col gap-2 min-inline-0">
                <div className="rounded-sm bg-surface-muted block-4 inline-40" />
                <div className="rounded-sm bg-surface-muted block-3 inline-52" />
                <div className="rounded-sm bg-surface-muted block-3 inline-36" />
            </div>

            <div className="shrink-0 rounded-control bg-surface-muted block-control-sm inline-20" />
        </div>
    );
}

export function VisitsListSkeleton({
    days = 2,
    rowsPerDay = 2,
}: {
    days?: number;
    rowsPerDay?: number;
}) {
    return (
        <div className="flex flex-col gap-6" aria-busy aria-label="Loading your visits">
            {Array.from({ length: days }, (_, dayIndex) => (
                <section key={dayIndex} className="flex flex-col">
                    <div className="border-be border-border-warm pbe-2">
                        <div className="rounded-sm bg-surface-muted block-4 inline-44" />
                    </div>

                    <div
                        className="
                          overflow-hidden rounded-card border border-bs-0 border-border-warm
                        "
                    >
                        {Array.from({ length: rowsPerDay }, (_, rowIndex) => (
                            <VisitRowSkeleton key={rowIndex} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
