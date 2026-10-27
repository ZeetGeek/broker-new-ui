import type { LeadStageKey, StageCounts } from "@/lib/api/property-analytics";

import { cn } from "@/lib/utils";

import { STAGE_BAR_CLASS, STAGE_LABEL, stageParts } from "./stage-meta";

export function LeadStageBar({
    counts,
    className,
}: {
    counts: Partial<Record<LeadStageKey, number>>;
    className?: string;
}) {
    const parts = stageParts(counts);
    const total = parts.reduce((sum, part) => sum + part.count, 0);

    if (total === 0) {
        return (
            <div
                className={cn("block-2 rounded-full bg-surface-muted", className)}
                aria-hidden
            />
        );
    }

    const label = parts.map((part) => `${part.count} ${STAGE_LABEL[part.key]}`).join(", ");

    return (
        <div
            role="img"
            aria-label={label}
            className={cn("flex block-2 overflow-hidden rounded-full", className)}
        >
            {parts.map((part) => (
                <div
                    key={part.key}
                    className={cn("min-inline-0", STAGE_BAR_CLASS[part.key])}
                    style={{ flexGrow: part.count, flexBasis: 0 }}
                />
            ))}
        </div>
    );
}

export function LeadStageLegend({ counts }: { counts: StageCounts }) {
    const parts = stageParts(counts);
    if (parts.length === 0) return null;

    return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {parts.map((part) => (
                <li key={part.key} className="flex items-center gap-1.5 body-xs text-ink-muted">
                    <span
                        aria-hidden
                        className={cn("block-2 inline-2 rounded-full", STAGE_BAR_CLASS[part.key])}
                    />
                    <span className="text-ink">{STAGE_LABEL[part.key]}</span>
                    <span className="tabular">{part.count}</span>
                </li>
            ))}
        </ul>
    );
}
