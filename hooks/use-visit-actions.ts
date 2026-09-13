"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { BrokerSiteVisit, VisitOutcome } from "@/features/site-visits/broker/model";

export function useVisitActions() {
    const queryClient = useQueryClient();
    const update = (id: string, patch: Partial<BrokerSiteVisit>) => queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => old.map((visit) => visit.id === id ? { ...visit, ...patch, updatedAt: new Date().toISOString() } : visit));
    const outcome = useMutation({ mutationFn: ({ id, outcome }: { id: string; outcome: VisitOutcome }) => brokerVisitsApi.recordOutcome(id, outcome), onSuccess: ({ id, outcome: value }) => update(id, { status: "completed", outcome: value }) });
    const reschedule = useMutation({ mutationFn: ({ id, startsAt, endsAt }: { id: string; startsAt: string; endsAt: string }) => brokerVisitsApi.reschedule(id, startsAt, endsAt), onSuccess: ({ id, startsAt, endsAt }) => update(id, { startsAt, endsAt, status: "reschedule_pending" }) });
    const cancel = useMutation({ mutationFn: brokerVisitsApi.cancelVisit, onSuccess: (id) => update(id, { status: "cancelled_by_broker" }) });
    const checklist = (id: string, value: NonNullable<BrokerSiteVisit["checklist"]>) => update(id, { checklist: value });
    return { outcome, reschedule, cancel, checklist };
}

