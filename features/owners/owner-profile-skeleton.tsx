const CARD_SKELETON = "animate-pulse rounded-card border border-border-warm bg-surface";

/** Mirrors the owner profile layout so the page does not jump when data lands. */
export function OwnerProfileSkeleton() {
    return (
        <div className="flex flex-col gap-6 pbe-24 lg:pbe-8" aria-busy aria-label="Loading owner">
            <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-32" />

            <div className={`${CARD_SKELETON} flex items-center gap-4 p-5`}>
                <div className="shrink-0 animate-pulse rounded-full bg-surface-muted block-16 inline-16" />
                <div className="flex flex-1 flex-col gap-2 min-inline-0">
                    <div className="animate-pulse rounded-sm bg-surface-muted block-7 inline-48" />
                    <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-36" />
                </div>
            </div>

            <div className={`${CARD_SKELETON} block-40`} />
            <div className={`${CARD_SKELETON} block-32`} />
        </div>
    );
}
