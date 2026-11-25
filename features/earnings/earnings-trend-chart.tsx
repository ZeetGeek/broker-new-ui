"use client";

import { useId, useState } from "react";

import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { formatCommission, formatCommissionTick } from "@/lib/format/commission";

import { EmptyState } from "@/components/empty-state";
import { ChartBar } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import {
    bucketUnitWord,
    type EarningsBucket,
    type EarningsReport,
} from "@/features/earnings/earnings-math";

type TrendView = "money" | "deals";

const VIEW_OPTIONS = [
    { value: "money", label: "Commission" },
    { value: "deals", label: "Sold vs lost" },
] as const;

/** Sky + violet — not brand green. */
const MONEY_CONFIG = {
    earned: { label: "Earned", color: "var(--color-chart-1)" },
    average: { label: "Average", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const DEALS_CONFIG = {
    sold: { label: "Sold", color: "var(--color-chart-1)" },
    lost: { label: "Lost", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

type MoneyRow = {
    label: string;
    longLabel: string;
    earned: number;
    average: number;
    isToDate: boolean;
};

type DealsRow = {
    label: string;
    longLabel: string;
    sold: number;
    lost: number;
    isToDate: boolean;
};

function moneyRows(buckets: EarningsBucket[], showAverage: boolean): MoneyRow[] {
    const active = buckets.filter((b) => b.totalInr > 0);
    const average =
        !showAverage || active.length === 0
            ? 0
            : active.reduce((sum, b) => sum + b.totalInr, 0) / active.length;
    return buckets.map((b) => ({
        label: b.label,
        longLabel: b.longLabel,
        earned: b.totalInr,
        average: showAverage ? Math.round(average) : 0,
        isToDate: b.isToDate,
    }));
}

function dealsRows(buckets: EarningsBucket[]): DealsRow[] {
    return buckets.map((b) => ({
        label: b.label,
        longLabel: b.longLabel,
        sold: b.closed,
        lost: b.lost,
        isToDate: b.isToDate,
    }));
}

const DOT = {
    r: 3,
    strokeWidth: 2,
    stroke: "var(--color-surface)",
} as const;

const ACTIVE_DOT = {
    r: 5,
    strokeWidth: 2,
    stroke: "var(--color-surface)",
} as const;

export function EarningsTrendChart({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const [view, setView] = useState<TrendView>("money");
    const gradId = useId().replace(/:/g, "");
    const { buckets, bucketUnit } = report;
    const unitWord = bucketUnitWord(bucketUnit);
    const isMoney = view === "money";
    const isEmpty = isMoney
        ? !buckets.some((b) => b.totalInr > 0)
        : !buckets.some((b) => b.closed > 0 || b.lost > 0);
    const dense = buckets.length > 12;
    const showAverage = buckets.filter((b) => b.totalInr > 0).length >= 2;
    const moneyData = moneyRows(buckets, showAverage);
    const dealsData = dealsRows(buckets);

    const fillA = `fill-a-${gradId}`;
    const fillB = `fill-b-${gradId}`;
    const panelId = `earnings-trend-panel-${gradId}`;

    return (
        <EarningsCard
            title={isMoney ? `Commission by ${unitWord}` : `Sold and lost by ${unitWord}`}
            titleId="earnings-trend-heading"
            action={
                <SlidingTabs
                    value={view}
                    onValueChange={setView}
                    options={VIEW_OPTIONS}
                    label="Chart view"
                    panelId={panelId}
                />
            }
            className={className}
        >
            <div
                id={panelId}
                role="tabpanel"
                aria-labelledby="earnings-trend-heading"
                className="flex flex-1 flex-col pbe-2 min-inline-0"
            >
                {isEmpty ? (
                    <EmptyState
                        size="card"
                        icon={ChartBar}
                        heading={
                            isMoney
                                ? "No commission in this period"
                                : "No finished deals in this period"
                        }
                        description="Choose a longer period to check earlier deals. Commission appears when a deal closes."
                    />
                ) : isMoney ? (
                    <ChartContainer
                        key={`money-${bucketUnit}-${buckets.length}-${showAverage}`}
                        config={MONEY_CONFIG}
                        className="aspect-auto flex-1 inline-full min-block-56 sm:min-block-64"
                    >
                        <ComposedChart
                            accessibilityLayer
                            data={moneyData}
                            margin={{ top: 12, left: 0, right: 8, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={fillA} x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-earned)"
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-earned)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                {showAverage ? (
                                    <linearGradient id={fillB} x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="var(--color-average)"
                                            stopOpacity={0.2}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="var(--color-average)"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                ) : null}
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 4"
                                stroke="var(--color-border-warm)"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                interval="preserveStartEnd"
                                minTickGap={dense ? 12 : 4}
                                tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={36}
                                tickCount={4}
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
                                tickFormatter={(value: number) => formatCommissionTick(value)}
                            />
                            <ChartTooltip
                                cursor={{
                                    stroke: "var(--color-ink-subtle)",
                                    strokeDasharray: "4 4",
                                    strokeWidth: 1,
                                }}
                                content={
                                    <ChartTooltipContent
                                        indicator="dot"
                                        labelFormatter={(_, payload) => {
                                            const row = payload?.[0]?.payload as
                                                MoneyRow | undefined;
                                            if (!row) return "";
                                            return row.longLabel;
                                        }}
                                        formatter={(value, name) => (
                                            <div className="flex flex-1 items-center justify-between gap-4">
                                                <span className="text-ink-muted">
                                                    {name === "average"
                                                        ? `Avg / ${unitWord}`
                                                        : "Earned"}
                                                </span>
                                                <strong className="font-semibold text-ink tabular-nums">
                                                    {formatCommission(Number(value))}
                                                </strong>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            {showAverage ? (
                                <Area
                                    type="monotone"
                                    dataKey="average"
                                    stroke="var(--color-average)"
                                    strokeWidth={2}
                                    fill={`url(#${fillB})`}
                                    isAnimationActive={false}
                                    dot={{ ...DOT, fill: "var(--color-average)" }}
                                    activeDot={{ ...ACTIVE_DOT, fill: "var(--color-average)" }}
                                />
                            ) : null}
                            <Area
                                type="monotone"
                                dataKey="earned"
                                stroke="var(--color-earned)"
                                strokeWidth={2.5}
                                fill={`url(#${fillA})`}
                                isAnimationActive={false}
                                dot={{ ...DOT, fill: "var(--color-earned)" }}
                                activeDot={{ ...ACTIVE_DOT, fill: "var(--color-earned)" }}
                            />
                        </ComposedChart>
                    </ChartContainer>
                ) : (
                    <ChartContainer
                        key={`deals-${bucketUnit}-${buckets.length}`}
                        config={DEALS_CONFIG}
                        className="aspect-auto flex-1 inline-full min-block-56 sm:min-block-64"
                    >
                        <ComposedChart
                            accessibilityLayer
                            data={dealsData}
                            margin={{ top: 12, left: 0, right: 8, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={fillA} x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-sold)"
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-sold)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient id={fillB} x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-lost)"
                                        stopOpacity={0.2}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-lost)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 4"
                                stroke="var(--color-border-warm)"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                interval="preserveStartEnd"
                                minTickGap={dense ? 12 : 4}
                                tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={28}
                                tickCount={4}
                                allowDecimals={false}
                                tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
                                tickFormatter={(value: number) => String(Math.round(value))}
                            />
                            <ChartTooltip
                                cursor={{
                                    stroke: "var(--color-ink-subtle)",
                                    strokeDasharray: "4 4",
                                    strokeWidth: 1,
                                }}
                                content={
                                    <ChartTooltipContent
                                        indicator="dot"
                                        labelFormatter={(_, payload) => {
                                            const row = payload?.[0]?.payload as
                                                DealsRow | undefined;
                                            if (!row) return "";
                                            return row.longLabel;
                                        }}
                                        formatter={(value, name) => (
                                            <div className="flex flex-1 items-center justify-between gap-4">
                                                <span className="text-ink-muted">
                                                    {name === "lost" ? "Lost" : "Sold"}
                                                </span>
                                                <strong className="font-semibold text-ink tabular-nums">
                                                    {Number(value)}
                                                </strong>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Area
                                type="monotone"
                                dataKey="lost"
                                stroke="var(--color-lost)"
                                strokeWidth={2}
                                fill={`url(#${fillB})`}
                                isAnimationActive={false}
                                dot={{ ...DOT, fill: "var(--color-lost)" }}
                                activeDot={{ ...ACTIVE_DOT, fill: "var(--color-lost)" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sold"
                                stroke="var(--color-sold)"
                                strokeWidth={2.5}
                                fill={`url(#${fillA})`}
                                isAnimationActive={false}
                                dot={{ ...DOT, fill: "var(--color-sold)" }}
                                activeDot={{ ...ACTIVE_DOT, fill: "var(--color-sold)" }}
                            />
                        </ComposedChart>
                    </ChartContainer>
                )}
            </div>

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
