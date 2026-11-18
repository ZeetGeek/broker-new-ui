"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, Text, XAxis, YAxis } from "recharts";
import type { BarShapeProps } from "recharts/types/cartesian/Bar";

import { plural } from "@/lib/format/plural";

import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport, LostReasonRow } from "@/features/earnings/earnings-math";

/**
 * One warm "loss" family built from the danger tokens, a fixed colour per
 * reason so "price" is the same red in every period. Not the chart-1…4
 * palette: those are the stage colours on the pipeline card, and a lost reason
 * in "Negotiation green" would read as a good outcome.
 */
const REASON_COLOR: Record<LostReasonRow["key"], string> = {
    price: "var(--color-danger)",
    bought_elsewhere: "color-mix(in oklch, var(--color-danger) 62%, var(--color-ink))",
    not_responding: "var(--color-danger-mid)",
    changed_mind: "color-mix(in oklch, var(--color-danger-mid) 50%, var(--color-surface))",
    other: "color-mix(in oklch, var(--color-ink-subtle) 35%, var(--color-surface))",
};

type ReasonBar = LostReasonRow & { pct: number; fill: string };

function toBars(rows: LostReasonRow[]): ReasonBar[] {
    // Out of deals that have a reason, so the shares add up to 100%.
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return rows.map((row) => ({
        ...row,
        pct: total > 0 ? Math.round((row.count / total) * 100) : 0,
        fill: REASON_COLOR[row.key],
    }));
}

/** "7 deals lost, 2 more than before. You won 70% of finished deals." */
function lossSummary(lost: number, previous: number | null, winRate: number | null): string {
    let text = `${plural(lost, "deal")} lost`;
    if (previous != null) {
        const diff = lost - previous;
        text +=
            diff === 0
                ? ", same as before"
                : `, ${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than before`;
    }
    text += ".";
    if (winRate != null) text += ` You won ${winRate}% of finished deals.`;
    return text;
}

const CHART_CONFIG = { count: { label: "Deals lost" } } satisfies ChartConfig;

/** Reason name under its column, wrapped to the column width. */
function ReasonTick({
    x,
    y,
    payload,
    width,
}: {
    x?: number | string;
    y?: number | string;
    payload?: { value: string };
    width: number;
}) {
    return (
        <Text
            x={Number(x)}
            y={Number(y)}
            width={width}
            textAnchor="middle"
            verticalAnchor="start"
            className="fill-ink-muted text-xs"
        >
            {payload?.value ?? ""}
        </Text>
    );
}

/**
 * One column per reason, share of reasoned losses on top. The biggest reason
 * gets a dashed outline so the eye lands there first.
 */
function ReasonBars({ bars }: { bars: ReasonBar[] }) {
    const max = Math.max(...bars.map((bar) => bar.count), 1);
    const topIndex = bars.findIndex((bar) => bar.count === max);
    // Rough column width so long reasons wrap instead of colliding.
    const tickWidth = Math.max(72, Math.min(220, 600 / bars.length));

    return (
        <ChartContainer
            config={CHART_CONFIG}
            // Grows with the card so the columns fill the row instead of leaving a gap.
            className="aspect-auto flex-1 inline-full min-block-64"
            aria-label={bars
                .map((bar) => `${bar.label}: ${plural(bar.count, "deal")}, ${bar.pct}%`)
                .join(". ")}
        >
            <BarChart
                data={bars}
                margin={{ top: 24, right: 0, bottom: 0, left: 0 }}
                barCategoryGap="6%"
                accessibilityLayer
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    height={48}
                    interval={0}
                    tick={<ReasonTick width={tickWidth} />}
                />
                <YAxis type="number" domain={[0, max]} hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar
                    dataKey="count"
                    radius={8}
                    strokeWidth={2}
                    isAnimationActive={false}
                    shape={({ index, ...props }: BarShapeProps) =>
                        index === topIndex ? (
                            <Rectangle
                                {...props}
                                fillOpacity={0.85}
                                stroke={props.payload.fill}
                                strokeDasharray={4}
                                strokeDashoffset={4}
                            />
                        ) : (
                            <Rectangle {...props} />
                        )
                    }
                >
                    <LabelList
                        dataKey="pct"
                        position="top"
                        offset={8}
                        className="fill-ink text-xs font-semibold tabular-nums"
                        formatter={(value) => `${value}%`}
                    />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

/** Why deals were lost, as one column per reason. */
export function EarningsLosses({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { lostCount, lostReasons, previousLostCount, winRate } = report;
    const bars = toBars(lostReasons);

    return (
        <EarningsCard
            title="Why deals were lost"
            titleId="earnings-losses-heading"
            description={
                lostCount > 0 ? lossSummary(lostCount, previousLostCount, winRate) : undefined
            }
            className={className}
        >
            {lostCount === 0 ? (
                <p className="body-sm text-ink-muted">No deals were lost in this period.</p>
            ) : bars.length > 0 ? (
                <ReasonBars bars={bars} />
            ) : (
                <p className="body-sm text-ink-muted">No reasons saved for these deals yet.</p>
            )}
        </EarningsCard>
    );
}
