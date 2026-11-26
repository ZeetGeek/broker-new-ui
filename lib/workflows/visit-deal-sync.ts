import { pipelineApi, sortDeals } from "@/lib/api/pipeline";
import { type BrokerVisit, siteVisitsApi } from "@/lib/api/site-visits";
import { VisitSyncError } from "@/lib/visits/sync-error";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";

import type {
    DealDetail,
    DealHistoryEntry,
    DealsFilters,
    DealStage,
    DealStatus,
} from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

const savingLeads = new Set<string>();

async function forLead<T>(id: string, save: () => Promise<T>): Promise<T> {
    if (savingLeads.has(id))
        throw new VisitSyncError("This deal is still saving. Try again in a moment.");
    savingLeads.add(id);
    try {
        return await save();
    } finally {
        savingLeads.delete(id);
    }
}

function active(visit: BrokerVisit) {
    return visit.status === "scheduled" || visit.status === "confirmed";
}

async function activeVisits(leadId: string) {
    const page = await siteVisitsApi.searchSource({ tab: "active", leadId, sort: "start_asc" });
    return page.items.filter((visit) => visit.leadId === leadId && active(visit));
}

/** Ignore same-stage notes/calls and non-stage events when restoring a cancelled visit's deal. */
export function stageBeforeVisit(history: DealHistoryEntry[]): DealStage {
    const stages: Record<string, DealStage> = {
        new: "new",
        contacted: "contacted",
        site_visit: "visit",
        visit: "visit",
        negotiation: "negotiation",
        offer_made: "negotiation",
    };
    const ordered = history
        .map((entry, index) => ({ ...entry, index }))
        .sort((a, b) =>
            a.at && b.at
                ? Date.parse(a.at) - Date.parse(b.at) || a.index - b.index
                : a.index - b.index,
        );
    for (let index = ordered.length - 1; index >= 0; index--) {
        const stage = stages[ordered[index].status];
        if (stage && stage !== "visit") return stage;
    }
    return "contacted";
}

function matchesBooking(
    visit: BrokerVisit | null,
    input: Parameters<typeof siteVisitsApi.book>[0],
) {
    return (
        visit != null &&
        active(visit) &&
        visit.leadId === input.leadId &&
        visit.propertyId === input.propertyId &&
        Date.parse(visit.startsAt) === Date.parse(input.startAt) &&
        visit.durationMinutes === input.durationMinutes
    );
}

async function finishBooking(deal: DealDetail) {
    const current = await pipelineApi.get(deal.id);
    if (current.status === "visit") return;
    if (current.status !== deal.status || !isLiveStage(current.status) || current.property.isSold)
        throw new VisitSyncError(
            "The visit was saved, but the deal changed. Review Pipeline before changing its stage.",
        );
    try {
        await pipelineApi.setStage(deal.id, "visit");
    } catch {
        throw new VisitSyncError(
            "The visit was saved, but Pipeline could not be updated. Save again to finish syncing; a second visit will not be created.",
        );
    }
}

/** Save the booking first. Dismissing the form or a rejected booking never moves the deal. */
export async function bookVisitForDeal(input: Parameters<typeof siteVisitsApi.book>[0]) {
    return forLead(input.leadId, async () => {
        const deal = await pipelineApi.get(input.leadId);
        if (!isLiveStage(deal.status) || deal.property.isSold)
            throw new VisitSyncError(
                "This deal is finished. Choose an active deal to schedule a visit.",
            );
        if (deal.property.id !== input.propertyId)
            throw new VisitSyncError(
                "This property no longer matches the deal. Reopen the scheduler.",
            );
        const existing = (await activeVisits(deal.id)).find((visit) =>
            matchesBooking(visit, input),
        );
        // Retry the same booking without blocking a separate follow-up visit on another date.
        if (existing) return finishBooking(deal);
        try {
            await siteVisitsApi.book(input);
        } catch (error) {
            let booked: BrokerVisit | null;
            try {
                // A lost response can still mean the booking succeeded.
                booked =
                    (await activeVisits(deal.id)).find((visit) => matchesBooking(visit, input)) ??
                    null;
            } catch {
                throw new VisitSyncError(
                    "Could not verify whether the visit was saved. Check Visits before trying again.",
                );
            }
            if (matchesBooking(booked, input)) return finishBooking(deal);
            throw error;
        }
        await finishBooking(deal);
    });
}

/** Cancel active bookings only, retaining completed and not-attended history. */
export async function cancelDealVisits(leadId: string) {
    try {
        for (const visit of await activeVisits(leadId)) await siteVisitsApi.cancel(visit.id);
    } finally {
        notifyWorkflowSaved("visit");
    }
}

async function updateActiveVisit(id: string, save: () => Promise<BrokerVisit>) {
    const visit = await siteVisitsApi.get(id);
    if (!visit || !active(visit))
        throw new VisitSyncError("This visit can no longer be updated. Refresh Visits.");
    return forLead(visit.leadId, async () => {
        const deal = await pipelineApi.get(visit.leadId);
        if (!isLiveStage(deal.status) || deal.property.isSold)
            throw new VisitSyncError("This deal is finished. Its visit cannot be updated.");
        const updated = await save();
        const current = await pipelineApi.get(deal.id);
        if (current.status !== "visit") {
            try {
                if (current.status !== deal.status)
                    throw new VisitSyncError("This deal changed while the visit was saving.");
                await pipelineApi.setStage(deal.id, "visit");
            } catch {
                throw new VisitSyncError(
                    "The visit was saved, but Pipeline could not be updated. Review the deal and save the visit again to finish syncing.",
                );
            }
        }
        return updated;
    });
}

export function rescheduleVisitForDeal(
    id: string,
    input: Parameters<typeof siteVisitsApi.reschedule>[1],
) {
    return updateActiveVisit(id, () => siteVisitsApi.reschedule(id, input));
}

export function updateVisitRemindersForDeal(id: string, reminders: number[]) {
    return updateActiveVisit(id, () => siteVisitsApi.updateReminders(id, reminders));
}

export async function moveDealWithVisits(
    deal: DealDetail,
    status: DealStatus,
    options: Parameters<typeof pipelineApi.setStage>[2],
) {
    return forLead(deal.id, async () => {
        if (status === "visit" && !(await siteVisitsApi.activeForLead(deal.id)))
            throw new VisitSyncError("Schedule a visit before moving this deal to Site visit.");
        let cancelled = false;
        if (deal.status === "visit" && status !== "visit") {
            for (const visit of await activeVisits(deal.id)) {
                await siteVisitsApi.cancel(visit.id);
                cancelled = true;
            }
        }
        try {
            await pipelineApi.setStage(deal.id, status, options);
        } catch (error) {
            if (cancelled)
                throw new VisitSyncError(
                    "The visit was cancelled, but the deal could not be moved. Try moving the deal again.",
                );
            throw error;
        }
    }).finally(() => notifyWorkflowSaved("deal"));
}

/** Another active booking keeps the deal in Site visit. Historical outcomes never move it back. */
export async function cancelVisitForDeal(id: string) {
    const visit = await siteVisitsApi.get(id);
    if (!visit)
        throw new VisitSyncError(
            "This visit is no longer available. Refresh Visits and try again.",
        );
    if (visit.status === "completed" || visit.status === "no_show")
        throw new VisitSyncError("This visit has already been marked. Its history has been kept.");
    return forLead(visit.leadId, async () => {
        const before = await pipelineApi.get(visit.leadId);
        if (visit.status !== "cancelled") await siteVisitsApi.cancel(id);
        try {
            if ((await activeVisits(visit.leadId)).length) return;
            const current = await pipelineApi.get(visit.leadId);
            if (current.status === "visit")
                await pipelineApi.setStage(current.id, stageBeforeVisit(before.history));
        } catch {
            throw new VisitSyncError(
                "The visit was cancelled, but Pipeline could not be updated. Try cancelling again to finish syncing.",
            );
        }
    });
}

/** Both pages read dates from the same bookings, including in mock mode. */
export async function listDealsWithVisits(filters: DealsFilters, signal?: AbortSignal) {
    const [result, visits] = await Promise.all([
        pipelineApi.list(filters, signal),
        siteVisitsApi.searchSource({ tab: "active", sort: "start_asc" }, signal),
    ]);
    const dates = new Map<string, string>();
    for (const visit of visits.items) {
        if (
            active(visit) &&
            (!dates.has(visit.leadId) || visit.startsAt < dates.get(visit.leadId)!)
        )
            dates.set(visit.leadId, visit.startsAt);
    }
    return {
        ...result,
        items: sortDeals(
            result.items.map((deal) => ({ ...deal, nextVisitAt: dates.get(deal.id) ?? null })),
            filters.sort,
        ),
    };
}

export async function getDealWithVisit(id: string): Promise<DealDetail> {
    const [deal, visit] = await Promise.all([pipelineApi.get(id), siteVisitsApi.activeForLead(id)]);
    return { ...deal, nextVisitAt: visit?.startsAt ?? null };
}
