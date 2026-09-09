/**
 * Skeletons mirror the real layout — an avatar, three text lines, an action
 * button — so nothing reflows when the data lands. See docs/LOADING.md.
 */
function ReferralRowSkeleton() {
    return (
        <div className="flex gap-3 border-be border-border-warm px-3 py-3.5 sm:gap-4 sm:px-4">
            <div
                className="
                  shrink-0 rounded-full bg-surface-muted block-control-md inline-control-md
                "
            />

            <div className="flex flex-1 flex-col gap-2 min-inline-0">
                <div className="rounded-full bg-surface-muted block-4 inline-44" />
                <div className="rounded-full bg-surface-muted block-3 inline-56" />
                <div className="rounded-full bg-surface-muted block-3 inline-40" />
            </div>

            <div className="shrink-0 rounded-control bg-surface-muted block-control-sm inline-20" />
        </div>
    );
}

export function ReferralsListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div
            className="overflow-hidden rounded-card border border-border-warm bg-surface"
            aria-busy
            aria-label="Loading the brokers you invited"
        >
            {Array.from({ length: rows }, (_, index) => (
                <ReferralRowSkeleton key={index} />
            ))}
        </div>
    );
}
