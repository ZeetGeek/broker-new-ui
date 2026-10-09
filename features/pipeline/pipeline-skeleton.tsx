function DealCardSkeleton() {
    return (
        <div
            className="flex flex-col overflow-hidden rounded-card bg-surface shadow-md"
            aria-hidden
        >
            <div className="flex flex-col gap-2.5 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                        <div className="rounded-full bg-surface-muted block-5 inline-16" />
                        <div className="rounded-full bg-surface-muted block-5 inline-14" />
                    </div>
                    <div className="rounded-full bg-surface-muted block-control-sm inline-control-sm" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-[8px] bg-surface-muted aspect-square inline-24" />
                    <div className="flex flex-1 flex-col gap-2 min-inline-0">
                        <div className="rounded-sm bg-surface-muted block-5 inline-24" />
                        <div className="rounded-sm bg-surface-muted block-3 inline-32" />
                        <div className="rounded-sm bg-surface-muted block-3 inline-28" />
                        <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                    </div>
                </div>
                <div className="rounded-control bg-surface-muted block-10" />
                <div className="rounded-control bg-surface-muted block-10" />
                <div className="rounded-control bg-surface-muted block-control-lg" />
            </div>
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
