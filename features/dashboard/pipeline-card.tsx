"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AlertCircle } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { PipelineData, PipelineStage, PipelineStageKey } from "./mock-data";

const PIPELINE_INFO = "Your active clients and which deal stage each one is in.";

const STAGE_COLOR_VAR: Record<PipelineStageKey, string> = {
    new: "var(--color-stage-1)",
    contacted: "var(--color-stage-2)",
    site_visit: "var(--color-stage-3)",
    negotiation: "var(--color-stage-4)",
};

const STAGE_SWATCH_CLASS: Record<PipelineStageKey, string> = {
    new: "bg-stage-1",
    contacted: "bg-stage-2",
    site_visit: "bg-stage-3",
    negotiation: "bg-stage-4",
};

/** Shorter X-axis ticks so four stages fit at 360px. */
const AXIS_LABEL: Record<PipelineStageKey, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Visit",
    negotiation: "Deal",
};

const SEGMENT_ANIMATION_MS = 400;

const LINK_CLASS = cn(
    "body-sm inline-flex items-center gap-1 font-semibold text-brand outline-none",
    "hover:text-brand-text",
    "focus-visible:ring-3 focus-visible:ring-ring/30",
);

type ChartRow = {
    key: PipelineStageKey;
    label: string;
    axisLabel: string;
    count: number;
    fill: string;
};

export type PipelineCardProps = {
    data: PipelineData;
    className?: string;
};

function stageHref(key: PipelineStageKey) {
    return `/broker/clients?stage=${key}`;
}

function toChartRows(stages: PipelineStage[]): ChartRow[] {
    return stages
        .filter((stage) => stage.count > 0)
        .map((stage) => ({
            key: stage.key,
            label: stage.label,
            axisLabel: AXIS_LABEL[stage.key],
            count: stage.count,
            fill: STAGE_COLOR_VAR[stage.key],
        }));
}

function buildChartConfig(rows: ChartRow[]): ChartConfig {
    return {
        count: { label: "Clients" },
        ...Object.fromEntries(rows.map((row) => [row.key, { label: row.label, color: row.fill }])),
    } satisfies ChartConfig;
}

function pipelineAriaLabel(rows: ChartRow[]): string {
    const parts = rows.map((row) => `${row.count} ${row.label.toLowerCase()}`);
    return `Pipeline: ${parts.join(", ")}`;
}

function PipelineBarChart({ stages }: { stages: PipelineStage[] }) {
    const router = useRouter();
    const rows = toChartRows(stages);
    const chartConfig = buildChartConfig(rows);
    const maxCount = Math.max(...rows.map((row) => row.count), 1);

    return (
        <div
            role="img"
            aria-label={pipelineAriaLabel(rows)}
            className="relative flex-1 inline-full min-block-0"
        >
            <ChartContainer
                config={chartConfig}
                className="absolute inset-0 aspect-auto justify-stretch"
                initialDimension={{ width: 320, height: 200 }}
            >
                <BarChart
                    accessibilityLayer
                    data={rows}
                    margin={{ top: 28, right: 4, left: 4, bottom: 4 }}
                    barCategoryGap="18%"
                >
                    <XAxis
                        dataKey="axisLabel"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        interval={0}
                        tick={{
                            fill: "var(--color-ink-muted)",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    />
                    <YAxis hide domain={[0, maxCount]} allowDecimals={false} />
                    <ChartTooltip
                        cursor={{ fill: "var(--color-surface-muted)" }}
                        content={
                            <ChartTooltipContent
                                hideIndicator
                                labelFormatter={(_value, payload) => {
                                    const row = payload?.[0]?.payload as ChartRow | undefined;
                                    return row?.label ?? String(_value);
                                }}
                            />
                        }
                    />
                    <Bar
                        dataKey="count"
                        radius={[10, 10, 6, 6]}
                        maxBarSize={56}
                        cursor="pointer"
                        className="
                          outline-none
                          [&_.recharts-rectangle]:transition-[filter]
                          [&_.recharts-rectangle]:duration-160
                          hover:[&_.recharts-rectangle]:brightness-110
                        "
                        isAnimationActive
                        animationDuration={SEGMENT_ANIMATION_MS}
                        animationEasing="ease-out"
                        onClick={(item) => {
                            const payload = item?.payload as ChartRow | undefined;
                            if (payload?.key) router.push(stageHref(payload.key));
                        }}
                    >
                        {rows.map((row) => (
                            <Cell
                                key={row.key}
                                fill={row.fill}
                                aria-label={`${row.count} clients in ${row.label}`}
                            />
                        ))}
                        <LabelList
                            dataKey="count"
                            position="top"
                            offset={8}
                            className="fill-ink text-sm font-semibold tabular-nums"
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
    );
}

function PipelineLegend({ stages, className }: { stages: PipelineStage[]; className?: string }) {
    const visible = stages.filter((stage) => stage.count > 0);

    return (
        <ul className={cn("flex flex-wrap gap-x-4 gap-y-2 pbe-3", className)}>
            {visible.map((stage) => (
                <li key={stage.key}>
                    <Link
                        href={stageHref(stage.key)}
                        className={cn(
                            "body-sm inline-flex items-center gap-1.5 text-ink-muted outline-none",
                            "hover:text-ink",
                            "focus-visible:ring-3 focus-visible:ring-ring/30",
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                "shrink-0 rounded-[3px] block-2.25 inline-2.25",
                                STAGE_SWATCH_CLASS[stage.key],
                            )}
                        />
                        {stage.label}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function StalledRow({ stalled }: { stalled: NonNullable<PipelineData["stalled"]> }) {
    const title =
        stalled.count === 1
            ? "1 client has gone quiet"
            : `${stalled.count} clients have gone quiet`;

    return (
        <div className="flex items-start gap-3 py-3">
            <AlertCircle
                aria-hidden
                className="mbs-0.5 shrink-0 text-urgent block-4 inline-4"
                strokeWidth={1.75}
            />
            <div className="flex-1 min-inline-0">
                <p className="body font-semibold text-ink">{title}</p>
                <p className="body-sm mbs-0.5 text-ink-muted">
                    No activity in {stalled.thresholdDays}+ days
                </p>
            </div>
            <Button
                variant="link"
                size="sm"
                nativeButton={false}
                className="
                  body-sm shrink-0 self-center p-0 font-semibold text-brand block-auto
                  hover:text-brand-text
                "
                render={<Link href={stalled.href} />}
            >
                Review
            </Button>
        </div>
    );
}

function MonthFooter({ won, lost }: { won: number; lost: number }) {
    const wonLabel = won === 1 ? "1 deal won" : `${won} deals won`;
    const lostLabel = lost === 1 ? "1 deal lost" : `${lost} deals lost`;

    return (
        <div className="flex items-center justify-between gap-3 pbs-3">
            <p className="body-sm font-medium text-ink-muted">This month</p>
            <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label={`${wonLabel}, ${lostLabel}`}
            >
                <Badge variant="brand" className="gap-1 border-0 px-2.5 font-semibold tabular-nums">
                    <span>{won}</span>
                    <span className="font-semibold opacity-90">Won</span>
                </Badge>
                <Badge
                    variant="danger"
                    className="gap-1 border-0 px-2.5 font-semibold tabular-nums"
                >
                    <span>{lost}</span>
                    <span className="font-semibold opacity-90">Lost</span>
                </Badge>
            </div>
        </div>
    );
}

function EmptyPipeline({ className }: { className?: string }) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="pipeline-card-heading"
        >
            <CardLabel info={PIPELINE_INFO}>
                <span id="pipeline-card-heading">Pipeline</span>
            </CardLabel>
            <div className="mbs-4 flex flex-1 flex-col min-block-0">
                <p className="h5 text-ink">No clients yet.</p>
                <p className="body mbs-1 text-ink-muted">
                    Add a buyer or tenant to start tracking deals through your pipeline.
                </p>
                <div className="pts-3 mbs-auto">
                    <Link href="/broker/clients/new" className={LINK_CLASS}>
                        Add your first buyer or tenant
                        <span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function PipelineCard({ data, className }: PipelineCardProps) {
    if (data.activeTotal === 0) {
        return <EmptyPipeline className={className} />;
    }

    const showStalled = data.stalled != null && data.stalled.count > 0;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="pipeline-card-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={PIPELINE_INFO}>
                    <span id="pipeline-card-heading">Pipeline</span>
                </CardLabel>
                <p className="eyebrow shrink-0 text-ink-muted">{data.activeTotal} active clients</p>
            </div>

            <div className="mbs-4 flex flex-1 flex-col min-block-0">
                <PipelineBarChart stages={data.stages} />
                <PipelineLegend stages={data.stages} className="mbs-1 shrink-0" />

                <div className="shrink-0 inline-full">
                    <div
                        className="
                          flex flex-col divide-y divide-border-warm border-bs border-border-warm
                        "
                    >
                        {showStalled && data.stalled ? <StalledRow stalled={data.stalled} /> : null}
                        <MonthFooter won={data.thisMonth.won} lost={data.thisMonth.lost} />
                    </div>
                </div>
            </div>
        </section>
    );
}
