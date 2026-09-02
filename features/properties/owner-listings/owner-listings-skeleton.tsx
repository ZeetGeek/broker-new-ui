import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";

export function OwnerListingsPageSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-card border border-border-warm bg-surface p-2 shadow-sm">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
                        <div className="flex min-w-0 min-inline-40 flex-1 items-center gap-2.5 rounded-inner p-0.5 px-3.5 py-2.5">
                            <div className="animate-pulse shrink-0 rounded-full bg-surface-muted block-4 inline-4" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-16" />
                                <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-28" />
                            </div>
                        </div>
                        <div className="my-auto hidden block-7 w-px shrink-0 bg-border-warm/80 md:block" aria-hidden />
                        <div className="hidden min-w-0 min-inline-36 flex-1 items-center gap-2.5 rounded-inner p-0.5 px-3.5 py-2.5 md:flex">
                            <div className="animate-pulse shrink-0 rounded-full bg-surface-muted block-4 inline-4" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-20" />
                                <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-16" />
                            </div>
                        </div>
                        <div className="my-auto hidden block-7 w-px shrink-0 bg-border-warm/80 md:block" aria-hidden />
                        <div className="flex min-w-0 min-inline-36 flex-1 flex-col gap-1.5 rounded-inner px-4 py-2.5">
                            <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-14" />
                            <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-24" />
                        </div>
                        <div className="my-auto hidden block-7 w-px shrink-0 bg-border-warm/80 md:block" aria-hidden />
                        <div className="hidden min-w-0 min-inline-32 flex-1 items-center gap-2.5 rounded-inner p-0.5 px-3.5 py-2.5 md:flex">
                            <div className="animate-pulse shrink-0 rounded-full bg-surface-muted block-4 inline-4" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-10" />
                                <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-12" />
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center pe-1">
                        <div className="animate-pulse rounded-full bg-surface-muted block-10 inline-10" />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-2.5 overflow-hidden">
                        <div className="animate-pulse rounded-full bg-surface shadow-sm block-9 inline-28 shrink-0" />
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="animate-pulse rounded-full bg-surface shadow-sm block-9 inline-32 shrink-0"
                            />
                        ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                        <div className="animate-pulse rounded-full bg-surface shadow-sm block-9 inline-16" />
                        <div className="animate-pulse rounded-full bg-surface shadow-sm block-9 inline-28 shrink-0" />
                    </div>
                </div>
            </div>

            <div className={OWNER_LISTINGS_GRID_CLASS}>
                {Array.from({ length: 10 }).map((_, index) => (
                    <PropertyCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
}
