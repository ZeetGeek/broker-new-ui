"use client";

import { Area, AreaChart } from "recharts";

import { formatCommission } from "@/lib/format/commission";

import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import type { EarningsBucket } from "@/features/earnings/earnings-math";

const CONFIG = {
    totalInr: { label: "Earned", color: "var(--color-brand)" },
} satisfies ChartConfig;

/**
 * Small earnings trend for the summary panel. Decorative overview only: the
 * full chart below carries the screen-reader table, so this is aria-hidden.
 */
export function EarningsSparkline({ buckets }: { buckets: EarningsBucket[] }) {
    if (buckets.length < 2 || !buckets.some((b) => b.totalInr > 0)) return null;

    const first = buckets[0];
    const last = buckets[buckets.length - 1];
    const lastIndex = buckets.length - 1;

    return (
        <figure aria-hidden className="flex flex-col gap-2 self-stretch min-inline-0">
            <ChartContainer
                config={CONFIG}
                className="aspect-auto block-20 inline-full sm:flex-1 sm:min-block-24"
            >
                <AreaChart data={buckets} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
                    <ChartTooltip
                        cursor={{ stroke: "var(--color-brand)", strokeOpacity: 0.25 }}
                        content={
                            <ChartTooltipContent
                                hideIndicator
                                labelFormatter={(_, payload) => {
                                    const bucket = payload?.[0]?.payload as
                                        EarningsBucket | undefined;
                                    return bucket?.longLabel ?? "";
                                }}
                                formatter={(value) => (
                                    <span className="font-semibold text-ink tabular-nums">
                                        {formatCommission(Number(value))}
                                    </span>
                                )}
                            />
                        }
                    />
                    <Area
                        dataKey="totalInr"
                        type="monotone"
                        stroke="var(--color-totalInr)"
                        strokeWidth={2}
                        fill="var(--color-totalInr)"
                        fillOpacity={0.12}
                        isAnimationActive={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)" }}
                        dot={(props: { cx?: number; cy?: number; index?: number }) =>
                            props.index === lastIndex && props.cx != null && props.cy != null ? (
                                <circle
                                    key="last"
                                    cx={props.cx}
                                    cy={props.cy}
                                    r={4}
                                    fill="var(--color-totalInr)"
                                    stroke="var(--color-surface)"
                                    strokeWidth={2}
                                />
                            ) : (
                                <g key={`dot-${props.index}`} />
                            )
                        }
                    />
                </AreaChart>
            </ChartContainer>
            <figcaption className="body-xs flex justify-between gap-3 text-ink-muted">
                <span>{first.label}</span>
                <span>{last.isToDate ? `${last.label} (so far)` : last.label}</span>
            </figcaption>
        </figure>
    );
}
