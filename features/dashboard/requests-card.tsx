import { cn } from "@/lib/utils";

import type { RequestCounts } from "./mock-data";

export type RequestsCardProps = {
    counts: RequestCounts;
    className?: string;
};

function RequestRow({
    label,
    count,
    emphasize,
}: {
    label: string;
    count: number;
    emphasize?: "brand" | "muted";
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <span className="body text-ink">{label}</span>
            <span
                className={cn(
                    "tabular body font-semibold",
                    emphasize === "brand" && "text-brand",
                    emphasize === "muted" && "text-ink-muted",
                    !emphasize && "text-ink",
                )}
            >
                {count}
            </span>
        </div>
    );
}

export function RequestsCard({ counts, className }: RequestsCardProps) {
    return (
        <section className={cn("flex flex-col rounded-card bg-surface p-4 md:p-5", className)}>
            <p className="eyebrow">Your requests</p>

            <div className="mbs-3 flex flex-col divide-y divide-border-warm">
                <RequestRow label="Waiting on owner" count={counts.waitingOnOwner} />
                <RequestRow label="Approved" count={counts.approved} emphasize="brand" />
                <RequestRow label="Not accepted" count={counts.notAccepted} emphasize="muted" />
            </div>
        </section>
    );
}
