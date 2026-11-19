"use client";

import Link from "next/link";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { BROKER_PIPELINE_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { ChartBar, Clock, Handshake } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER } from "@/features/pipeline/types";

/** Same stage colours as the dashboard pipeline gauge and the pipeline board. */
const CHART_CONFIG = Object.fromEntries(
    DEAL_STAGE_ORDER.map((stage, index) => [
        stage,
        { label: DEAL_STAGE_META[stage].label, color: `var(--color-stage-${index + 1})` },
    ]),
) satisfies ChartConfig;

/**
 * Half-circle gauge of open deals split by stage, with the count in the
 * middle. Same anatomy as the dashboard's "Pipeline overview" card.
 */
function StageGauge({ report }: { report: EarningsReport }) {
    const { live } = report;
    const data = [live.stageCounts];

    return (
        <ChartContainer
            config={CHART_CONFIG}
            className="mx-auto aspect-auto block-44 inline-full max-inline-80"
            aria-label={`${plural(live.count, "open deal")}. ${DEAL_STAGE_ORDER.map(
                (stage) => `${DEAL_STAGE_META[stage].label}: ${live.stageCounts[stage]}`,
            ).join(", ")}`}
        >
            <RadialBarChart
                data={data}
                startAngle={180}
                endAngle={0}
                cy={164}
                innerRadius={114}
                outerRadius={150}
                accessibilityLayer
            >
                <PolarAngleAxis
                    type="number"
                    domain={[0, live.count || 1]}
                    tick={false}
                    axisLine={false}
                />
                {DEAL_STAGE_ORDER.map((stage) => (
                    <RadialBar
                        key={stage}
                        dataKey={stage}
                        fill={`var(--color-${stage})`}
                        stackId="pipeline"
                        cornerRadius={5}
                        className="stroke-surface stroke-2"
                        isAnimationActive={false}
                    />
                ))}
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                        content={({ viewBox }) => {
                            if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                            const cy = viewBox.cy ?? 0;
                            return (
                                <text x={viewBox.cx} y={cy} textAnchor="middle">
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy - 28}
                                        className="fill-ink text-4xl font-semibold tabular-nums"
                                    >
                                        {live.count.toLocaleString("en-IN")}
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={cy + 1}
                                        className="fill-ink-muted text-sm font-semibold"
                                    >
                                        {live.count === 1 ? "Open deal" : "Open deals"}
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
            action={
                <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={BROKER_PIPELINE_HREF} />}
                >
                    <ChartBar aria-hidden />
                    Open pipeline
                </Button>
            }
            className={cn("gap-0", className)}
        >
            {live.count === 0 ? (
                <p className="body-sm mbs-4 text-ink-muted">
                    No open deals. Attach a client to a property in your pipeline to start one.
                </p>
            ) : (
                <div className="mbs-1 flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col justify-center gap-12">
                        <StageGauge report={report} />

                        {live.potentialInr > 0 ? (
                            <dl className="mx-auto grid grid-cols-2 text-center inline-full max-inline-80">
                                <div className="px-3">
                                    <dt className="text-xs font-semibold text-ink-muted">
                                        Likely to close
                                    </dt>
                                    <dd className="h5 mbs-1 text-ink tabular-nums">
                                        {live.likelyInr > 0
                                            ? formatCommission(live.likelyInr, true)
                                            : "None yet"}
                                    </dd>
                                    <dd className="body-xs mbs-0.5 text-ink-muted">
                                        {live.likelyCount > 0
                                            ? `${plural(live.likelyCount, "deal")} near closing`
                                            : "None near closing"}
                                    </dd>
                                </div>
                                <div className="border-s border-border-warm px-3">
                                    <dt className="text-xs font-semibold text-ink-muted">
                                        Possible commission
                                    </dt>
                                    <dd className="h5 mbs-1 text-ink tabular-nums">
                                        {formatCommission(live.potentialInr, true)}
                                    </dd>
                                    <dd className="body-xs mbs-0.5 text-ink-muted">
                                        If all {plural(live.valuedCount, "deal")} sell
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="body-sm rounded-inner bg-surface-muted p-4 text-center text-ink-muted">
                                Owners have not set a commission on your open deals yet, so there is
                                nothing to add up.
                            </p>
                        )}

                        <dl className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
                            {DEAL_STAGE_ORDER.map((stage) => {
                                const count = live.stageCounts[stage];
                                const commission = live.stageCommissionInr[stage];
                                return (
                                    <div key={stage} className="text-center">
                                        <dt className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-muted">
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "shrink-0 rounded-xs block-2 inline-2",
                                                    DEAL_STAGE_META[stage].dotClass,
                                                )}
                                            />
                                            {DEAL_STAGE_META[stage].label}
                                        </dt>
                                        <dd className="mbs-1 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-sm font-semibold text-ink tabular-nums">
                                            <span>
                                                {commission > 0
                                                    ? formatCommission(commission, true)
                                                    : "—"}
                                            </span>
                                            <span className="text-xs text-ink-muted">
                                                {plural(count, "deal")}
                                            </span>
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>

                    {live.stalledCount > 0 || live.acceptedOfferCount > 0 ? (
                        <ul
                            className="
                              -mbe-4 flex flex-wrap justify-center gap-2 border-bs
                              border-border-warm py-4 sm:-mbe-5 sm:py-5
                            "
                        >
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
                </div>
            )}
        </EarningsCard>
    );
}
