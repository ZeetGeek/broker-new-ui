function ContactCardSkeleton({ variant }: { variant: "buyer" | "owner" }) {
    if (variant === "buyer") {
        return (
            <div
                className="flex flex-col gap-5 rounded-card border border-border-warm bg-surface p-5 shadow-md min-block-72"
                aria-hidden
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-full bg-surface-muted block-10 inline-10" />
                        <div className="flex flex-col gap-3">
                            <div className="rounded-sm bg-surface-muted block-5 inline-28" />
                            <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                        </div>
                    </div>
                    <div className="rounded-full bg-surface-muted block-8 inline-8" />
                </div>
                <div className="flex flex-col gap-3">
                    <div className="rounded-sm bg-surface-muted block-5 inline-32" />
                    <div className="rounded-sm bg-surface-muted block-3 inline-36" />
                </div>
                <div className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                    <div className="rounded-sm bg-surface-muted block-5 inline-28" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-control bg-surface-muted block-11" />
                        <div className="rounded-control bg-surface-muted block-11" />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div
            className="
              flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4 shadow-md
            "
            aria-hidden
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-full bg-surface-muted block-10 inline-10" />
                    <div className="flex flex-col gap-2">
                        <div className="rounded-sm bg-surface-muted block-3.5 inline-20" />
                        <div className="rounded-sm bg-surface-muted block-2.5 inline-28" />
                    </div>
                </div>
                <div className="rounded-control bg-surface-muted block-7 inline-7" />
            </div>

            <div className="flex flex-col gap-2">
                <div className="rounded-sm bg-surface-muted block-5 inline-24" />
                <div className="rounded-sm bg-surface-muted block-3 inline-36" />
            </div>

            <div className="mbs-auto flex flex-col gap-2.5 border-bs border-border-warm pbs-3">
                <div className="flex justify-between gap-2">
                    <div className="rounded-sm bg-surface-muted block-2.5 inline-20" />
                    <div className="rounded-sm bg-surface-muted block-2.5 inline-14" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-control bg-surface-muted block-10" />
                    <div className="rounded-control bg-surface-muted block-10" />
                </div>
            </div>
        </div>
    );
}

export function ContactsSkeleton({
    count = 10,
    variant = "buyer",
}: {
    count?: number;
    variant?: "buyer" | "owner";
}) {
    return (
        <div
            className="
              grid grid-cols-1 gap-6
              motion-safe:animate-pulse
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
            "
            aria-busy="true"
            aria-label="Loading your clients"
        >
            {Array.from({ length: count }).map((_, index) => (
                <ContactCardSkeleton key={index} variant={variant} />
            ))}
        </div>
    );
}
