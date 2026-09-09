import { ReferralsListSkeleton } from "@/features/referrals/referrals-skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2" aria-hidden>
                <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-72" />
                <div className="animate-pulse rounded-full bg-surface-muted block-5 inline-56" />
            </div>

            {/* Heights track the real cards — the earnings card carries a
                chart, so it runs taller than the share card beside it. */}
            <div className="grid gap-3 lg:grid-cols-[3fr_2fr] lg:gap-4" aria-hidden>
                <div className="animate-pulse rounded-card bg-brand-deep/90 block-64" />
                <div
                    className="
                      animate-pulse rounded-card border border-border-warm bg-surface block-96
                    "
                />
            </div>

            <ReferralsListSkeleton />
        </div>
    );
}
