import Link from "next/link";

import { formatCommission } from "@/lib/format/commission";
import { formatDateShort } from "@/lib/format/date";
import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { PriceWithCommission } from "@/components/shared/price-with-commission";

import { EarningsCard } from "@/features/earnings/earnings-card";
import {
    dealBaseAmountInr,
    type EarningsReport,
    type ValuedDeal,
} from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { isLiveStage } from "@/features/pipeline/types";

function DealRow({ item, kind }: { item: ValuedDeal; kind: "sold" | "live" }) {
    const { deal, commissionInr } = item;
    const stageMeta = isLiveStage(deal.status)
        ? DEAL_STAGE_META[deal.status as keyof typeof DEAL_STAGE_META]
        : null;

    return (
        <li className="flex items-start justify-between gap-4 py-3 first:pbs-0 last:pbe-0">
            <div className="flex flex-col gap-1 min-inline-0">
                <Link
                    href={`/broker/pipeline/${deal.id}`}
                    className="body-sm truncate font-medium text-ink hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                    {deal.property.title}
                </Link>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                    <span>{deal.buyer.name}</span>
                    <span aria-hidden>·</span>
                    <span>{deal.property.isRent ? "Rent" : "Sale"}</span>
                    {kind === "sold" && deal.resolvedAt ? (
                        <>
                            <span aria-hidden>·</span>
                            <span>Sold {formatDateShort(new Date(deal.resolvedAt))}</span>
                        </>
                    ) : null}
                    {stageMeta ? (
                        <span
                            className={cn(
                                "rounded-full px-2 py-0.5 font-medium",
                                stageMeta.pillClass,
                            )}
                        >
                            {stageMeta.label}
                        </span>
                    ) : null}
                </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                    className={cn(
                        "body-sm font-semibold tabular-nums",
                        commissionInr != null ? "text-brand-text" : "text-ink-muted",
                    )}
                >
                    {commissionInr != null ? formatCommission(commissionInr) : "No commission set"}
                </span>
                {kind === "sold" ? (
                    <span className="text-xs text-ink-muted tabular-nums">
                        on{" "}
                        {deal.property.isRent
                            ? formatRent(dealBaseAmountInr(deal))
                            : formatPrice(dealBaseAmountInr(deal))}
                    </span>
                ) : (
                    <PriceWithCommission
                        size="xs"
                        audience="broker"
                        amountInr={deal.property.amountInr}
                        isRent={deal.property.isRent}
                        commissionPercent={deal.property.commissionPercent}
                        commissionAmountInr={deal.property.commissionAmountInr}
                        className="text-ink-muted"
                    />
                )}
            </div>
        </li>
    );
}

export function EarningsDealLists({ report }: { report: EarningsReport }) {
    return (
        <>
            <EarningsCard
                title="Recently sold"
                titleId="earnings-recent-heading"
                description="Your latest closed deals in this period"
                className="lg:col-span-6"
            >
                {report.recentClosed.length === 0 ? (
                    <p className="body-sm text-ink-muted">
                        No deals sold in this period. Try a longer period above.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {report.recentClosed.map((item) => (
                            <DealRow key={item.deal.id} item={item} kind="sold" />
                        ))}
                    </ul>
                )}
            </EarningsCard>
            <EarningsCard
                title="Biggest open deals"
                titleId="earnings-top-heading"
                description="Open deals with the most commission to win"
                className="lg:col-span-6"
            >
                {report.live.topDeals.length === 0 ? (
                    <p className="body-sm text-ink-muted">
                        None of your open deals has a commission set yet.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {report.live.topDeals.map((item) => (
                            <DealRow key={item.deal.id} item={item} kind="live" />
                        ))}
                    </ul>
                )}
            </EarningsCard>
        </>
    );
}
