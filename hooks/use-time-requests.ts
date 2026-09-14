"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { brokerVisitsApi } from "@/lib/api/broker-visits";

import type { BrokerSiteVisit, PersonSummary, PropertyWithSlots, TimeRequest } from "@/features/site-visits/broker/model";

export function useTimeRequests() {
    return useQuery({ queryKey: ["timeRequests", "all"], queryFn: () => brokerVisitsApi.requests(), staleTime: 60_000, refetchOnWindowFocus: true });
}

export function useCreateTimeRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { item: PropertyWithSlots; buyers: PersonSummary[]; preferredStartsAt: string; preferredEndsAt: string; alternates: { startsAt: string; endsAt: string }[]; message?: string }) => brokerVisitsApi.createTimeRequest(input),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: ["timeRequests"] });
            const previous = queryClient.getQueriesData<TimeRequest[]>({ queryKey: ["timeRequests"] });
            const now = new Date().toISOString();
            const optimistic: TimeRequest = { id: `optimistic_request_${Date.now()}`, propertyId: input.item.property.id, ownerId: input.item.owner.id, brokerId: "broker_me", buyerIds: input.buyers.map((buyer) => buyer.id), preferredStartsAt: input.preferredStartsAt, preferredEndsAt: input.preferredEndsAt, alternates: input.alternates, message: input.message, status: "pending", expiresAt: input.preferredStartsAt, createdAt: now, property: input.item.property, owner: input.item.owner, buyers: input.buyers };
            queryClient.setQueriesData<TimeRequest[]>({ queryKey: ["timeRequests"] }, (old = []) => [optimistic, ...old]);
            queryClient.setQueriesData<PropertyWithSlots[]>({ queryKey: ["slots"] }, (old = []) => old.map((item) => item.property.id !== input.item.property.id ? item : { ...item, slots: item.slots.map((slot, index) => index === 0 ? { ...slot, requestedByMe: true } : slot) }));
            return { previous, optimistic };
        },
        onError: (_error, _input, context) => context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value)),
        onSuccess: (request, _input, context) => queryClient.setQueriesData<TimeRequest[]>({ queryKey: ["timeRequests"] }, (old = []) => old.map((item) => item.id === context?.optimistic.id ? request : item)),
    });
}

export function useRequestActions() {
    const queryClient = useQueryClient();
    const patch = (id: string, update: Partial<TimeRequest>) => queryClient.setQueriesData<TimeRequest[]>({ queryKey: ["timeRequests"] }, (old = []) => old.map((request) => request.id === id ? { ...request, ...update } : request));
    const withdraw = useMutation({ mutationFn: brokerVisitsApi.withdrawRequest, onSuccess: (id) => patch(id, { status: "withdrawn" }) });
    const nudge = useMutation({ mutationFn: brokerVisitsApi.nudgeRequest, onSuccess: (id) => patch(id, { lastNudgedAt: new Date().toISOString() }) });
    const decline = useMutation({ mutationFn: brokerVisitsApi.declineCounter, onSuccess: (id) => patch(id, { status: "declined", declineReason: "You declined the owner’s proposed time." }) });
    const accept = useMutation({ mutationFn: (request: TimeRequest) => brokerVisitsApi.acceptCounter(request), onSuccess: (visit: BrokerSiteVisit, request) => {
        patch(request.id, { status: "accepted", createdVisitId: visit.id });
        queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => [visit, ...old]);
    } });
    return { withdraw, nudge, decline, accept };
}
