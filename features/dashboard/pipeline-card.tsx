"use client";

import Link from "next/link";

import { AlertCircle, Navigation, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ShortcutTooltip } from "@/features/shortcuts/shortcut-tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import { DigitPopIn } from "./digit-pop-in";
import type { PipelineData, PipelineStage, PipelineStageKey } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const PIPELINE_INFO = "Your active clients and which deal stage each one is in.";

const STAGE_SWATCH_CLASS: Record<PipelineStageKey, string> = {
    new: "bg-stage-1",
    contacted: "bg-stage-2",
    site_visit: "bg-stage-3",
    negotiation: "bg-stage-4",
};

/** Light fills need dark ink; deep fills need light ink. */
const STAGE_COUNT_CLASS: Record<PipelineStageKey, string> = {
    new: "text-ink",
    contacted: "text-ink",
    site_visit: "text-white",
    negotiation: "text-white",
};

export type PipelineCardProps = {
    data: PipelineData;
    className?: string;
};

function stageHref(key: PipelineStageKey) {
    return `/broker/clients?stage=${key}`;
}

function visibleStages(stages: PipelineStage[]): PipelineStage[] {
    return stages.filter((stage) => stage.count > 0);
}

function pipelineAriaLabel(stages: PipelineStage[]): string {
    const parts = stages.map((stage) => `${stage.count} ${stage.label.toLowerCase()}`);
    return `Pipeline: ${parts.join(", ")}`;
}

function PipelineSegmentedBar({ stages }: { stages: PipelineStage[] }) {
    const rows = visibleStages(stages);

    return (
        <ul aria-label={pipelineAriaLabel(rows)} className="flex gap-1 block-full inline-full">
            {rows.map((stage, index) => {
                const isFirst = index === 0;
                const isLast = index === rows.length - 1;

                return (
                    <li
                        key={stage.key}
                        className="flex min-inline-0"
                        style={{ flexGrow: stage.count, flexBasis: 0 }}
                    >
                        <Link
                            href={stageHref(stage.key)}
                            aria-label={`${stage.count} clients in ${stage.label}`}
                            className={cn(
                                "flex flex-1 items-center justify-center outline-none",
                                "transition-[filter] duration-160",
                                "hover:brightness-110",
                                `
                                  focus-visible:relative focus-visible:z-1 focus-visible:ring-3
                                  focus-visible:ring-ring/30
                                `,
                                STAGE_SWATCH_CLASS[stage.key],
                                isFirst && "rounded-s-md",
                                isLast && "rounded-e-md",
                            )}
                        >
                            <DigitPopIn
                                value={stage.count}
                                className={cn(
                                    "text-sm font-semibold tabular-nums",
                                    STAGE_COUNT_CLASS[stage.key],
                                )}
                            />
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function PipelineLegend({ stages, className }: { stages: PipelineStage[]; className?: string }) {
    const visible = visibleStages(stages);

    return (
        <ul className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
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
                                "shrink-0 rounded-full block-2.25 inline-2.25",
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
                  body-sm shrink-0 gap-1 self-center p-0 font-semibold text-brand block-auto
                  hover:text-brand-text
                "
                render={<Link href={stalled.href} />}
            >
                <Navigation aria-hidden strokeWidth={1.75} />
                Review
            </Button>
        </div>
    );
}

function MonthFooter({ won, lost }: { won: number; lost: number }) {
    const wonLabel = won === 1 ? "1 deal won" : `${won} deals won`;
    const lostLabel = lost === 1 ? "1 deal lost" : `${lost} deals lost`;

    return (
        <div className="flex items-center justify-between gap-3 pbs-3.5">
            <p className="body-sm font-medium text-ink-muted">This month</p>
            <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label={`${wonLabel}, ${lostLabel}`}
            >
                <Badge variant="brand" className="gap-1 border-0 px-2.5 font-semibold tabular-nums">
                    <DigitPopIn value={won} />
                    <span className="font-semibold opacity-90">Won</span>
                </Badge>
                <Badge
                    variant="danger"
                    className="gap-1 border-0 px-2.5 font-semibold tabular-nums"
                >
                    <DigitPopIn value={lost} />
                    <span className="font-semibold opacity-90">Lost</span>
                </Badge>
            </div>
        </div>
    );
}

function EmptyPipeline({ className }: { className?: string }) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="pipeline-card-heading"
        >
            <CardLabel info={PIPELINE_INFO}>
                <span id="pipeline-card-heading">Pipeline</span>
            </CardLabel>

            <EmptyState
                icon={Users}
                heading="No clients yet"
                description="Add a buyer or tenant to start tracking deals."
            >
                <TextLinkButton href="/broker/clients/new">Add client</TextLinkButton>
            </EmptyState>
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
                <ShortcutTooltip shortcutId="clients" label="Clients">
                    <div className="flex flex-1 flex-col justify-center gap-3.5 pbe-3.5 min-block-0">
                        <PipelineSegmentedBar stages={data.stages} />
                        <PipelineLegend stages={data.stages} />
                    </div>
                </ShortcutTooltip>

                <div className="shrink-0 inline-full">
                    <div
                        className="
                          flex flex-col divide-y divide-border-warm/50 border-bs
                          border-border-warm/50
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
