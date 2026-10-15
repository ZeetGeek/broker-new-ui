function BoardCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-2.5 rounded-card border border-border-warm bg-surface p-4"
            aria-hidden
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex gap-1.5">
                    <div className="rounded-full bg-surface-muted block-5 inline-16" />
                    <div className="rounded-full bg-surface-muted block-5 inline-14" />
                </div>
                <div className="rounded-full bg-surface-muted block-7 inline-7" />
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
            <div className="rounded-sm bg-surface-muted block-4 inline-40" />
            <div className="flex flex-col gap-2">
                <div className="rounded-control bg-surface-muted block-12" />
                <div className="rounded-control bg-surface-muted block-12" />
            </div>
            <div className="flex gap-2">
                <div className="flex-1 rounded-control bg-surface-muted block-control-md" />
                <div className="flex-1 rounded-control bg-surface-muted block-control-md" />
            </div>
            <div className="rounded-control bg-surface-muted block-control-md" />
        </div>
    );
}

export function LeadsSkeleton({ layout = "board" }: { layout?: "board" | "list" }) {
    if (layout === "list") {
        return (
            <div
                className="flex flex-col gap-4 motion-safe:animate-pulse lg:grid lg:grid-cols-2"
                aria-busy="true"
                aria-label="Loading your leads"
            >
                {Array.from({ length: 4 }).map((_, index) => (
                    <BoardCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    return (
        <div className="motion-safe:animate-pulse" aria-busy="true" aria-label="Loading your leads">
            <div
                className="
                  hidden items-start gap-3 overflow-hidden md:flex
                  lg:grid lg:grid-cols-4 lg:gap-4
                "
            >
                {Array.from({ length: 4 }).map((_, column) => (
                    <div
                        key={column}
                        className="
                          flex shrink-0 flex-col gap-3 rounded-card border border-border-warm
                          bg-surface-muted/25 p-3 inline-72
                          lg:inline-auto
                        "
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1.5">
                                <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                                <div className="rounded-sm bg-surface-muted block-5 inline-24" />
                            </div>
                            <div className="rounded-full bg-surface-muted block-6 inline-6" />
                        </div>
                        {Array.from({ length: column === 0 ? 2 : 1 }).map((__, card) => (
                            <BoardCardSkeleton key={card} />
                        ))}
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 md:hidden">
                <div className="flex gap-2 overflow-hidden">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="shrink-0 rounded-control bg-surface-muted block-9 inline-24"
                        />
                    ))}
                </div>
                {Array.from({ length: 3 }).map((_, index) => (
                    <BoardCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}
