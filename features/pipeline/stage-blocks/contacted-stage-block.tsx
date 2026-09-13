import { formatDateShort, formatRelativePast } from "@/lib/format/date";

import type { DealContactMethod, DealItem } from "@/features/pipeline/types";

const METHOD_LABEL: Record<DealContactMethod, string> = {
    call: "Call",
    whatsapp: "WhatsApp",
    visit: "Visit",
};

export function ContactedStageBlock({ deal }: { deal: DealItem }) {
    const lastLine = deal.lastContactedAt
        ? `Last contact ${formatRelativePast(new Date(deal.lastContactedAt), new Date())}${
              deal.lastContactMethod ? ` · ${METHOD_LABEL[deal.lastContactMethod]}` : ""
          }`
        : "No contact logged yet";

    return (
        <div className="flex flex-col gap-0.5">
            <p className="body-xs truncate text-ink">{lastLine}</p>
            {deal.nextFollowUpAt ? (
                <p className="body-xs truncate text-ink">
                    Follow up {formatDateShort(new Date(deal.nextFollowUpAt))}
                </p>
            ) : null}
        </div>
    );
}
