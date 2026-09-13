function DealCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-2.5 rounded-card border border-border-warm bg-surface p-4"
            aria-hidden
        >
            <div className="flex items-center gap-2">
                <div
                    className="
                      shrink-0 rounded-full bg-surface-muted block-control-sm inline-control-sm
                    "
                />
                <div className="rounded-sm bg-surface-muted block-3 inline-28" />
            </div>
            <div className="rounded-sm bg-surface-muted block-3 inline-40" />
            <div className="rounded-sm bg-surface-muted block-3 inline-20" />
            <div className="rounded-control bg-surface-muted block-control-sm" />
        </div>
    );
}

export function PipelineBoardSkeleton() {
    return (
        <div className="motion-safe:animate-pulse" aria-busy="true" aria-label="Loading your deals">
            <div className="hidden gap-5 lg:grid lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, column) => (
                    <div
                        key={column}
                        className="flex flex-col gap-3 rounded-card bg-surface-muted/40 p-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="rounded-control bg-surface-muted block-5 inline-24" />
                            <div className="rounded-full bg-surface-muted block-3 inline-3" />
                        </div>
                        <div className="flex flex-col gap-3">
                            {Array.from({ length: column === 0 ? 2 : 1 }).map((__, card) => (
                                <DealCardSkeleton key={card} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
                {Array.from({ length: 3 }).map((_, index) => (
                    <DealCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}
