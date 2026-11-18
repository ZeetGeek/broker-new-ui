"use client";

import { useCallback, useState } from "react";

import { Label, Pie, PieChart, Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";

import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport, LostReasonRow } from "@/features/earnings/earnings-math";

/**
 * One warm "loss" family built from the danger tokens, a fixed colour per
 * reason so "price" is the same red in every period. Lightness steps keep the
 * slices apart for colour-blind users; the list beside the ring names them.
 * Not the chart-1…4 palette: those are the stage colours on the pipeline card,
 * and a lost reason in "Negotiation green" would read as a good outcome.
 */
const REASON_COLOR: Record<LostReasonRow["key"], string> = {
    price: "var(--color-danger)",
    bought_elsewhere: "color-mix(in oklch, var(--color-danger) 62%, var(--color-ink))",
    not_responding: "var(--color-danger-mid)",
    changed_mind: "color-mix(in oklch, var(--color-danger-mid) 50%, var(--color-surface))",
    other: "color-mix(in oklch, var(--color-ink-subtle) 35%, var(--color-surface))",
};

type Slice = LostReasonRow & { pct: number; fill: string };

function toSlices(rows: LostReasonRow[]): Slice[] {
    // Out of deals that have a reason, so the ring adds up to 100%.
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return rows.map((row) => ({
        ...row,
        pct: total > 0 ? Math.round((row.count / total) * 100) : 0,
        fill: REASON_COLOR[row.key],
    }));
}

function ReasonDonut({ slices, activeIndex }: { slices: Slice[]; activeIndex: number }) {
    const active = slices[activeIndex];
    const config = Object.fromEntries(
        slices.map((slice) => [slice.key, { label: slice.label, color: slice.fill }]),
    ) satisfies ChartConfig;

    const renderShape = useCallback(
        ({ index, outerRadius = 0, ...props }: PieSectorShapeProps) => {
            if (index === activeIndex) {
                return (
                    <g>
                        <Sector {...props} outerRadius={outerRadius + 8} />
                        <Sector
                            {...props}
                            outerRadius={outerRadius + 18}
                            innerRadius={outerRadius + 11}
                        />
                    </g>
                );
            }
            return <Sector {...props} outerRadius={outerRadius} />;
        },
        [activeIndex],
    );

    return (
        <ChartContainer
            config={config}
            className="aspect-auto flex-1 inline-full min-block-60"
            aria-label={slices
                .map((slice) => `${slice.label}: ${plural(slice.count, "deal")}, ${slice.pct}%`)
                .join(". ")}
        >
            <PieChart>
                <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="key"
                    innerRadius="52%"
                    outerRadius="78%"
                    // A prop, not a class: a stroke class would also outline the centre label.
                    stroke="var(--color-surface)"
                    strokeWidth={3}
                    paddingAngle={slices.length > 1 ? 2 : 0}
                    cornerRadius={6}
                    shape={renderShape}
                    isAnimationActive={false}
                >
                    <Label
                        content={({ viewBox }) => {
                            if (!active || !viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                                return null;
                            }
                            const cy = viewBox.cy ?? 0;
                            return (
                                <text x={viewBox.cx} y={cy} textAnchor="middle" stroke="none">
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy + 2}
                                        className="fill-ink text-3xl font-bold tabular-nums"
                                    >
                                        {active.pct}%
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy + 24}
                                        className="fill-ink-muted text-sm font-medium"
                                    >
                                        {plural(active.count, "deal")}
                                    </tspan>
                                </text>
                            );
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    );
}

/** Why deals were lost, as a donut with a tappable reason list. */
export function EarningsLosses({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { lostCount, lostReasons } = report;
    const slices = toSlices(lostReasons);

    // Track by key so a period change keeps the same reason picked when it still exists.
    const [activeKey, setActiveKey] = useState<Slice["key"] | null>(null);
    const foundIndex = slices.findIndex((slice) => slice.key === activeKey);
    const activeIndex = foundIndex >= 0 ? foundIndex : 0;

    return (
        <EarningsCard
            title="Why deals were lost"
            titleId="earnings-losses-heading"
            className={className}
        >
            {lostCount === 0 ? (
                <p className="body-sm text-ink-muted">No deals were lost in this period.</p>
            ) : (
                <>
                    {slices.length > 0 ? (
                        <div className="flex flex-1 flex-col gap-4">
                            <ReasonDonut slices={slices} activeIndex={activeIndex} />
                            <ul className="flex flex-col gap-1">
                                {slices.map((slice, index) => {
                                    const isActive = index === activeIndex;
                                    return (
                                        <li key={slice.key}>
                                            <button
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => setActiveKey(slice.key)}
                                                className={cn(
                                                    "body-sm flex items-center gap-2.5 rounded-control px-2.5 py-2 text-start transition-colors duration-(--duration-fast) inline-full hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-brand",
                                                )}
                                                style={
                                                    isActive
                                                        ? {
                                                              backgroundColor: `color-mix(in oklch, ${slice.fill} 10%, var(--color-surface))`,
                                                          }
                                                        : undefined
                                                }
                                            >
                                                <span
                                                    aria-hidden
                                                    className="shrink-0 rounded-full block-2.5 inline-2.5"
                                                    style={{ backgroundColor: slice.fill }}
                                                />
                                                <span
                                                    className={cn(
                                                        "flex-1 min-inline-0",
                                                        isActive
                                                            ? "font-semibold text-ink"
                                                            : "text-ink-muted",
                                                    )}
                                                >
                                                    {slice.label}
                                                </span>
                                                <span className="shrink-0 text-ink-muted tabular-nums">
                                                    <strong className="font-semibold text-ink">
                                                        {slice.count}
                                                    </strong>{" "}
                                                    · {slice.pct}%
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : null}
                    {slices.length === 0 ? (
                        <p className="body-sm text-ink-muted">
                            No reasons saved for these deals yet.
                        </p>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
