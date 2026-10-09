function ContactCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4 shadow-md"
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

            <div className="mt-auto flex flex-col gap-2.5 border-bs border-border-warm pbs-3">
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
    void variant;
    return (
        <div
            className="
              grid grid-cols-1 gap-6 motion-safe:animate-pulse
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
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
