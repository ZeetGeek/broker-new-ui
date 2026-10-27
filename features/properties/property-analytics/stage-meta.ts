import type { LeadStageKey } from "@/lib/api/property-analytics";
import { LEAD_STAGES } from "@/lib/api/property-analytics";

export const STAGE_LABEL: Record<LeadStageKey, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed_won: "Closed won",
    closed_lost: "Closed lost",
};

/** Solid fills for the stacked bar. Stage tokens for the open pipeline, then outcome colors. */
export const STAGE_BAR_CLASS: Record<LeadStageKey, string> = {
    new: "bg-stage-1",
    contacted: "bg-stage-2",
    site_visit: "bg-stage-3",
    negotiation: "bg-stage-4",
    offer_made: "bg-urgent",
    closed_won: "bg-success",
    closed_lost: "bg-danger",
};

export const STAGE_BADGE_COLOR = {
    new: "sky",
    contacted: "blue",
    site_visit: "indigo",
    negotiation: "amber",
    offer_made: "orange",
    closed_won: "emerald",
    closed_lost: "red",
} as const;

export const OFFER_STATUS_LABEL = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
} as const;

export const SHOWING_STATUS_LABEL: Record<string, string> = {
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    completed: "Completed",
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
