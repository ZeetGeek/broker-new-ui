"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { BrokerSiteVisit, VisitOutcome } from "@/features/site-visits/broker/model";

export function useVisitActions() {
    const queryClient = useQueryClient();
    const update = (id: string, patch: Partial<BrokerSiteVisit>) => queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => old.map((visit) => visit.id === id ? { ...visit, ...patch, updatedAt: new Date().toISOString() } : visit));
    const snapshot = () => queryClient.getQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] });
    const restore = (previous?: ReturnType<typeof snapshot>) => previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
    const outcome = useMutation({
        mutationFn: ({ visit, outcome }: { visit: BrokerSiteVisit; outcome: VisitOutcome }) => brokerVisitsApi.recordOutcome(visit, outcome),
        onMutate: async ({ visit, outcome: value }) => {
            await queryClient.cancelQueries({ queryKey: ["visits"] });
            const previous = snapshot();
            update(visit.id, { status: "completed", outcome: value });
            return { previous };
        },
        onError: (_error, _input, context) => restore(context?.previous),
        onSuccess: ({ id, outcome: value }) => {
            update(id, { status: "completed", outcome: value });
            void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
            void queryClient.invalidateQueries({ queryKey: ["clients"] });
        },
    });
    const reschedule = useMutation({
        mutationFn: ({ id, startsAt, endsAt }: { id: string; startsAt: string; endsAt: string }) => brokerVisitsApi.reschedule(id, startsAt, endsAt),
        onMutate: async ({ id, startsAt, endsAt }) => {
            await queryClient.cancelQueries({ queryKey: ["visits"] });
            const previous = snapshot();
            update(id, { startsAt, endsAt, status: "reschedule_pending" });
            return { previous };
        },
        onError: (_error, _input, context) => restore(context?.previous),
        onSuccess: ({ id, startsAt, endsAt }) => update(id, { startsAt, endsAt, status: "reschedule_pending" }),
    });
    const cancel = useMutation({
        mutationFn: brokerVisitsApi.cancelVisit,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["visits"] });
            const previous = snapshot();
            update(id, { status: "cancelled_by_broker" });
            return { previous };
        },
        onError: (_error, _input, context) => restore(context?.previous),
        onSuccess: (id) => update(id, { status: "cancelled_by_broker" }),
    });
    const checklist = (id: string, value: NonNullable<BrokerSiteVisit["checklist"]>) => update(id, { checklist: value });
    return { outcome, reschedule, cancel, checklist };
}

