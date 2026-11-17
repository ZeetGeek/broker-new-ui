"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { Info } from "@/components/shared/icons";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { DeltaPill } from "@/features/earnings/earnings-card";
import { type EarningsReport, percentChange } from "@/features/earnings/earnings-math";

const SALE_COLOR = "#7dd3fc";
const RENT_COLOR = "#fdba74";

const CHART_CONFIG = {
    amount: { label: "Commission" },
    sale: { label: "Sale", color: SALE_COLOR },
    rent: { label: "Rent", color: RENT_COLOR },
} satisfies ChartConfig;

/**
 * Dark attention card: period total, labelled sale/rent bars, then breakdown.
 * Spacing uses one rhythm (gap-4) so stretched grid height does not leave uneven bands.
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
    const charted = report.buckets.reduce((sum, b) => sum + b.totalInr, 0);
    const perBucketInr = report.buckets.length > 1 ? charted / report.buckets.length : null;
    const avgUnit = report.bucketUnit;

    const rows = [
        {
            key: "sale" as const,
            label: "Sale",
            color: SALE_COLOR,
            amount: saleEarnedInr,
            pct: salePct,
            count: report.saleClosedCount,
        },
        {
            key: "rent" as const,
            label: "Rent",
            color: RENT_COLOR,
            amount: rentEarnedInr,
            pct: rentPct,
            count: report.rentClosedCount,
        },
    ];

    const chartData = rows.map((row) => ({
        kind: row.label,
        key: row.key,
        amount: row.amount,
        pct: row.pct,
        fill: row.color,
    }));

    const hasMix = earnedInr > 0 && rows.some((row) => row.amount > 0);

    return (
        <section
            aria-labelledby="earnings-hero-heading"
            className={cn(
                `
                  flex flex-col justify-center gap-4 rounded-card p-5 text-surface
                  block-full min-inline-0 sm:gap-5 sm:p-6
                  bg-linear-to-br from-[#1b7a5a] to-[#16664d]
                  shadow-[0_4px_12px_rgb(16_59_45/0.12)]
                `,
                className,
            )}
        >
            <div className="flex flex-col gap-2.5 min-inline-0">
                <h2 id="earnings-hero-heading" className="sr-only">
                    Estimated earnings
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-inline-0">
                    <p
                        className={cn(
                            "tabular-nums leading-none",
                            earnedInr > 0 ? "display-3 text-highlight" : "h2 text-surface",
                        )}
                    >
                        {earnedInr > 0 ? formatCommission(earnedInr) : "Nothing yet"}
                    </p>

                    {earnedInr > 0 && perBucketInr ? (
                        <>
                            <span
                                aria-hidden
                                className="
                                  self-stretch min-block-8 inline-px
                                  bg-[color-mix(in_srgb,var(--color-brand-soft)_40%,transparent)]
                                "
                            />
                            <div className="flex flex-col gap-1 min-inline-0">
                                <p className="body-xs font-medium text-brand-soft">About</p>
                                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                    <span className="h4 text-surface tabular-nums leading-none">
                                        {formatCommission(perBucketInr, true)}
                                    </span>
                                    <span className="body-xs text-brand-soft">Avg / {avgUnit}</span>
                                </p>
                            </div>
                        </>
                    ) : null}
                </div>

                {earnedInr > 0 && comparison && previousEarnedInr != null ? (
                    change != null ? (
                        <DeltaPill
                            tone="dark"
                            percent={change}
                            label={`vs ${comparison.phrase} (${formatCommission(previousEarnedInr, true)})`}
                        />
                    ) : (
                        <p className="body-sm text-brand-soft">
                            Nothing earned in {comparison.phrase}
                        </p>
                    )
                ) : null}

                {earnedInr === 0 ? (
                    <p className="body-sm text-brand-soft max-inline-xs">
                        Mark a deal as sold in your pipeline and its commission shows up here.
                    </p>
                ) : null}
            </div>

            {hasMix ? (
                <div className="flex flex-col gap-4 min-inline-0">
                    <ChartContainer
                        config={CHART_CONFIG}
                        className="aspect-auto block-28 inline-full sm:block-32"
                        aria-label={`Sale ${salePct}%, rent ${rentPct}%`}
                    >
                        <BarChart
                            accessibilityLayer
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 4, left: 4, right: 40, bottom: 4 }}
                            barCategoryGap="28%"
                        >
                            <XAxis type="number" hide />
                            {/* Category axis kept for layout; ticks hidden — Sale/Rent is in the breakdown. */}
                            <YAxis dataKey="kind" type="category" hide />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        formatter={(value) => (
                                            <span className="font-semibold tabular-nums">
                                                {formatCommission(Number(value))}
                                            </span>
                                        )}
                                    />
                                }
                            />
                            <Bar dataKey="amount" radius={8} isAnimationActive={false}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.key} fill={entry.fill} />
                                ))}
                                <LabelList
                                    dataKey="pct"
                                    position="right"
                                    offset={8}
                                    fontSize={12}
                                    fill="white"
                                    formatter={(value) => `${Number(value)}%`}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>

                    <div
                        aria-hidden
                        className="
                          block-px
                          bg-[color-mix(in_srgb,var(--color-brand-soft)_22%,transparent)]
                        "
                    />

                    <dl className="grid grid-cols-2 gap-4">
                        {rows.map((row) => (
                            <div
                                key={row.key}
                                className="
                                  flex flex-col gap-1
                                  not-first:border-s
                                  not-first:border-[color-mix(in_srgb,var(--color-brand-soft)_18%,transparent)]
                                  not-first:ps-4
                                "
                            >
                                <dt className="body-xs flex items-center gap-1.5 font-medium text-brand-soft">
                                    <span
                                        aria-hidden
                                        className="rounded-full block-2 inline-2"
                                        style={{ backgroundColor: row.color }}
                                    />
                                    {row.label}
                                </dt>
                                <dd className="h5 text-surface tabular-nums">
                                    {formatCommission(row.amount, true)}
                                </dd>
                                <dd>
                                    <span
                                        className="
                                          body-xs inline-flex items-center rounded-full px-2 py-0.5
                                          font-medium text-brand-soft
                                          bg-[color-mix(in_srgb,var(--color-surface)_12%,transparent)]
                                        "
                                    >
                                        {row.count > 0 ? plural(row.count, "deal") : "No deals"}
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : null}

            {report.unvaluedClosedCount > 0 ? (
                <p
                    className="
                      body-xs flex items-start gap-2 text-brand-soft
                      border-bs border-[color-mix(in_srgb,var(--color-brand-soft)_18%,transparent)]
                      pbs-4
                    "
                >
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
