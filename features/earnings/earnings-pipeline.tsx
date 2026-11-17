"use client";

import Link from "next/link";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { BROKER_PIPELINE_HREF } from "@/lib/routes/broker";

import { ArrowRight, ChevronRight, Clock, Handshake } from "@/components/shared/icons";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { VIZ } from "@/features/earnings/earnings-viz";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER } from "@/features/pipeline/types";

const GAUGE_CONFIG = {
    likely: { label: "Likely", color: VIZ.pipeline },
    rest: { label: "Other open deals", color: VIZ.pipeline },
} satisfies ChartConfig;

/**
 * Half-circle gauge: the full arc is every rupee on open deals, the filled
 * part is what is close to closing. Same shape as the dashboard's pipeline gauge.
 */
function CommissionGauge({ likelyInr, potentialInr }: { likelyInr: number; potentialInr: number }) {
    const data = [{ likely: likelyInr, rest: Math.max(0, potentialInr - likelyInr) }];
    const share = potentialInr > 0 ? Math.round((likelyInr / potentialInr) * 100) : 0;

    return (
        <ChartContainer
            config={GAUGE_CONFIG}
            className="mx-auto aspect-auto block-36 inline-full max-inline-64"
            role="img"
            aria-label={`${formatCommission(likelyInr)} likely, ${share}% of ${formatCommission(potentialInr)} possible`}
        >
            <RadialBarChart
                data={data}
                startAngle={180}
                endAngle={0}
                cy={132}
                innerRadius={92}
                outerRadius={120}
            >
                <PolarAngleAxis
                    type="number"
                    domain={[0, potentialInr || 1]}
                    tick={false}
                    axisLine={false}
                />
                <RadialBar
                    dataKey="likely"
                    stackId="gauge"
                    fill="var(--color-likely)"
                    cornerRadius={6}
                    className="stroke-surface stroke-2"
                    isAnimationActive={false}
                />
                <RadialBar
                    dataKey="rest"
                    stackId="gauge"
                    fill="var(--color-rest)"
                    fillOpacity={0.16}
                    cornerRadius={6}
                    className="stroke-surface stroke-2"
                    isAnimationActive={false}
                />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                        content={({ viewBox }) => {
                            if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                            const cy = viewBox.cy ?? 0;
                            return (
                                <text x={viewBox.cx} y={cy} textAnchor="middle">
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy - 26}
                                        className="fill-ink font-display text-2xl font-semibold tabular-nums"
                                    >
                                        {formatCommission(likelyInr, true)}
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy - 4}
                                        className="fill-ink-muted text-xs font-medium"
                                    >
                                        likely to close
                                    </tspan>
                                </text>
                            );
                        }}
                    />
                </PolarRadiusAxis>
            </RadialBarChart>
        </ChartContainer>
    );
}

/** Live pipeline. Not tied to the selected period: it is "right now". */
export function EarningsPipeline({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { live } = report;

    return (
        <EarningsCard
            title="Money in your pipeline"
            titleId="earnings-pipeline-heading"
            description="Open deals right now"
            action={
                <Link
                    href={BROKER_PIPELINE_HREF}
                    className="body-sm inline-flex items-center gap-1 rounded-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-block-11"
                >
                    Open pipeline
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Link>
            }
            className={className}
        >
            {live.count === 0 ? (
                <p className="body-sm text-ink-muted">
                    No open deals. Attach a client to a property in your pipeline to start one.
                </p>
            ) : (
                <>
                    {live.potentialInr > 0 ? (
                        <CommissionGauge
                            likelyInr={live.likelyInr}
                            potentialInr={live.potentialInr}
                        />
                    ) : (
                        <p className="body-sm rounded-inner bg-surface-muted p-4 text-ink-muted">
                            Owners have not set a commission on your open deals yet, so there is
                            nothing to add up.
                        </p>
                    )}

                    {live.potentialInr > 0 ? (
                        <dl className="grid grid-cols-2 text-center">
                            <div className="flex flex-col gap-1 px-2">
                                <dt className="body-xs flex items-center justify-center gap-1.5 font-medium text-ink-muted">
                                    <span
                                        aria-hidden
                                        className="rounded-full bg-chart-2 block-2 inline-2"
                                    />
                                    Likely
                                </dt>
                                <dd className="h6 text-ink tabular-nums">
                                    {live.likelyInr > 0
                                        ? formatCommission(live.likelyInr, true)
                                        : "None yet"}
                                </dd>
                                <dd className="body-xs text-ink-muted">
                                    {live.likelyCount > 0
                                        ? `${plural(live.likelyCount, "deal")} near closing`
                                        : "None near closing yet"}
                                </dd>
                            </div>
                            <div className="flex flex-col gap-1 border-s border-border-warm px-2">
                                <dt className="body-xs flex items-center justify-center gap-1.5 font-medium text-ink-muted">
                                    <span
                                        aria-hidden
                                        className="rounded-full bg-chart-2/20 block-2 inline-2"
                                    />
                                    Possible
                                </dt>
                                <dd className="h6 text-ink tabular-nums">
                                    {formatCommission(live.potentialInr, true)}
                                </dd>
                                <dd className="body-xs text-ink-muted">
                                    If all {plural(live.valuedCount, "deal")} sell
                                </dd>
                            </div>
                        </dl>
                    ) : null}

                    <ol
                        aria-label="Open deals by stage"
                        className="grid grid-cols-4 items-start rounded-inner bg-surface-muted/70 p-3"
                    >
                        {DEAL_STAGE_ORDER.map((stage, index) => (
                            <li
                                key={stage}
                                className="relative flex flex-col items-center gap-0.5 text-center"
                            >
                                {index > 0 ? (
                                    <ChevronRight
                                        aria-hidden
                                        className="absolute -inset-s-2 inset-bs-2 text-ink-subtle block-3.5 inline-3.5"
                                    />
                                ) : null}
                                <span className="h5 text-ink tabular-nums">
                                    {live.stageCounts[stage]}
                                </span>
                                <span className="body-xs text-ink-muted">
                                    {DEAL_STAGE_META[stage].label}
                                </span>
                            </li>
                        ))}
                    </ol>

                    {live.stalledCount > 0 || live.acceptedOfferCount > 0 ? (
                        <ul className="mbs-auto flex flex-wrap gap-2">
                            {live.acceptedOfferCount > 0 ? (
                                <li className="body-xs inline-flex items-center gap-1.5 rounded-full bg-chart-4/12 px-3 py-1.5 font-semibold text-brand-text">
                                    <Handshake aria-hidden className="block-3.5 inline-3.5" />
                                    {plural(live.acceptedOfferCount, "offer")} accepted, ready to
                                    close
                                </li>
                            ) : null}
                            {live.stalledCount > 0 ? (
                                <li>
                                    <Link
                                        href={BROKER_PIPELINE_HREF}
                                        className="body-xs inline-flex items-center gap-1.5 rounded-full bg-urgent-soft px-3 py-1.5 font-semibold text-urgent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-block-11"
                                    >
                                        <Clock aria-hidden className="block-3.5 inline-3.5" />
                                        {plural(live.stalledCount, "deal")} quiet for 2+ weeks
                                    </Link>
                                </li>
                            ) : null}
                        </ul>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
