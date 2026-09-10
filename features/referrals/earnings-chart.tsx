"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";

import type { ReferralEarningsPoint } from "@/features/referrals/types";

/**
 * One series, so no legend — the heading above the chart names what is
 * plotted, and a single-swatch legend box would only restate it.
 */
const CHART_CONFIG = {
    credits: { label: "Credits earned", color: "var(--color-brand)" },
} satisfies ChartConfig;

/** Bars cap at 24px so a six-month chart keeps air between the columns. */
const MAX_BAR_SIZE = 24;

type EarningsTooltipProps = {
    active?: boolean;
    payload?: { payload: ReferralEarningsPoint }[];
};

/**
 * Custom tooltip rather than `ChartTooltipContent`: the useful line here is
 * *why* the month earned what it did — how many people qualified — and that
 * lives on the datum, not in the series value the shared component renders.
 */
function EarningsTooltip({ active, payload }: EarningsTooltipProps) {
    if (!active || !payload?.length) return null;

    const point = payload[0].payload;

    return (
        <div className="rounded-inner border border-border-warm bg-surface px-3 py-2 shadow-lg">
            <p className="body-xs text-ink-subtle">{point.label}</p>
            <p className="body-sm tabular font-semibold text-ink">
                {point.credits > 0 ? `${point.credits} credits` : "Nothing earned"}
            </p>
            {point.qualifiedCount > 0 ? (
                <p className="body-xs text-ink-muted">
                    {point.qualifiedCount === 1
                        ? "1 person qualified"
                        : `${point.qualifiedCount} people qualified`}
                </p>
            ) : null}
        </div>
    );
}

type EarningsChartProps = {
    earnings: ReferralEarningsPoint[] | null;
    className?: string;
};

/**
 * Credits earned per month.
 *
 * A column chart because the job is change over time across discrete monthly
 * buckets. Deliberately *not* a progress bar toward a target: there is no
 * target — every qualified referral pays the same flat amount, so there is no
 * ladder to be partway up.
 */
export function EarningsChart({ earnings, className }: EarningsChartProps) {
    if (!earnings) {
        return null;
    }

    const total = earnings.reduce((sum, point) => sum + point.credits, 0);

    // Nothing earned in any month yet. A chart of six empty columns says less
    // than a sentence, and looks broken. docs/EMPTY_STATES.md rule 3.
    if (total === 0) {
        return (
            <p className={cn("body-sm text-ink-muted", className)}>
                Once someone qualifies with your code, what you earn each month shows up here.
            </p>
        );
    }

    return (
        <figure className={cn("flex flex-col gap-2", className)}>
            {/* `aspect-video` is baked into ChartContainer, which would make
                the height follow the card's width instead of staying fixed.
                Overriding it here is what keeps the chart 160px on a phone and
                on a desktop alike. */}
            <ChartContainer config={CHART_CONFIG} className="aspect-auto block-40 inline-full">
                <BarChart data={earnings} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    {/* Horizontal only — vertical lines between six columns add
                        ink without helping anyone read a value. */}
                    <CartesianGrid
                        vertical={false}
                        stroke="var(--color-border-warm)"
                        strokeWidth={1}
                    />
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        className="body-xs"
                        stroke="var(--color-ink-subtle)"
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        className="body-xs tabular"
                        stroke="var(--color-ink-subtle)"
                        // Whole credits only — a "12.5 credits" tick is not a
                        // thing that can be earned.
                        allowDecimals={false}
                    />
                    <ChartTooltip
                        cursor={{ fill: "var(--color-surface-muted)" }}
                        content={<EarningsTooltip />}
                    />
                    <Bar
                        dataKey="credits"
                        fill="var(--color-brand)"
                        maxBarSize={MAX_BAR_SIZE}
                        // Rounded cap, square at the baseline.
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ChartContainer>

            {/* The chart is a picture; this is the same data in words, for a
                screen reader and for anyone who cannot see colour. */}
            <figcaption className="sr-only">
                Credits earned per month.{" "}
                {earnings.map((point) => `${point.label}: ${point.credits} credits`).join(". ")}
            </figcaption>
        </figure>
    );
}
