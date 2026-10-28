import type { LeadStageKey } from "@/lib/api/property-analytics";
import { LEAD_STAGES } from "@/lib/api/property-analytics";

export const STAGE_LABEL: Record<LeadStageKey, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed_won: "Sold",
    closed_lost: "Lost",
};

/**
 * Bar and legend fills. Open stages use the pipeline `stage-*` tokens (offer made
 * shares negotiation's, as on the board); outcomes stay in brand and neutral so
 * `urgent` and `danger` keep their reserved meanings.
 */
export const STAGE_BAR_CLASS: Record<LeadStageKey, string> = {
    new: "bg-stage-1",
    contacted: "bg-stage-2",
    site_visit: "bg-stage-3",
    negotiation: "bg-stage-4",
    offer_made: "bg-stage-4/60",
    closed_won: "bg-brand",
    closed_lost: "bg-ink-subtle",
};

export const OFFER_STATUS_LABEL = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
} as const;

export const SHOWING_STATUS_LABEL: Record<string, string> = {
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    completed: "Done",
    cancelled: "Cancelled",
    no_show: "No show",
};

export function stageParts(counts: Partial<Record<LeadStageKey, number>>): {
    key: LeadStageKey;
    count: number;
}[] {
    return LEAD_STAGES.flatMap((key) => {
        const count = counts[key] ?? 0;
        return count > 0 ? [{ key, count }] : [];
    });
}
