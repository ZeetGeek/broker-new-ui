function ContactCardSkeleton({ variant }: { variant: "buyer" | "owner" }) {
    return (
        <div
            className="flex flex-col rounded-card border border-border-warm bg-surface p-4"
            style={{ minHeight: variant === "owner" ? 356 : 292 }}
            aria-hidden
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-[12px] bg-surface-muted block-10 inline-10" />
                    <div className="flex flex-col gap-2">
                        <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                        <div className="rounded-sm bg-surface-muted block-2.5 inline-20" />
                    </div>
                </div>
                <div className="flex gap-1">
                    <div className="rounded-control bg-surface-muted block-7 inline-7" />
                    <div className="rounded-control bg-surface-muted block-7 inline-7" />
                    <div className="rounded-control bg-surface-muted block-7 inline-7" />
                </div>
            </div>

            <div className="mbs-4 flex gap-1.5">
                <div className="rounded-md bg-surface-muted block-6 inline-16" />
                <div className="rounded-md bg-surface-muted block-6 inline-14" />
                <div className="rounded-md bg-surface-muted block-6 inline-20" />
            </div>
            <div className="mbs-3 rounded-sm bg-surface-muted block-3 inline-32" />

            {variant === "owner" ? (
                <div className="mbs-3 aspect-video rounded-inner bg-surface-muted inline-full" />
            ) : (
                <div className="mbs-4 flex items-center">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className="-ms-2.5 first:ms-0 rounded-[12px] bg-surface-muted ring-2 ring-surface block-12 inline-12"
                        />
                    ))}
                </div>
            )}

            <div className="mbs-auto flex items-center justify-between border-bs border-border-warm pbs-3">
                <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                <div className="rounded-sm bg-surface-muted block-5 inline-16" />
            </div>
        </div>
    );
}

export function ContactsSkeleton({
    count = 6,
    variant = "buyer",
}: {
    count?: number;
    variant?: "buyer" | "owner";
}) {
    return (
        <div
            className="grid grid-cols-1 gap-3 motion-safe:animate-pulse sm:grid-cols-2 xl:grid-cols-3"
            aria-busy="true"
            aria-label="Loading your contacts"
        >
            {Array.from({ length: count }).map((_, index) => (
                <ContactCardSkeleton key={index} variant={variant} />
            ))}
        </div>
    );
}
