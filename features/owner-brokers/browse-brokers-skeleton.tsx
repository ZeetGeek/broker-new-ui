function CardSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4 shadow-md"
            aria-hidden
        >
            <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-surface-muted block-10 inline-10" />
                <div className="flex flex-col gap-2">
                    <div className="rounded-sm bg-surface-muted block-3.5 inline-20" />
                    <div className="rounded-sm bg-surface-muted block-2.5 inline-28" />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="rounded-sm bg-surface-muted block-5 inline-24" />
                <div className="rounded-sm bg-surface-muted block-3 inline-36" />
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2">
                <div className="rounded-control bg-surface-muted block-10" />
                <div className="rounded-control bg-surface-muted block-10" />
            </div>
        </div>
    );
}

/** Match Contacts grid: 1 → 2 → 3 → 4 → 5 columns. */
export const OWNER_BROKERS_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

export function browseBrokersGridClass(): string {
    return `
      grid grid-cols-1 gap-6 motion-safe:animate-pulse
      sm:grid-cols-2
      md:grid-cols-3
      lg:grid-cols-4
      xl:grid-cols-5
    `;
}

export function BrowseBrokersSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Loading brokers"
            className={browseBrokersGridClass()}
        >
            {Array.from({ length: count }).map((_, index) => (
                <CardSkeleton key={index} />
            ))}
        </div>
    );
}
