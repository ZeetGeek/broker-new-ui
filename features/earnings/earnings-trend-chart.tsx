"use client";

import { useState } from "react";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { formatCommission, formatCommissionTick } from "@/lib/format/commission";

import { TextSegmentedToggle } from "@/components/shared/text-segmented-toggle";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import {
    type EarningsBucket,
    type EarningsReport,
    formatWindow,
} from "@/features/earnings/earnings-math";
import { VIZ } from "@/features/earnings/earnings-viz";

type TrendView = "money" | "deals";

const VIEW_OPTIONS = [
    { value: "money", label: "Commission" },
    { value: "deals", label: "Sold vs lost" },
] as const;

const MONEY_CONFIG = {
    saleInr: { label: "Sale", color: VIZ.sale },
    rentInr: { label: "Rent", color: VIZ.rent },
} satisfies ChartConfig;

const DEALS_CONFIG = {
    closed: { label: "Sold", color: VIZ.sold },
    lost: { label: "Lost", color: VIZ.lost },
} satisfies ChartConfig;

/** Lost bars are a quiet stone, not a warning colour: losing a client is normal. */
const LOST_OPACITY = 0.35;
/** The bar still filling up (this week or month) is drawn lighter. */
const TO_DATE_OPACITY = 0.5;

function Legend({
    items,
}: {
    items: Array<{ key: string; label: string; color: string; value: string; opacity?: number }>;
}) {
    return (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {items.map((item) => (
                <div key={item.key} className="flex flex-col gap-0.5">
                    <dt className="body-xs flex items-center gap-1.5 font-medium text-ink-muted">
                        <span
                            aria-hidden
                            className="rounded-xs block-2.5 inline-2.5"
                            style={{ backgroundColor: item.color, opacity: item.opacity ?? 1 }}
                        />
                        {item.label}
                    </dt>
                    <dd className="h5 text-ink tabular-nums">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

export function EarningsTrendChart({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const [view, setView] = useState<TrendView>("money");
    const { buckets, bucketUnit } = report;
    const unitWord = bucketUnit === "week" ? "week" : "month";
    const isMoney = view === "money";
    const isEmpty = isMoney
        ? !buckets.some((b) => b.totalInr > 0)
        : !buckets.some((b) => b.closed > 0 || b.lost > 0);
    const toDate = buckets.find((b) => b.isToDate);
    const dense = buckets.length > 12;

    return (
        <EarningsCard
            title={isMoney ? `Commission by ${unitWord}` : `Sold and lost by ${unitWord}`}
            titleId="earnings-trend-heading"
            description={formatWindow(report.chartWindow)}
            action={
                <TextSegmentedToggle
                    size="sm"
                    value={view}
                    onValueChange={setView}
                    options={VIEW_OPTIONS}
                    ariaLabel="Chart view"
                />
            }
            className={className}
        >
            {isMoney ? (
                <Legend
                    items={[
                        {
                            key: "sale",
                            label: "Sale",
                            color: VIZ.sale,
                            value: formatCommission(report.saleEarnedInr, true),
                        },
                        {
                            key: "rent",
                            label: "Rent",
                            color: VIZ.rent,
                            value: formatCommission(report.rentEarnedInr, true),
                        },
                    ]}
                />
            ) : (
                <Legend
                    items={[
                        {
                            key: "sold",
                            label: "Sold",
                            color: VIZ.sold,
                            value: String(report.closedCount),
                        },
                        {
                            key: "lost",
                            label: "Lost",
                            color: VIZ.lost,
                            opacity: LOST_OPACITY,
                            value: String(report.lostCount),
                        },
                    ]}
                />
            )}

            {isEmpty ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-inner bg-surface-muted/60 px-6 py-10 text-center">
                    <p className="body font-medium text-ink">
                        {isMoney
                            ? "No commission in this period"
                            : "No finished deals in this period"}
                    </p>
                    <p className="body-sm text-ink-muted max-inline-sm">
                        Try a longer period, or mark a deal as sold in your pipeline.
                    </p>
                </div>
            ) : (
                <ChartContainer
                    key={view}
                    config={isMoney ? MONEY_CONFIG : DEALS_CONFIG}
                    className="aspect-auto flex-1 block-56 inline-full min-block-56 sm:block-64"
                >
                    <BarChart
                        accessibilityLayer
                        data={buckets}
                        margin={{ top: 8, left: 0, right: 0, bottom: 0 }}
                        barCategoryGap={dense ? "18%" : "28%"}
                        barGap={isMoney ? 0 : 3}
                    >
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 4"
                            stroke="var(--color-border-warm)"
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            minTickGap={dense ? 12 : 4}
                            tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            width={isMoney ? 48 : 28}
                            tickCount={4}
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
                            tickFormatter={(value: number) =>
                                isMoney ? formatCommissionTick(value) : String(value)
                            }
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--color-surface-muted)", radius: 8 }}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const bucket = payload?.[0]?.payload as
                                            EarningsBucket | undefined;
                                        if (!bucket) return "";
                                        return `${bucket.longLabel}${bucket.isToDate ? " (so far)" : ""}`;
                                    }}
                                    formatter={(value, name, item) => (
                                        <div className="flex flex-1 items-center justify-between gap-4">
                                            <span className="flex items-center gap-2 text-ink-muted">
                                                <span
                                                    aria-hidden
                                                    className="rounded-xs block-2.5 inline-2.5"
                                                    style={{
                                                        backgroundColor: item.color,
                                                        opacity: name === "lost" ? LOST_OPACITY : 1,
                                                    }}
                                                />
                                                {isMoney
                                                    ? MONEY_CONFIG[
                                                          name as keyof typeof MONEY_CONFIG
                                                      ]?.label
                                                    : DEALS_CONFIG[
                                                          name as keyof typeof DEALS_CONFIG
                                                      ]?.label}
                                            </span>
                                            <strong className="font-semibold text-ink tabular-nums">
                                                {isMoney
                                                    ? formatCommission(Number(value))
                                                    : Number(value)}
                                            </strong>
                                        </div>
                                    )}
                                />
                            }
                        />
                        {isMoney
                            ? (["saleInr", "rentInr"] as const).map((key) => (
                                  <Bar
                                      key={key}
                                      dataKey={key}
                                      stackId="commission"
                                      fill={`var(--color-${key})`}
                                      radius={4}
                                      stroke="var(--color-surface)"
                                      strokeWidth={2}
                                      maxBarSize={40}
                                      isAnimationActive={false}
                                  >
                                      {buckets.map((b) => (
                                          <Cell
                                              key={b.key}
                                              fillOpacity={b.isToDate ? TO_DATE_OPACITY : 1}
                                          />
                                      ))}
                                  </Bar>
                              ))
                            : (["closed", "lost"] as const).map((key) => (
                                  <Bar
                                      key={key}
                                      dataKey={key}
                                      fill={`var(--color-${key})`}
                                      radius={[4, 4, 0, 0]}
                                      maxBarSize={22}
                                      isAnimationActive={false}
                                  >
                                      {buckets.map((b) => (
                                          <Cell
                                              key={b.key}
                                              fillOpacity={
                                                  (key === "lost" ? LOST_OPACITY : 1) *
                                                  (b.isToDate ? TO_DATE_OPACITY + 0.3 : 1)
                                              }
                                          />
                                      ))}
                                  </Bar>
                              ))}
                    </BarChart>
                </ChartContainer>
            )}

            {!isEmpty && toDate ? (
                <p className="body-xs text-ink-muted">
                    Lighter bar: {toDate.longLabel.replace("Week of", "the week of")} so far.
                </p>
            ) : null}

            <table className="sr-only">
                <caption>
                    {isMoney ? "Estimated commission" : "Deals sold and lost"} by {unitWord}
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
                            <th scope="row">
                                {b.longLabel}
                                {b.isToDate ? " (so far)" : ""}
                            </th>
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
