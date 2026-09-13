"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { brokerVisitsApi, SlotTakenError } from "@/lib/api/broker-visits";

import type { BrokerSiteVisit, PersonSummary, PropertyWithSlots, VisitSlot } from "@/features/site-visits/broker/model";

type BookInput = { item: PropertyWithSlots; slot: VisitSlot; buyers: PersonSummary[]; note: string; remindBuyer: boolean };

function optimisticVisit(input: BookInput): BrokerSiteVisit {
    const now = new Date().toISOString();
    return {
        id: `optimistic_${input.slot.id}`,
        source: "slot", slotId: input.slot.id, propertyId: input.item.property.id, propertySource: "marketplace", ownerId: input.item.owner.id, brokerId: "broker_me", buyerIds: input.buyers.map((buyer) => buyer.id), startsAt: input.slot.startsAt, endsAt: input.slot.endsAt, status: input.slot.autoConfirm ? "confirmed" : "awaiting_owner", brokerNote: input.note || undefined, ownerNote: input.slot.note, remindBuyer: input.remindBuyer, createdAt: now, updatedAt: now, property: input.item.property, owner: input.item.owner, buyers: input.buyers, distanceKm: input.item.distanceKm,
    };
}

export function useBookSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: BookInput) => brokerVisitsApi.book(input),
        onMutate: async (input) => {
            await Promise.all([queryClient.cancelQueries({ queryKey: ["visits"] }), queryClient.cancelQueries({ queryKey: ["slots"] })]);
            const visitSnapshots = queryClient.getQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] });
            const slotSnapshots = queryClient.getQueriesData<PropertyWithSlots[]>({ queryKey: ["slots"] });
            const draft = optimisticVisit(input);
            queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => [draft, ...old]);
            queryClient.setQueriesData<PropertyWithSlots[]>({ queryKey: ["slots"] }, (old = []) => old.map((item) => item.property.id !== input.item.property.id ? item : { ...item, slots: item.slots.map((slot) => slot.id !== input.slot.id ? slot : { ...slot, bookedVisitId: draft.id, bookedBuyerName: input.buyers[0]?.name }) }));
            return { visitSnapshots, slotSnapshots, draftId: draft.id, input };
        },
        onError: (error, _input, context) => {
            context?.visitSnapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
            context?.slotSnapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
            if (error instanceof SlotTakenError && context) {
                queryClient.setQueriesData<PropertyWithSlots[]>({ queryKey: ["slots"] }, (old = []) => old.map((item) => item.property.id !== context.input.item.property.id ? item : { ...item, slots: item.slots.map((slot) => slot.id !== context.input.slot.id ? slot : { ...slot, status: "full", bookedCount: slot.capacity }) }));
            }
        },
        onSuccess: (visit, _input, context) => {
            queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => old.map((item) => item.id === context?.draftId ? visit : item));
            queryClient.setQueriesData<PropertyWithSlots[]>({ queryKey: ["slots"] }, (old = []) => old.map((item) => item.property.id !== visit.propertyId ? item : { ...item, slots: item.slots.map((slot) => slot.id !== visit.slotId ? slot : { ...slot, bookedVisitId: visit.id, bookedBuyerName: visit.buyers[0]?.name }) }));
            void queryClient.invalidateQueries({ queryKey: ["visitSummary"] });
        },
    });
}

