import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";

import { MOCK_CLIENTS, MOCK_PROPERTY_CLIENTS } from "@/features/clients/mock-clients";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { isLiveStage } from "@/features/pipeline/types";

/** Uses the existing sample pipeline and inventory rather than an independent link store. */
export async function attachSampleClients(propertyId: string, clientIds: string[]): Promise<void> {
    const clients = clientIds.map((id) => MOCK_CLIENTS.find((client) => client.id === id));
    if (clients.some((client) => !client)) throw new ApiError("Client not found", 404);
    const listing = await propertiesApi.get(propertyId);
    const { getMockMyListings } = await import("@/lib/api/my-listings");
    const inventory = getMockMyListings().find((item) => item.id === propertyId);
    const now = new Date().toISOString();
    for (const client of clients) {
        if (!client) continue;
        if (
            MOCK_DEALS.some(
                (deal) =>
                    deal.buyer.id === client.id &&
                    deal.property.id === propertyId &&
                    isLiveStage(deal.status),
            )
        ) {
            continue;
        }
        const isRent = listing.transactionType === "rent";
        MOCK_DEALS.push({
            id: `sample-lead-${propertyId}-${client.id}-${MOCK_DEALS.length}`,
            status: "new",
            buyer: {
                id: client.id,
                name: client.name,
                phoneDigits: client.phoneDigits,
                budgetMaxInr: client.budgetMaxInr,
            },
            property: {
                id: propertyId,
                title: listing.title || "Property",
                configLabel: inventory?.configLabel || "",
                propertyTypeLabel: listing.subtype || listing.propertyType || "Property",
                locality: inventory?.locality || listing.city || "",
                city: listing.city || "",
                areaSqft: Number(listing.areaSqft) || 0,
                bhk: listing.bedrooms || 0,
                amountInr: Number(isRent ? listing.monthlyRent : listing.salePrice) || 0,
                isRent,
                imageSrc: listing.photos?.[0] || "",
                commissionPercent: Number(listing.commissionPercent) || null,
                commissionAmountInr: Number(listing.commissionAmount) || null,
                isBrokerListing: Boolean(inventory),
                isExclusiveProperty: Boolean(inventory?.exclusiveOwnerId),
            },
            owner: {
                id: inventory?.exclusiveOwnerId || listing.ownerUserId || undefined,
                name: inventory?.ownerName || listing.ownerName || "Owner",
                phoneDigits: inventory?.ownerPhoneDigits || undefined,
                origin: inventory ? "exclusive" : "platform",
                isRepresentationActive: Boolean(
                    inventory || listing.representation?.status === "accepted",
                ),
            },
            stageEnteredAt: now,
            createdAt: now,
            lastContactedAt: null,
            nextVisitAt: null,
            note: "",
            resolvedAt: null,
            closedAmountInr: null,
            offerAmountInr: null,
            offerStatus: null,
        });
    }
    const live = MOCK_DEALS.filter(
        (deal) => deal.property.id === propertyId && isLiveStage(deal.status),
    );
    MOCK_PROPERTY_CLIENTS[propertyId] = [
        ...new Set([
            ...(MOCK_PROPERTY_CLIENTS[propertyId] ?? []),
            ...live.map((deal) => deal.buyer.id),
        ]),
    ];
    for (const client of clients) {
        if (client)
            client.attachedPropertyCount = new Set([
                ...MOCK_DEALS.filter(
                    (deal) => deal.buyer.id === client.id && isLiveStage(deal.status),
                ).map((deal) => deal.property.id),
                ...Object.entries(MOCK_PROPERTY_CLIENTS)
                    .filter(([, ids]) => ids.includes(client.id))
                    .map(([id]) => id),
            ]).size;
    }
}
