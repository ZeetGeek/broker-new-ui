import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";

import { EarningsCard, EarningsDealLink } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";

/** Sale vs rent: where the money came from, plus the single best deal. */
export function EarningsSplit({ report }: { report: EarningsReport }) {
    const total = report.saleEarnedInr + report.rentEarnedInr;
    const salePct = total > 0 ? Math.round((report.saleEarnedInr / total) * 100) : 0;
    const rentPct = total > 0 ? 100 - salePct : 0;
    const best = report.bestDeal;

    return (
        <EarningsCard
            title="Sale vs rent"
            titleId="earnings-split-heading"
            description="Where your commission came from"
            className="lg:col-span-4"
        >
            {total === 0 ? (
                <p className="body-sm text-ink-muted">
                    Once you sell a deal with a commission set, the split between sale and rent
                    shows here.
                </p>
            ) : (
                <>
                    <div
                        role="img"
                        aria-label={`Sale ${salePct}%, rent ${rentPct}%`}
                        className="flex overflow-hidden rounded-full bg-surface-muted block-3"
                    >
                        {salePct > 0 ? (
                            <span
                                className="block bg-brand-text"
                                style={{ inlineSize: `${salePct}%` }}
                            />
                        ) : null}
                        {rentPct > 0 ? (
                            <span
                                className="block bg-success-mid"
                                style={{ inlineSize: `${rentPct}%` }}
                            />
                        ) : null}
                    </div>
                    <dl className="flex flex-col gap-4">
                        {[
                            {
                                key: "sale",
                                label: "Sale deals",
                                swatch: "bg-brand-text",
                                amount: report.saleEarnedInr,
                                pct: salePct,
                                count: report.saleClosedCount,
                            },
                            {
                                key: "rent",
                                label: "Rent deals",
                                swatch: "bg-success-mid",
                                amount: report.rentEarnedInr,
                                pct: rentPct,
                                count: report.rentClosedCount,
                            },
                        ].map((row) => (
                            <div key={row.key} className="flex items-start justify-between gap-4">
                                <dt className="flex flex-col gap-0.5">
                                    <span className="body-sm flex items-center gap-2 font-medium text-ink">
                                        <span
                                            aria-hidden
                                            className={`rounded-full block-2 inline-2 ${row.swatch}`}
                                        />
                                        {row.label}
                                    </span>
                                    <span className="ps-4 text-xs text-ink-muted">
                                        {row.count > 0 ? plural(row.count, "deal") : "No deals"}
                                    </span>
                                </dt>
                                <dd className="flex flex-col items-end gap-0.5">
                                    <span className="body font-semibold text-ink tabular-nums">
                                        {formatCommission(row.amount)}
                                    </span>
                                    <span className="text-xs text-ink-muted tabular-nums">
                                        {row.pct}%
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="text-xs text-ink-muted">
                        Rent commission is the one-time brokerage the owner set, not monthly rent.
                    </p>
                </>
            )}
            {best && best.commissionInr != null ? (
                <div className="mbs-auto flex flex-col gap-1 rounded-control bg-surface-muted/70 p-4">
                    <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                        Best deal this period
                    </p>
                    <EarningsDealLink
                        dealId={best.deal.id}
                        className="body-sm font-medium text-ink"
                    >
                        {best.deal.property.title}
                    </EarningsDealLink>
                    <p className="body-sm text-ink-muted">
                        {best.deal.buyer.name} ·{" "}
                        <strong className="font-semibold text-brand-text tabular-nums">
                            {formatCommission(best.commissionInr)}
                        </strong>
                    </p>
                </div>
            ) : null}
        </EarningsCard>
    );
}
