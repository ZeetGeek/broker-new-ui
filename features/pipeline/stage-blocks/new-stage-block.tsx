import { formatRelativePast } from "@/lib/format/date";

import type { DealItem, DealSource } from "@/features/pipeline/types";

const SOURCE_LABEL: Record<DealSource, string> = {
    website: "Website",
    walk_in: "Walk-in",
    reference: "Reference",
};

export function NewStageBlock({ deal }: { deal: DealItem }) {
    const addedAt = deal.createdAt ?? deal.stageEnteredAt;
    const added = `Added ${formatRelativePast(new Date(addedAt), new Date())}`;
    const source = deal.source ? SOURCE_LABEL[deal.source] : null;

    return <p className="body-xs truncate text-ink">{source ? `${added} · ${source}` : added}</p>;
}
