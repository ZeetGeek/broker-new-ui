import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { Info, Wallet } from "@/components/shared/icons";

import { DeltaPill } from "@/features/earnings/earnings-card";
import { type EarningsReport, percentChange } from "@/features/earnings/earnings-math";
import { VIZ_ON_DARK } from "@/features/earnings/earnings-viz";

/**
 * The answer the broker opened the page for. Dark attention card: lime figure,
 * light type, and the sale/rent split in the same hues the charts use.
 */
export function EarningsHero({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { earnedInr, saleEarnedInr, rentEarnedInr, previousEarnedInr, comparison } = report;
    const change = percentChange(earnedInr, previousEarnedInr);
    const salePct = earnedInr > 0 ? Math.round((saleEarnedInr / earnedInr) * 100) : 0;
    const rentPct = earnedInr > 0 ? 100 - salePct : 0;
    // Average per bar on the chart, so "a month" and the bars agree.
    const charted = report.buckets.reduce((sum, b) => sum + b.totalInr, 0);
    const perBucketInr = report.buckets.length > 1 ? charted / report.buckets.length : null;

    const rows = [
        {
            key: "sale",
            label: "Sale",
            color: VIZ_ON_DARK.sale,
            amount: saleEarnedInr,
            pct: salePct,
            count: report.saleClosedCount,
        },
        {
            key: "rent",
            label: "Rent",
            color: VIZ_ON_DARK.rent,
            amount: rentEarnedInr,
            pct: rentPct,
            count: report.rentClosedCount,
        },
    ];

    return (
        <section
            aria-labelledby="earnings-hero-heading"
            className={cn(
                "flex flex-col gap-6 rounded-card bg-brand-deep p-5 text-surface min-inline-0 sm:p-6",
                className,
            )}
        >
            <header className="flex items-center gap-2.5">
                <span
                    aria-hidden
                    className="flex items-center justify-center rounded-inner bg-surface/10 block-8 inline-8"
                >
                    <Wallet className="block-4 inline-4" />
                </span>
                <h2 id="earnings-hero-heading" className="body-sm font-semibold text-surface/80">
                    Estimated earnings
                </h2>
            </header>

            <div className="flex flex-col gap-3">
                <p
                    className={cn(
                        "tabular-nums",
                        earnedInr > 0 ? "display-3 text-highlight" : "h2 text-surface",
                    )}
                >
                    {earnedInr > 0 ? formatCommission(earnedInr) : "Nothing yet"}
                </p>
                {earnedInr > 0 && comparison && previousEarnedInr != null ? (
                    change != null ? (
                        <DeltaPill
                            tone="dark"
                            percent={change}
                            label={`vs ${comparison.phrase} (${formatCommission(previousEarnedInr, true)})`}
                        />
                    ) : (
                        <p className="body-sm text-surface/75">
                            Nothing earned in {comparison.phrase}
                        </p>
                    )
                ) : null}
                {earnedInr > 0 && perBucketInr ? (
                    <p className="body-sm text-surface/75">
                        About{" "}
                        <strong className="font-semibold text-surface tabular-nums">
                            {formatCommission(perBucketInr)}
                        </strong>{" "}
                        a {report.bucketUnit === "week" ? "week" : "month"} on average
                    </p>
                ) : null}
                {earnedInr === 0 ? (
                    <p className="body-sm text-surface/75 max-inline-xs">
                        Mark a deal as sold in your pipeline and its commission shows up here.
                    </p>
                ) : null}
            </div>

            {earnedInr > 0 ? (
                <div className="mbs-auto flex flex-col gap-4">
                    <div
                        role="img"
                        aria-label={`Sale ${salePct}%, rent ${rentPct}%`}
                        className="flex gap-1 block-2.5"
                    >
                        {rows.map((row) =>
                            row.pct > 0 ? (
                                <span
                                    key={row.key}
                                    className="block rounded-full"
                                    style={{
                                        inlineSize: `${row.pct}%`,
                                        backgroundColor: row.color,
                                    }}
                                />
                            ) : null,
                        )}
                    </div>
                    <dl className="grid grid-cols-2 gap-3">
                        {rows.map((row) => (
                            <div
                                key={row.key}
                                className="flex flex-col gap-1 not-first:border-s not-first:border-surface/15 not-first:ps-3"
                            >
                                <dt className="body-xs flex items-center gap-1.5 font-medium text-surface/75">
                                    <span
                                        aria-hidden
                                        className="rounded-full block-2 inline-2"
                                        style={{ backgroundColor: row.color }}
                                    />
                                    {row.label} · {row.pct}%
                                </dt>
                                <dd className="h5 text-surface tabular-nums">
                                    {formatCommission(row.amount, true)}
                                </dd>
                                <dd className="body-xs text-surface/70">
                                    {row.count > 0 ? plural(row.count, "deal") : "No deals"}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : null}

            {report.unvaluedClosedCount > 0 ? (
                <p className="body-xs flex items-start gap-2 border-bs border-surface/15 pbs-4 text-surface/75">
                    <Info aria-hidden className="mbs-px shrink-0 block-4 inline-4" />
                    <span>
                        {plural(report.unvaluedClosedCount, "sold deal")} had no commission set, so{" "}
                        {report.unvaluedClosedCount === 1 ? "it is" : "they are"} not counted.
                    </span>
                </p>
            ) : null}
        </section>
    );
}
