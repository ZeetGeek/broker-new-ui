"use client";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { EarningsChart } from "@/features/referrals/earnings-chart";
import {
    LISTING_COST_CREDITS,
    type ReferralEarningsPoint,
    type ReferralsSummary,
} from "@/features/referrals/types";

type EarningsCardProps = {
    summary: ReferralsSummary | null;
    earnings: ReferralEarningsPoint[] | null;
    className?: string;
};

/**
 * One stat, spelled out. A bare number with a one-word label makes the reader
 * guess; the label says what was counted and the number stays the loud part.
 */
function Stat({
    value,
    label,
    hint,
    tone = "default",
}: {
    value: string;
    label: string;
    /** Tooltip for a label that cannot say everything in three words. */
    hint?: string;
    tone?: "default" | "brand";
}) {
    const body = (
        <div className="flex flex-col gap-0.5">
            <span className={cn("h4 tabular", tone === "brand" ? "text-brand" : "text-ink")}>
                {value}
            </span>
            <span className="body-xs text-ink-muted">{label}</span>
        </div>
    );

    if (!hint) return body;

    return (
        <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>{body}</TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
    );
}

/**
 * The wallet: what is in it, what it has earned over time, and what it is
 * worth.
 *
 * There is no progress bar here, and that is the point. Every qualified
 * referral pays the same flat amount with nothing to unlock first, so a bar
 * filling toward a threshold would invent a gate the programme does not have.
 * The chart shows what the broker actually earned instead.
 */
export function EarningsCard({ summary, earnings, className }: EarningsCardProps) {
    if (!summary) {
        return (
            <section
                className={cn(
                    `
                      flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
                      sm:p-5
                    `,
                    className,
                )}
                aria-busy
                aria-label="Loading your credits"
            >
                <span className="animate-pulse rounded-full bg-surface-muted block-9 inline-32" />
                <span className="animate-pulse rounded-inner bg-surface-muted block-40" />
                <span className="animate-pulse rounded-full bg-surface-muted block-8 inline-52" />
            </section>
        );
    }

    /** Whole listings the balance covers. The only thing credits buy today. */
    const listingsAffordable = Math.floor(summary.creditBalance / LISTING_COST_CREDITS);

    return (
        <section
            className={cn(
                "flex flex-col gap-5 rounded-card border border-border-warm bg-surface p-4 sm:p-5",
                className,
            )}
            aria-labelledby="referral-earnings-heading"
        >
            <div className="flex flex-col gap-1">
                <h2 id="referral-earnings-heading" className="eyebrow">
                    Credit balance
                </h2>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="h2 tabular text-ink">{summary.creditBalance}</span>
                    <span className="body-sm text-ink-muted">
                        {/* Says what the number is *for*. A balance with no
                            purchasing power stated is a number, not a balance. */}
                        {listingsAffordable > 0
                            ? `enough for ${listingsAffordable} more ${listingsAffordable === 1 ? "listing" : "listings"}`
                            : `a listing costs ${LISTING_COST_CREDITS}`}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 border-bs border-border-warm pbs-4">
                <h3 className="body-sm font-semibold text-ink">Credits earned each month</h3>
                <EarningsChart earnings={earnings} />
            </div>

            <div className="grid grid-cols-3 gap-3 border-bs border-border-warm pbs-4">
                <Stat
                    value={String(summary.qualifiedCount)}
                    label="qualified"
                    hint="Signed up and completed the step their side qualifies on."
                    tone="brand"
                />
                <Stat
                    value={String(summary.creditsEarnedTotal)}
                    label="credits earned"
                    hint="Everything you have ever earned, before anything you spent."
                />
                <Stat
                    // A rate over no invites is not zero — it does not exist.
                    value={summary.conversionPct === null ? "—" : `${summary.conversionPct}%`}
                    label="of invites qualify"
                />
            </div>
        </section>
    );
}
