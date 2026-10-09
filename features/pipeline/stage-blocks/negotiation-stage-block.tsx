import { daysSince } from "@/lib/api/pipeline";
import { formatPriceInr } from "@/lib/format/price";

import type { DealItem } from "@/features/pipeline/types";

function offerGap(askInr: number, offerInr: number): { text: string; isGap: boolean } {
    const delta = offerInr - askInr;
    const abs = formatPriceInr(Math.abs(delta));
    if (delta === 0) return { text: "matches ask", isGap: false };
    return {
        text: delta > 0 ? `${abs} over ask` : `${abs} under ask`,
        isGap: true,
    };
}

export function NegotiationStageBlock({ deal }: { deal: DealItem }) {
    const ask = deal.property.amountInr;
    const offer = deal.offerAmountInr;
    const pendingDays = daysSince(deal.stageEnteredAt) ?? 0;

    if (offer == null) {
        return <p className="body-xs text-ink">No offer yet</p>;
    }

    const gap = offerGap(ask, offer);
    const statusLine =
        deal.offerStatus === "pending"
            ? `Pending owner response · ${pendingDays} ${pendingDays === 1 ? "day" : "days"}`
            : deal.offerStatus === "rejected"
              ? "Offer rejected · revise it"
              : deal.offerStatus === "accepted"
                ? "Owner accepted"
                : null;

    return (
        <div className="flex flex-col gap-0.5">
            <p className="body-xs text-ink">
                Offer <span className="tabular font-semibold">{formatPriceInr(offer)}</span>
                {" · "}
                <span className={gap.isGap ? "tabular font-medium text-urgent" : "text-ink"}>
                    {gap.text}
                </span>
            </p>
            {statusLine ? <p className="body-xs truncate text-ink">{statusLine}</p> : null}
        </div>
    );
}
