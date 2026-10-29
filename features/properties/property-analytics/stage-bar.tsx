import type { LeadStageKey } from "@/lib/api/property-analytics";
import { cn } from "@/lib/utils";

import { STAGE_BAR_CLASS, STAGE_LABEL, stageParts } from "./stage-meta";

type Counts = Partial<Record<LeadStageKey, number>>;

export function LeadStageBar({ counts, className }: { counts: Counts; className?: string }) {
    const parts = stageParts(counts);

    if (parts.length === 0) {
        return (
            <div aria-hidden className={cn("rounded-full bg-surface-muted block-3", className)} />
        );
    }

    const label = parts.map((part) => `${part.count} ${STAGE_LABEL[part.key]}`).join(", ");

    return (
        <div
            role="img"
            aria-label={`Leads by stage: ${label}`}
            className={cn("flex gap-0.5 overflow-hidden rounded-full block-3", className)}
        >
            {parts.map((part) => (
                <div
                    key={part.key}
                    className={cn("min-inline-1", STAGE_BAR_CLASS[part.key])}
                    style={{ flexGrow: part.count, flexBasis: 0 }}
                />
            ))}
        </div>
    );
}

export function LeadStageLegend({ counts }: { counts: Counts }) {
    const parts = stageParts(counts);
    if (parts.length === 0) return null;

    return (
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {parts.map((part) => (
                <li key={part.key} className="body-sm flex items-center gap-2">
                    <span
                        aria-hidden
                        className={cn(
                            "shrink-0 rounded-full block-2 inline-2",
                            STAGE_BAR_CLASS[part.key],
                        )}
                    />
                    <span className="text-ink-muted">{STAGE_LABEL[part.key]}</span>
                    <span className="font-semibold text-ink tabular-nums">{part.count}</span>
                </li>
            ))}
        </ul>
    );
}
