import { formatCommission } from "@/lib/format/commission";
import { formatDateIso, formatDateTile } from "@/lib/format/date";
import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Award } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";

import { DealKind, EarningsCard, EarningsDealLink } from "@/features/earnings/earnings-card";
import { dealBaseAmountInr, type EarningsReport } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { isLiveStage } from "@/features/pipeline/types";

/**
 * Biggest open deals as a bar list: a slim violet bar under each row shows its
 * commission against the biggest one, so size reads before the numbers do.
 */
export function EarningsOpenDeals({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const deals = report.live.topDeals;
    const max = Math.max(1, ...deals.map((d) => d.commissionInr ?? 0));

    return (
        <EarningsCard
            title="Biggest open deals"
            titleId="earnings-top-heading"
            description="Most commission still to win"
            className={className}
        >
            {deals.length === 0 ? (
                <p className="body-sm text-ink-muted">
                    None of your open deals has a commission set yet.
                </p>
            ) : (
                <ol className="flex flex-col divide-y divide-border-warm">
                    {deals.map(({ deal, commissionInr }) => {
                        const stage = isLiveStage(deal.status)
                            ? DEAL_STAGE_META[deal.status]
                            : null;
                        const pct = ((commissionInr ?? 0) / max) * 100;
                        return (
                            <li
                                key={deal.id}
                                className="flex flex-col gap-2.5 py-3 first:pbs-0 last:pbe-0"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col gap-1 min-inline-0">
                                        <EarningsDealLink
                                            dealId={deal.id}
                                            className="body-sm font-semibold wrap-anywhere text-ink"
                                        >
                                            {deal.property.title}
                                        </EarningsDealLink>
                                        <p className="body-xs flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
                                            <span>{deal.buyer.name}</span>
                                            <span aria-hidden>·</span>
                                            <DealKind isRent={deal.property.isRent} />
                                            {stage ? (
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 font-medium",
                                                        stage.pillClass,
                                                    )}
                                                >
                                                    {stage.label}
                                                </span>
                                            ) : null}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                                        <span className="body-sm font-semibold text-ink tabular-nums">
                                            {formatCommission(commissionInr ?? 0)}
                                        </span>
                                        <PriceWithCommission
                                            size="xs"
                                            audience="broker"
                                            amountInr={deal.property.amountInr}
                                            isRent={deal.property.isRent}
                                            commissionPercent={deal.property.commissionPercent}
                                            commissionAmountInr={deal.property.commissionAmountInr}
                                            className="text-ink-muted"
                                        />
                                    </div>
                                </div>
                                <span
                                    aria-hidden
                                    className="block overflow-hidden rounded-full bg-chart-2/10 block-1.5"
                                >
                                    <span
                                        className="block rounded-full bg-chart-2 block-full"
                                        style={{ inlineSize: `${Math.max(pct, 3)}%` }}
                                    />
                                </span>
                            </li>
                        );
                    })}
                </ol>
            )}
        </EarningsCard>
    );
}

/** Latest sold deals, each led by a small calendar tile. */
export function EarningsRecentSold({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const best = report.bestDeal;

    return (
        <EarningsCard
            title="Recently sold"
            titleId="earnings-recent-heading"
            description="Your latest closed deals in this period"
            className={className}
        >
            {best && best.commissionInr != null && report.closedCount > 1 ? (
                <div className="flex items-center gap-3 rounded-inner bg-chart-4/10 p-3">
                    <span
                        aria-hidden
                        className="flex shrink-0 items-center justify-center rounded-inner bg-surface text-chart-4 block-9 inline-9"
                    >
                        <Award className="block-4.5 inline-4.5" />
                    </span>
                    <div className="flex flex-col gap-0.5 min-inline-0">
                        <p className="body-xs font-semibold text-brand-text">
                            Best deal this period
                        </p>
                        <EarningsDealLink
                            dealId={best.deal.id}
                            className="body-sm font-medium wrap-anywhere text-ink"
                        >
                            {best.deal.property.title}
                        </EarningsDealLink>
                    </div>
                    <span className="h6 ms-auto shrink-0 text-ink tabular-nums">
                        {formatCommission(best.commissionInr)}
                    </span>
                </div>
            ) : null}

            {report.recentClosed.length === 0 ? (
                <p className="body-sm text-ink-muted">
                    No deals sold in this period. Try a longer period.
                </p>
            ) : (
                <ul className="flex flex-col divide-y divide-border-warm">
                    {report.recentClosed.map(({ deal, commissionInr }) => {
                        const soldAt = deal.resolvedAt ? new Date(deal.resolvedAt) : null;
                        const tile = soldAt ? formatDateTile(soldAt) : null;
                        const base = dealBaseAmountInr(deal);
                        return (
                            <li
                                key={deal.id}
                                className="flex items-center gap-3 py-3 first:pbs-0 last:pbe-0"
                            >
                                {soldAt && tile ? (
                                    <time
                                        dateTime={formatDateIso(soldAt)}
                                        className="flex shrink-0 flex-col items-center justify-center rounded-inner bg-surface-muted leading-none block-11 inline-11"
                                    >
                                        <span className="body-xs font-medium text-ink-muted">
                                            {tile.month}
                                        </span>
                                        <span className="body font-semibold text-ink tabular-nums">
                                            {tile.day}
                                        </span>
                                    </time>
                                ) : null}
                                <div className="flex flex-col gap-1 min-inline-0">
                                    <EarningsDealLink
                                        dealId={deal.id}
                                        className="body-sm font-semibold wrap-anywhere text-ink"
                                    >
                                        {deal.property.title}
                                    </EarningsDealLink>
                                    <p className="body-xs flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
                                        <span>{deal.buyer.name}</span>
                                        <span aria-hidden>·</span>
                                        <DealKind isRent={deal.property.isRent} />
                                    </p>
                                </div>
                                <div className="ms-auto flex shrink-0 flex-col items-end gap-0.5">
                                    <span
                                        className={cn(
                                            "body-sm font-semibold tabular-nums",
                                            commissionInr != null ? "text-ink" : "text-ink-muted",
                                        )}
                                    >
                                        {commissionInr != null
                                            ? formatCommission(commissionInr)
                                            : "No commission set"}
                                    </span>
                                    <span className="body-xs text-ink-muted tabular-nums">
                                        on{" "}
                                        {deal.property.isRent
                                            ? formatRent(base)
                                            : formatPrice(base)}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </EarningsCard>
    );
}
