"use client";

import { useState } from "react";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatCommission } from "@/lib/format/commission";

import { TextSegmentedToggle } from "@/components/shared/text-segmented-toggle";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";

type TrendView = "money" | "deals";

const VIEW_OPTIONS = [
    { value: "money", label: "Earnings" },
    { value: "deals", label: "Sold vs lost" },
] as const;

const MONEY_CONFIG = {
    saleInr: { label: "Sale commission", color: "var(--color-brand-text)" },
    rentInr: { label: "Rent commission", color: "var(--color-success-mid)" },
} satisfies ChartConfig;

const DEALS_CONFIG = {
    closed: { label: "Sold", color: "var(--color-success-mid)" },
    lost: { label: "Lost", color: "var(--color-ink-subtle)" },
} satisfies ChartConfig;

export function EarningsTrendChart({ report }: { report: EarningsReport }) {
    const [view, setView] = useState<TrendView>("money");
    const { buckets, bucketUnit } = report;
    const unitWord = bucketUnit === "week" ? "week" : "month";
    const hasMoney = buckets.some((b) => b.totalInr > 0);
    const hasDeals = buckets.some((b) => b.closed > 0 || b.lost > 0);
    const isEmpty = view === "money" ? !hasMoney : !hasDeals;
    const many = buckets.length > 14;

    return (
        <EarningsCard
            title={view === "money" ? `Earnings by ${unitWord}` : `Sold and lost by ${unitWord}`}
            titleId="earnings-trend-heading"
            description={
                view === "money"
                    ? "Estimated commission, split by sale and rent deals"
                    : "How many deals you finished, and how many fell through"
            }
            action={
                <TextSegmentedToggle
                    size="sm"
                    value={view}
                    onValueChange={setView}
                    options={VIEW_OPTIONS}
                    ariaLabel="Chart view"
                />
            }
            className="lg:col-span-8"
        >
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-1 rounded-control bg-surface-muted/60 px-6 py-12 text-center">
                    <p className="body font-medium text-ink">
                        {view === "money"
                            ? "No commission in this period"
                            : "No finished deals in this period"}
                    </p>
                    <p className="body-sm text-ink-muted">
                        Try a longer period, or mark a deal as sold in your pipeline.
                    </p>
                </div>
            ) : (
                <ChartContainer
                    key={view}
                    config={view === "money" ? MONEY_CONFIG : DEALS_CONFIG}
                    className="aspect-auto block-72 inline-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={buckets}
                        margin={{ top: 8, left: 0, right: 4 }}
                        barCategoryGap={many ? "18%" : "28%"}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                            minTickGap={8}
                            tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={view === "money" ? 56 : 28}
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                            tickFormatter={(v: number) =>
                                view === "money" ? formatCommission(v, true) : String(v)
                            }
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--color-brand-soft)", radius: 8 }}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const bucket = payload?.[0]?.payload as
                                            (typeof buckets)[number] | undefined;
                                        if (!bucket) return "";
                                        return `${bucket.longLabel}${bucket.isToDate ? " (so far)" : ""}`;
                                    }}
                                    formatter={(value, name) => (
                                        <div className="flex flex-1 items-center justify-between gap-4">
                                            <span className="text-ink-muted">
                                                {view === "money"
                                                    ? MONEY_CONFIG[
                                                          name as keyof typeof MONEY_CONFIG
                                                      ]?.label
                                                    : DEALS_CONFIG[
                                                          name as keyof typeof DEALS_CONFIG
                                                      ]?.label}
                                            </span>
                                            <strong className="font-semibold text-ink tabular-nums">
                                                {view === "money"
                                                    ? formatCommission(Number(value))
                                                    : Number(value)}
                                            </strong>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {view === "money" ? (
                            <>
                                <Bar
                                    dataKey="saleInr"
                                    stackId="money"
                                    fill="var(--color-saleInr)"
                                    radius={[0, 0, 6, 6]}
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="rentInr"
                                    stackId="money"
                                    fill="var(--color-rentInr)"
                                    radius={[6, 6, 0, 0]}
                                    isAnimationActive={false}
                                />
                            </>
                        ) : (
                            <>
                                <Bar
                                    dataKey="closed"
                                    fill="var(--color-closed)"
                                    radius={[6, 6, 0, 0]}
                                    isAnimationActive={false}
                                />
                                <Bar
                                    dataKey="lost"
                                    fill="var(--color-lost)"
                                    radius={[6, 6, 0, 0]}
                                    isAnimationActive={false}
                                />
                            </>
                        )}
                    </BarChart>
                </ChartContainer>
            )}
            <table className="sr-only">
                <caption>
                    {view === "money" ? "Estimated commission" : "Deals sold and lost"} by{" "}
                    {unitWord}
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Period</th>
                        <th scope="col">Sale commission</th>
                        <th scope="col">Rent commission</th>
                        <th scope="col">Sold</th>
                        <th scope="col">Lost</th>
                    </tr>
                </thead>
                <tbody>
                    {buckets.map((b) => (
                        <tr key={b.key}>
                            <th scope="row">{b.longLabel}</th>
                            <td>{formatCommission(b.saleInr)}</td>
                            <td>{formatCommission(b.rentInr)}</td>
                            <td>{b.closed}</td>
                            <td>{b.lost}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </EarningsCard>
    );
}
