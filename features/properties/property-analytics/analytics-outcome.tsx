import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { CircleCheck, HandCoins, Info } from "@/components/shared/icons";

import { formatSideAmount } from "@/features/properties/property-analytics/analytics-labels";
import type { PropertyReport } from "@/features/properties/property-analytics/analytics-math";
import type { MyListingItem } from "@/features/properties/your-listings/types";

type ListingCommission = Pick<
    MyListingItem,
    "commissionAmount" | "commissionPercent" | "transactionType"
>;

function estimatedCommission(
    listing: ListingCommission,
    report: PropertyReport,
): { amountInr: number | null; side: "sale" | "rent"; baseInr: number | null } {
    const referenceClient =
        report.clients.find((client) => client.group === "won") ?? report.offers.best;
    const side = referenceClient?.side ?? (listing.transactionType === "rent" ? "rent" : "sale");
    const baseInr = report.closedInr ?? (side === "rent" ? report.ask.rentInr : report.ask.saleInr);

    if (side === "rent") {
        const amount = listing.commissionAmount ?? 0;
        return { amountInr: amount > 0 ? Math.round(amount) : null, side, baseInr };
    }

    const percent = listing.commissionPercent ?? 0;
    return {
        amountInr: percent > 0 && baseInr != null ? Math.round((baseInr * percent) / 100) : null,
        side,
        baseInr,
    };
}

/** The listing's commercial result, using the same commission logic as Earnings. */
export function AnalyticsOutcome({
    report,
    listing,
    className,
}: {
    report: PropertyReport;
    listing: ListingCommission;
    className?: string;
}) {
    const commission = estimatedCommission(listing, report);
    const isClosed = report.counts.won > 0;
    const bestOffer = report.offers.best?.offer ?? null;
    const resultInr = report.closedInr ?? bestOffer?.amountInr ?? null;
    const askInr = commission.side === "rent" ? report.ask.rentInr : report.ask.saleInr;
    const resultShare =
        resultInr != null && askInr != null && askInr > 0 ? resultInr / askInr : null;
    const resultPercent = resultShare == null ? null : Math.round(resultShare * 100);
    const daysLabel =
        report.daysListed == null
            ? "Not available"
            : report.daysListed === 0
              ? "Listed today"
              : plural(report.daysListed, "day");

    return (
        <section
            aria-labelledby="analytics-outcome-heading"
            className={cn(
                "flex flex-col justify-between gap-6 rounded-card bg-brand-deep p-5 text-surface min-inline-0 sm:p-6",
                className,
            )}
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 id="analytics-outcome-heading" className="h5 text-surface">
                            {isClosed ? "Deal result" : "Commission opportunity"}
                        </h2>
                        <p className="body-sm text-brand-soft">
                            {isClosed
                                ? `Based on the ${report.closedWord.toLowerCase()} price`
                                : "Based on the current asking price"}
                        </p>
                    </div>
                    <span className="flex shrink-0 items-center justify-center rounded-inner bg-surface/10 block-11 inline-11">
                        {isClosed ? (
                            <CircleCheck aria-hidden className="block-5 inline-5" />
                        ) : (
                            <HandCoins aria-hidden className="block-5 inline-5" />
                        )}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <p
                        className={cn(
                            "leading-none tabular-nums",
                            commission.amountInr != null ? "h1 text-highlight" : "h3 text-surface",
                        )}
                    >
                        {commission.amountInr != null
                            ? formatCommission(commission.amountInr)
                            : "Commission not set"}
                    </p>
                    <p className="body-sm text-brand-soft">
                        {commission.amountInr != null
                            ? isClosed
                                ? "Estimated commission from this deal"
                                : "Possible commission if this property closes"
                            : "Add commission while editing the property to value this opportunity."}
                    </p>
                </div>

                {resultPercent != null ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="body-xs font-medium text-brand-soft">
                                {isClosed ? "Closed price vs asking" : "Best offer vs asking"}
                            </span>
                            <span className="body-sm font-semibold text-surface tabular-nums">
                                {resultPercent}%
                            </span>
                        </div>
                        <span
                            aria-hidden
                            className="block overflow-hidden rounded-full bg-surface/12 block-2.5"
                        >
                            <span
                                className="block rounded-full bg-surface/80 block-full"
                                style={{ inlineSize: `${Math.min(100, resultPercent)}%` }}
                            />
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 border-bs border-surface/15 pbs-5">
                <div className="flex flex-col gap-1 min-inline-0">
                    <span className="body-xs text-brand-soft">
                        {isClosed ? `${report.closedWord} price` : "Best offer"}
                    </span>
                    <strong className="h5 truncate text-surface tabular-nums">
                        {resultInr != null
                            ? formatSideAmount(resultInr, commission.side)
                            : "None yet"}
                    </strong>
                </div>
                <div className="flex flex-col gap-1 border-s border-surface/15 ps-4 min-inline-0">
                    <span className="body-xs text-brand-soft">Time on market</span>
                    <strong className="h5 text-surface tabular-nums">{daysLabel}</strong>
                </div>
                {commission.amountInr == null ? (
                    <p className="body-xs col-span-2 flex items-start gap-2 text-brand-soft">
                        <Info aria-hidden className="mbs-px shrink-0 block-4 inline-4" />
                        This deal is excluded from earnings totals until a commission is set.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
