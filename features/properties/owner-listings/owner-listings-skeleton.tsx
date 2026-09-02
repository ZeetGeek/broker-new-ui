import { PropertyCardSkeleton } from "@/components/shared/property-card-skeleton";

import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";

export function OwnerListingsPageSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <div className="
                  flex items-stretch overflow-hidden rounded-control border border-border-warm
                  bg-surface
                ">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                        <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-16" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-28" />
                    </div>
                    <div className="hidden w-px bg-border-warm md:block" aria-hidden />
                    <div className="hidden min-w-0 flex-1 flex-col gap-2 p-4 md:flex">
                        <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-20" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-16" />
                    </div>
                    <div className="hidden w-px bg-border-warm md:block" aria-hidden />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                        <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-14" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-24" />
                    </div>
                    <div className="hidden w-px bg-border-warm md:block" aria-hidden />
                    <div className="hidden min-w-0 flex-1 flex-col gap-2 p-4 md:flex">
                        <div className="animate-pulse rounded-full bg-surface-muted block-3 inline-10" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-12" />
                    </div>
                    <div className="flex items-center border-is border-border-warm p-2">
                        <div className="animate-pulse rounded-full bg-surface-muted block-10 inline-10" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-2 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="
                                  shrink-0 animate-pulse rounded-full bg-surface-muted block-8 inline-24
                                "
                            />
                        ))}
                    </div>
                    <div className="h-8 w-px bg-border-warm" aria-hidden />
                    <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-20" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-40" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-28" />
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
