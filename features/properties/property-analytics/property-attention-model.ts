import type { BrokerVisit } from "@/lib/api/site-visits";
import { brokerPipelineDealHref, brokerVisitHref } from "@/lib/routes/broker";
import { formatVisitDate, formatVisitTime, inputValueToUtc } from "@/lib/visits/time";

import { visitState } from "@/features/new-site-visits/model";
import { daysWithoutMovement, dealAttention } from "@/features/pipeline/deal-attention";
import { type DealItem, isLiveStage } from "@/features/pipeline/types";
import { type Task, taskDueLabel, taskGroup } from "@/features/tasks/model";

export type PropertyAttentionItem = {
    id: string;
    source: "Tasks" | "Pipeline" | "Visits";
    title: string;
    detail: string;
    href: string;
    urgent: boolean;
    sortAt: number;
};

/** Same records and attention rules as Tasks, Pipeline and Visits, scoped by IDs. */
export function buildPropertyAttention(
    propertyId: string,
    tasks: Task[],
    deals: DealItem[],
    visits: BrokerVisit[],
    now = Date.now(),
): PropertyAttentionItem[] {
    const propertyDeals = deals.filter((deal) => deal.property.id === propertyId);
    const liveDeals = propertyDeals.filter(
        (deal) => isLiveStage(deal.status) && !deal.property.isSold,
    );
    const liveClientIds = new Set(liveDeals.map((deal) => deal.buyer.id));
    const relevantTasks = tasks.filter(
        (task) =>
            !task.completedAt &&
            !task.deletedAt &&
            (task.propertyId === propertyId ||
                (!task.propertyId && !!task.clientId && liveClientIds.has(task.clientId))),
    );
    const plannedClients = new Set(
        relevantTasks
            .filter((task) => taskGroup(task, now) !== "undated")
            .map((task) => task.clientId),
    );
    const items: PropertyAttentionItem[] = [];

    for (const task of relevantTasks) {
        const group = taskGroup(task, now);
        if (group !== "overdue" && group !== "today") continue;
        const client =
            task.client?.name ||
            propertyDeals.find((deal) => deal.buyer.id === task.clientId)?.buyer.name;
        const date = task.dueDate || task.startDate;
        const time = task.dueDate ? task.dueTime : task.startTime;
        items.push({
            id: `task:${task.id}`,
            source: "Tasks",
            title: task.title,
            detail: [client, taskDueLabel(task, now), !task.propertyId ? "Client task" : null]
                .filter(Boolean)
                .join(" · "),
            href: `/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`,
            urgent: group === "overdue",
            sortAt: date ? Date.parse(inputValueToUtc(`${date}T${time || "23:59"}`)) : now,
        });
    }
    for (const visit of visits) {
        if (visit.propertyId !== propertyId || visitState(visit, now) !== "needs_update") continue;
        items.push({
            id: `visit:${visit.id}`,
            source: "Visits",
            title: "Record the visit outcome",
            detail: `${visit.clientName} · ${formatVisitDate(visit.startsAt)}, ${formatVisitTime(visit.startsAt)} IST`,
            href: brokerVisitHref(visit.id),
            urgent: true,
            sortAt: Date.parse(visit.endsAt),
        });
    }
    for (const deal of liveDeals) {
        // A planned task already tells the broker when to follow up; don't invent another deadline.
        if (plannedClients.has(deal.buyer.id)) continue;
        const tone = dealAttention(deal);
        if (tone !== "slow" && tone !== "quiet") continue;
        const days = daysWithoutMovement(deal)!;
        items.push({
            id: `deal:${deal.id}`,
            source: "Pipeline",
            title: `Follow up with ${deal.buyer.name}`,
            detail: deal.lastContactedAt
                ? `No contact logged for ${days} days`
                : `${days} days in this stage · No contact logged`,
            href: brokerPipelineDealHref(deal.id),
            urgent: false,
            sortAt: Date.parse(deal.lastContactedAt || deal.stageEnteredAt!),
        });
    }
    return items.sort(
        (a, b) =>
            Number(b.urgent) - Number(a.urgent) || a.sortAt - b.sortAt || a.id.localeCompare(b.id),
    );
}
