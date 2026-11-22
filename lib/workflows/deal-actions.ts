import { pipelineApi } from "@/lib/api/pipeline";

import { markSoldBlockedReason, saleConfirmMode } from "@/features/pipeline/sale-mode";
import type { StageMoveDetails } from "@/features/pipeline/stage-note-modal";
import type { DealItem, DealStatus } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

/** Keep the shared overlay's sale rules identical to the Pipeline confirmation flow. */
export async function saveWorkflowDealStage(
    snapshot: DealItem,
    status: DealStatus,
    note: string,
    details: StageMoveDetails,
    ownerPortalOn: boolean,
) {
    const latest = await pipelineApi.get(snapshot.id);
    if (latest.status !== snapshot.status) {
        throw new Error(
            "This deal has changed. Close this confirmation and review its latest details.",
        );
    }
    const mode = saleConfirmMode({
        isBrokerListing: Boolean(latest.property.isBrokerListing),
        ownerPortalOn,
    });
    if (status === "closed") {
        const blocked = markSoldBlockedReason(latest, mode);
        if (blocked) throw new Error(blocked);
        if (
            details.closedAmountInr == null ||
            !Number.isFinite(details.closedAmountInr) ||
            details.closedAmountInr <= 0
        ) {
            throw new Error("Enter the final price before marking this deal as sold.");
        }
        if (mode === "owner") {
            await pipelineApi.makeOffer(latest.id, details.closedAmountInr, note);
            return "owner" as const;
        }
    }
    if (status === "lost" && !details.lostReason) throw new Error("Choose why the deal was lost.");
    await pipelineApi.setStage(latest.id, status, { note, ...details });
    return "immediate" as const;
}

export async function saveWorkflowDealOffer(
    id: string,
    amount: number,
    notes: string,
    ownerPortalOn: boolean,
) {
    if (!ownerPortalOn) throw new Error("Offers are not available in this portal.");
    const latest = await pipelineApi.get(id);
    if (!isLiveStage(latest.status))
        throw new Error("This deal is finished. Review its latest details before adding an offer.");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid offer amount.");
    await pipelineApi.makeOffer(id, amount, notes);
}
