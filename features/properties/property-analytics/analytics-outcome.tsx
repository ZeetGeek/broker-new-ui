import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { HandCoins, Info } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";

import { formatSideAmount } from "@/features/properties/property-analytics/analytics-labels";
import type { PropertyReport } from "@/features/properties/property-analytics/analytics-math";
import type { MyListingItem } from "@/features/properties/your-listings/types";

import styles from "./analytics.module.css";

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
    // A closed deal keeps the commission locked at close, as Earnings does, even if
    // the listing's commission was edited afterwards.
    if (report.counts.won > 0 && report.closedCommissionInr != null) {
        return { amountInr: Math.round(report.closedCommissionInr), side, baseInr };
    }

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
    const commissionIsSet =
        commission.side === "rent"
            ? (listing.commissionAmount ?? 0) > 0
            : (listing.commissionPercent ?? 0) > 0;
    const usesClosedPrice = report.closedInr != null;
    const bestOffer = report.offers.best?.offer ?? null;
    const resultInr = isClosed ? report.closedInr : (bestOffer?.amountInr ?? null);
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
            className={cn(styles.commission, className)}
        >
            <div className="flex items-start justify-between gap-3">
                <h2 id="analytics-outcome-heading" className="h5 text-surface">
                    {isClosed ? "Deal commission" : "Estimated commission"}
                </h2>
                <HandCoins aria-hidden className="shrink-0 text-brand-soft block-5 inline-5" />
            </div>
            <div className={styles.commissionEstimate}>
                <p
                    className={cn(
                        "wrap-anywhere tabular-nums",
                        commission.amountInr != null ? "h1 text-highlight" : "h3 text-surface",
                    )}
                >
                    {commission.amountInr != null
                        ? formatCommission(commission.amountInr)
                        : commissionIsSet
                          ? "Estimate unavailable"
                          : "Commission not set"}
                </p>
                {commissionIsSet ? (
                    commission.side === "rent" ? (
                        <p className="body-sm text-brand-soft">Fixed rental commission</p>
                    ) : (
                        <div className={cn("body-sm text-brand-soft", styles.commissionBasis)}>
                            <span>
                                {listing.commissionPercent}% of{" "}
                                {usesClosedPrice ? "the closed price" : "the asking price"}
                            </span>
                            {commission.baseInr != null ? (
                                usesClosedPrice ? (
                                    <span className="font-semibold text-surface tabular-nums">
                                        {formatSideAmount(commission.baseInr, commission.side)}
                                    </span>
                                ) : (
                                    <PriceWithCommission
                                        amountInr={commission.baseInr}
                                        commissionPercent={listing.commissionPercent}
                                        audience="broker"
                                        size="sm"
                                        className="text-surface"
                                        underlineClassName="decoration-brand-soft/60"
                                    />
                                )
                            ) : (
                                <span>Price not available</span>
                            )}
                        </div>
                    )
                ) : (
                    <p className="body-sm text-brand-soft">
                        Add a commission when editing this property.
                    </p>
                )}
            </div>
            <dl className={styles.commissionFooter}>
                <div className="flex flex-col gap-1 min-inline-0">
                    <dt className="body-sm text-brand-soft">
                        {isClosed
                            ? commission.side === "rent"
                                ? "Final monthly rent"
                                : "Closed price"
                            : "Best offer"}
                    </dt>
                    <dd
                        className={cn(
                            "body-sm wrap-anywhere tabular-nums",
                            resultInr != null ? "font-semibold text-surface" : "text-brand-soft",
                        )}
                    >
                        {resultInr != null
                            ? formatSideAmount(resultInr, commission.side)
                            : isClosed
                              ? "Not recorded"
                              : "No offer yet"}
                        {resultPercent != null && (
                            <span className="body-sm block font-normal text-brand-soft">
                                {resultPercent}% of asking price
                            </span>
                        )}
                    </dd>
                </div>
                <div className="flex flex-col gap-1 min-inline-0">
                    <dt className="body-sm text-brand-soft">Time on market</dt>
                    <dd className="body-sm font-semibold text-surface tabular-nums">{daysLabel}</dd>
                </div>
            </dl>
            <p className={cn("body-sm text-brand-soft", styles.commissionNote)}>
                <Info aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                <span>
                    {commission.amountInr == null
                        ? commissionIsSet
                            ? "A price is needed to calculate this estimate."
                            : "Not included in earnings until commission is set."
                        : isClosed
                          ? "This estimate does not confirm payment received."
                          : "Not earned yet. The deal must close first."}
                </span>
            </p>
        </section>
    );
}
