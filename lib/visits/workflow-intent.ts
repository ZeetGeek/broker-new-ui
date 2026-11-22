import type { BookableLead, BrokerVisit } from "@/lib/api/site-visits";

import {
    type IntentView,
    matchIntent,
    resolveScheduleIntent,
    type ScheduleIntent,
} from "@/features/new-site-visits/model";

function matchingLeads(intent: ScheduleIntent, leads: BookableLead[]): BookableLead[] {
    const explicit = matchIntent(intent, leads);
    if (explicit) return [explicit];
    if (intent.leadId || Boolean(intent.clientId) === Boolean(intent.propertyId)) return [];
    return [
        ...new Map(
            leads
                .filter(
                    (lead) =>
                        (!intent.clientId || lead.clientId === intent.clientId) &&
                        (!intent.propertyId || lead.propertyId === intent.propertyId),
                )
                .map((lead) => [lead.leadId, lead]),
        ).values(),
    ];
}

/** A partial context may preselect only one eligible deal, never the first of several. */
export function matchWorkflowVisitIntent(
    intent: ScheduleIntent,
    leads: BookableLead[],
): BookableLead | null {
    const matches = matchingLeads(intent, leads);
    return matches.length === 1 ? matches[0] : null;
}

export function resolveWorkflowVisitIntent(
    intent: ScheduleIntent,
    leads: BookableLead[],
    active: BrokerVisit | null,
): IntentView {
    const matches = matchingLeads(intent, leads);
    if (matches.length > 1) return { kind: "schedule", intent: null, intentMissed: false };
    const lead = matches[0];
    return lead
        ? resolveScheduleIntent({ leadId: lead.leadId }, leads, active)
        : { kind: "schedule", intent: null, intentMissed: true };
}
