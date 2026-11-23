import type { EarningsReport } from "@/features/earnings/earnings-math";
import type { DealStage } from "@/features/pipeline/types";

const STAGES: { id: DealStage; label: string }[] = [
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "visit", label: "Site visit" },
    { id: "negotiation", label: "Negotiation" },
];

export type PipelineStageView = {
    id: DealStage;
    label: string;
    count: number;
    saleValueInr: number;
    rentValueInr: number;
    /** Tailwind class for the legend swatch. */
    color: string;
    /** CSS colour for the gauge segment. */
    chartColor: string;
};

export type PipelineView = {
    total: number;
    saleValueInr: number;
    rentValueInr: number;
    stages: PipelineStageView[];
};

/** The dashboard's pipeline card, read from the earnings report's live deals. */
export function pipelineView(live: EarningsReport["live"]): PipelineView {
    return {
        total: live.count,
        saleValueInr: live.saleValueInr,
        // Older APIs lack the per-stage values: show counts rather than crash.
        rentValueInr: live.rentValueInr ?? 0,
        stages: STAGES.map((stage, index) => ({
            ...stage,
            count: live.stageCounts[stage.id] ?? 0,
            saleValueInr: live.stageSaleValueInr?.[stage.id] ?? 0,
            rentValueInr: live.stageMonthlyRentInr?.[stage.id] ?? 0,
            color: `bg-stage-${index + 1}`,
            chartColor: `var(--color-stage-${index + 1})`,
        })),
    };
}
