"use client";

import { FilterChip } from "@/components/shared/filter-chip";

export function PipelineFinishedToggle({
    count,
    active,
    onChange,
}: {
    count: number;
    active: boolean;
    onChange: (active: boolean) => void;
}) {
    return (
        <FilterChip
            label="Finished"
            count={count}
            isActive={active}
            onClick={() => onChange(!active)}
            description="Completed and lost deals"
        />
    );
}
