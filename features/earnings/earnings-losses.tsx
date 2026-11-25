"use client";

import { useId, useMemo } from "react";

import { Area, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { formatCommission, formatCommissionTick } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/empty-state";
import { LostIcon } from "@/components/shared/icons";
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
import { DEAL_LOST_REASON_LABEL } from "@/features/pipeline/stage-meta";
import type { DealLostReason } from "@/features/pipeline/types";

/** Same danger family as Mark as lost — not stage / chart greens. */
const CHART_CONFIG = {
    lostInr: { label: "Amount lost", color: "var(--color-danger)" },
    average: { label: "Average", color: "var(--color-danger-mid)" },
} satisfies ChartConfig;

const REASON_ORDER: Array<DealLostReason | "other"> = [
    "price",
    "bought_elsewhere",
    "not_responding",
    "changed_mind",
    "other",
];

type ReasonLine = { label: string; count: number };

type LostRow = {
    label: string;
    longLabel: string;
    lost: number;
    lostInr: number;
    average: number;
    reasons: ReasonLine[];
};

function reasonLabel(key: DealLostReason | "other"): string {
    return key === "other" ? "Others" : DEAL_LOST_REASON_LABEL[key];
}

function reasonLines(counts: EarningsBucket["lostReasonCounts"]): ReasonLine[] {
    return REASON_ORDER.filter((key) => (counts[key] ?? 0) > 0).map((key) => ({
        label: reasonLabel(key),
        count: counts[key] ?? 0,
    }));
}

function lostRows(buckets: EarningsBucket[], showAverage: boolean): LostRow[] {
    const active = buckets.filter((b) => b.lostInr > 0);
    const average =
        !showAverage || active.length === 0
            ? 0
            : active.reduce((sum, b) => sum + b.lostInr, 0) / active.length;
    return buckets.map((b) => ({
        label: b.label,
        longLabel: b.longLabel,
        lost: b.lost,
        lostInr: b.lostInr,
        average: showAverage ? Math.round(average) : 0,
        reasons: reasonLines(b.lostReasonCounts),
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

/**
 * Lost commission across the selected period — same area-chart anatomy as
 * “Commission by month”. Tooltip also lists deal count and reasons.
 */
export function EarningsLosses({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const gradId = useId().replace(/:/g, "");
    const { buckets, bucketUnit, lostCount } = report;
    const unitWord = bucketUnitWord(bucketUnit);
    const dense = buckets.length > 12;
    const showAverage = buckets.filter((b) => b.lostInr > 0).length >= 2;
    const data = useMemo(() => lostRows(buckets, showAverage), [buckets, showAverage]);
    const isEmpty = lostCount === 0;
    const lostInrTotal = useMemo(() => buckets.reduce((sum, b) => sum + b.lostInr, 0), [buckets]);

    const fillLost = `fill-lost-${gradId}`;
    const fillAvg = `fill-avg-${gradId}`;

    return (
        <EarningsCard
            title={`Lost deals by ${unitWord}`}
            titleId="earnings-losses-heading"
            empty={isEmpty}
            action={
                !isEmpty ? (
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <span className="body-xs inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 font-semibold text-danger ring-1 ring-danger/10">
                            <span className="tabular-nums">{lostCount}</span>
                            <span>{lostCount === 1 ? "deal lost" : "deals lost"}</span>
                        </span>
                        <span className="body-xs inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 font-semibold text-danger ring-1 ring-danger/10">
                            <span className="tabular-nums">
                                {formatCommission(lostInrTotal, true)}
                            </span>
                            <span>lost</span>
                        </span>
                    </div>
                ) : undefined
            }
            className={cn("block-full min-block-full", className)}
        >
            <div className="flex flex-1 flex-col pbe-2 min-block-0 min-inline-0">
                {isEmpty ? (
                    <EmptyState
                        size="card"
                        icon={LostIcon}
                        heading="No deals lost in this period"
                        description="Try a longer period, or check back after deals are marked lost."
                    />
                ) : (
                    <ChartContainer
                        key={`lost-${bucketUnit}-${buckets.length}-${showAverage}`}
                        config={CHART_CONFIG}
                        className="aspect-auto flex-1 inline-full min-block-56 sm:min-block-64"
                        aria-label={data
                            .map((row) => {
                                const reasons =
                                    row.reasons.length > 0
                                        ? row.reasons.map((r) => `${r.label} ${r.count}`).join(", ")
                                        : "no reason saved";
                                return `${row.longLabel}: ${plural(row.lost, "deal")} lost, ${formatCommission(row.lostInr)}, ${reasons}`;
                            })
                            .join(". ")}
                    >
                        <ComposedChart
                            accessibilityLayer
                            data={data}
                            margin={{ top: 12, left: 0, right: 8, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={fillLost} x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-lostInr)"
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-lostInr)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                {showAverage ? (
                                    <linearGradient id={fillAvg} x1="0" y1="0" x2="0" y2="1">
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
                                width={40}
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
                                                LostRow | undefined;
                                            return row?.longLabel ?? "";
                                        }}
                                        formatter={(value, name, item) => {
                                            const row = item?.payload as LostRow | undefined;
                                            if (name === "average") {
                                                return (
                                                    <div className="flex flex-1 items-center justify-between gap-4">
                                                        <span className="text-ink-muted">
                                                            Avg / {unitWord}
                                                        </span>
                                                        <strong className="font-semibold text-ink tabular-nums">
                                                            {formatCommission(Number(value))}
                                                        </strong>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="flex flex-1 flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-ink-muted">
                                                            Amount lost
                                                        </span>
                                                        <strong className="font-semibold text-ink tabular-nums">
                                                            {formatCommission(Number(value))}
                                                        </strong>
                                                    </div>
                                                    {row ? (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-ink-muted">
                                                                Deals lost
                                                            </span>
                                                            <strong className="font-semibold text-ink tabular-nums">
                                                                {row.lost}
                                                            </strong>
                                                        </div>
                                                    ) : null}
                                                    {row && row.reasons.length > 0 ? (
                                                        <div className="flex flex-col gap-1 border-bs border-border-warm pbs-1.5">
                                                            <span className="body-xs font-medium text-ink-subtle">
                                                                Reason
                                                            </span>
                                                            {row.reasons.map((reason) => (
                                                                <div
                                                                    key={reason.label}
                                                                    className="flex items-center justify-between gap-4"
                                                                >
                                                                    <span className="text-ink-muted">
                                                                        {reason.label}
                                                                    </span>
                                                                    <strong className="font-semibold text-ink tabular-nums">
                                                                        {reason.count}
                                                                    </strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        }}
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
                                    fill={`url(#${fillAvg})`}
                                    isAnimationActive={false}
                                    dot={{ ...DOT, fill: "var(--color-average)" }}
                                    activeDot={{ ...ACTIVE_DOT, fill: "var(--color-average)" }}
                                />
                            ) : null}
                            <Area
                                type="monotone"
                                dataKey="lostInr"
                                stroke="var(--color-lostInr)"
                                strokeWidth={2.5}
                                fill={`url(#${fillLost})`}
                                isAnimationActive={false}
                                dot={{ ...DOT, fill: "var(--color-lostInr)" }}
                                activeDot={{ ...ACTIVE_DOT, fill: "var(--color-lostInr)" }}
                            />
                        </ComposedChart>
                    </ChartContainer>
                )}
            </div>
        </EarningsCard>
    );
}
