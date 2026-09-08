/**
 * Mirrors the real card: avatar with two text lines, a badge row, one meta
 * line, and a divided footer. Matching the shape is what stops the grid
 * jumping when the data lands. See docs/LOADING.md.
 */
function ContactCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4"
            aria-hidden
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="
                      shrink-0 rounded-full bg-surface-muted block-control-md inline-control-md
                    " />
                    <div className="flex flex-col gap-2">
                        <div className="rounded-full bg-surface-muted block-3 inline-24" />
                        <div className="rounded-full bg-surface-muted block-3 inline-20" />
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <div className="rounded-full bg-surface-muted block-6 inline-6" />
                    <div className="rounded-full bg-surface-muted block-6 inline-6" />
                </div>
            </div>

            <div className="flex gap-1.5">
                <div className="rounded-full bg-surface-muted block-5 inline-16" />
                <div className="rounded-full bg-surface-muted block-5 inline-12" />
            </div>

            <div className="rounded-full bg-surface-muted block-3 inline-32" />

            <div className="
              flex items-center justify-between gap-2 border-bs border-border-warm pbs-3
            ">
                <div className="rounded-full bg-surface-muted block-3 inline-28" />
                <div className="rounded-full bg-surface-muted block-3 inline-16" />
            </div>
        </div>
    );
}

export function ContactsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div
            className="
              grid grid-cols-1 gap-3
              motion-safe:animate-pulse
              sm:grid-cols-2
              xl:grid-cols-3
            "
            aria-busy="true"
            aria-label="Loading your contacts"
        >
            {Array.from({ length: count }).map((_, index) => (
                <ContactCardSkeleton key={index} />
            ))}
        </div>
    );
}
