"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { brokerVisitsApi, SlotTakenError } from "@/lib/api/broker-visits";

import type {
    BrokerSiteVisit,
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";

type BookInput = {
    item: PropertyWithSlots;
    slot: VisitSlot;
    buyers: PersonSummary[];
    note: string;
    remindBuyer: boolean;
};

function optimisticVisit(input: BookInput): BrokerSiteVisit {
    const now = new Date().toISOString();
    return {
        id: `optimistic_${input.slot.id}`,
        source: input.item.propertySource === "own_listing" ? "broker_created" : "slot",
        slotId: input.slot.id,
        propertyId: input.item.property.id,
        propertySource: input.item.propertySource,
        ownerId: input.item.owner.id,
        brokerId: "broker_me",
        buyerIds: input.buyers.map((buyer) => buyer.id),
        startsAt: input.slot.startsAt,
        endsAt: input.slot.endsAt,
        status:
            input.item.propertySource === "own_listing" || input.slot.autoConfirm
                ? "confirmed"
                : "awaiting_owner",
        brokerNote: input.note || undefined,
        ownerNote: input.slot.note,
        remindBuyer: input.remindBuyer,
        createdAt: now,
        updatedAt: now,
        property: input.item.property,
        owner: input.item.owner,
        buyers: input.buyers,
        distanceKm: input.item.distanceKm,
    };
}

export function useBookSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: BookInput) => brokerVisitsApi.book(input),
        onMutate: async (input) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ["visits"] }),
                queryClient.cancelQueries({ queryKey: ["slots"] }),
            ]);
            const visitSnapshots = queryClient.getQueriesData<BrokerSiteVisit[]>({
                queryKey: ["visits"],
            });
            const draft = optimisticVisit(input);
            queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) => [
                draft,
                ...old,
            ]);
            return { visitSnapshots, draftId: draft.id, input };
        },
        onError: async (error, _input, context) => {
            context?.visitSnapshots.forEach(([key, value]) => queryClient.setQueryData(key, value));
            if (error instanceof SlotTakenError) {
                void queryClient.invalidateQueries({ queryKey: ["slots"] });
            }
        },
        onSuccess: (visit, _input, context) => {
            queryClient.setQueriesData<BrokerSiteVisit[]>({ queryKey: ["visits"] }, (old = []) =>
                old.map((item) => (item.id === context?.draftId ? visit : item)),
            );
            void queryClient.invalidateQueries({ queryKey: ["visitSummary"] });
            void queryClient.invalidateQueries({ queryKey: ["timeRequests"] });
            void queryClient.invalidateQueries({ queryKey: ["visits"] });
            void queryClient.invalidateQueries({ queryKey: ["slots"] });
        },
    });
}
