/**
 * Skeletons mirror the real card layout — thumb, two name rows, one action —
 * so the page does not reflow when the data lands. See docs/LOADING.md.
 */
function DealCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-3"
            aria-hidden
        >
            <div className="flex items-start gap-2.5">
                <div className="
                  shrink-0 rounded-inner bg-surface-muted block-14 inline-18
                  sm:block-18 sm:inline-22
                " />
                <div className="flex flex-1 flex-col gap-2">
                    <div className="rounded-sm bg-surface-muted block-3 inline-28" />
                    <div className="rounded-sm bg-surface-muted block-3 inline-16" />
                </div>
            </div>

            <div className="flex flex-col gap-2.5 rounded-inner bg-surface-muted/60 p-2.5">
                <div className="flex items-center gap-2">
                    <div className="
                      shrink-0 rounded-control bg-surface-muted block-control-sm inline-control-sm
                    " />
                    <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="
                      shrink-0 rounded-control bg-surface-muted block-control-sm inline-control-sm
                    " />
                    <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                </div>
            </div>

            <div className="rounded-control bg-surface-muted block-control-sm" />
        </div>
    );
}

export function PipelineBoardSkeleton() {
    return (
        <div
            className="motion-safe:animate-pulse"
            aria-busy="true"
            aria-label="Loading your deals"
        >
            <div className="hidden gap-3 lg:grid lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, column) => (
                    <div key={column} className="
                      flex flex-col gap-3 rounded-card bg-surface-muted/40 p-2
                    ">
                        <div className="flex items-center justify-between px-1 pbs-1">
                            <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                            <div className="rounded-full bg-surface-muted block-3 inline-3" />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {Array.from({ length: column === 0 ? 2 : 1 }).map((__, card) => (
                                <DealCardSkeleton key={card} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2.5 lg:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                    <DealCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}
