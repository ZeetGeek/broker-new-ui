import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { HandCoins, Info } from "@/components/shared/icons";

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
            className={cn(styles.commission, className)}
        >
            <div className="flex items-center justify-between gap-3">
                <h2 id="analytics-outcome-heading" className="h5 text-surface">
                    {isClosed ? "Deal commission" : "Potential commission"}
                </h2>
                <HandCoins aria-hidden className="shrink-0 text-brand-soft block-5 inline-5" />
            </div>
            <div className="flex flex-col gap-2">
                <p
                    className={cn(
                        "leading-none wrap-anywhere tabular-nums",
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
                            ? "Estimated from the closed deal"
                            : "Your estimated earnings if this property closes"
                        : "Add a commission when editing this property."}
                </p>
            </div>
            <dl className={styles.commissionFooter}>
                <div className="flex flex-col gap-1 min-inline-0">
                    <dt className="body-sm text-brand-soft">
                        {isClosed ? `${report.closedWord} price` : "Best offer"}
                    </dt>
                    <dd className="body font-semibold wrap-anywhere text-surface tabular-nums">
                        {resultInr != null
                            ? formatSideAmount(resultInr, commission.side)
                            : "No offers yet"}
                    </dd>
                </div>
                <div className="flex flex-col gap-1 min-inline-0">
                    <dt className="body-sm text-brand-soft">Time on market</dt>
                    <dd className="body font-semibold text-surface tabular-nums">{daysLabel}</dd>
                </div>
            </dl>
            {resultPercent != null ? (
                <p className="body-sm text-brand-soft">
                    {isClosed ? "Closed price" : "Best offer"} is {resultPercent}% of asking
                </p>
            ) : null}
            <p className="body-xs flex items-start gap-1.5 text-brand-soft">
                <Info aria-hidden className="mbs-0.5 shrink-0 block-3.5 inline-3.5" />
                {commission.amountInr == null
                    ? "Excluded from earnings totals until commission is set."
                    : isClosed
                      ? "An estimate, not a record of payment received."
                      : "Based on the current asking price. Not earned yet."}
            </p>
        </section>
    );
}
