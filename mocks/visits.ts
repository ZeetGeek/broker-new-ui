import { dateAtIstOffset } from "@/lib/visits/time";

import type { BrokerSiteVisit, PersonSummary, PropertyWithSlots, TimeRequest, VisitPropertySummary } from "@/features/site-visits/broker/model";

export const USE_MOCK_VISITS = process.env.NEXT_PUBLIC_USE_MOCK_VISITS !== "false";

export const MOCK_BUYERS: PersonSummary[] = [
    { id: "b_123", name: "Aarav Shah", phoneDigits: "9876543210", requirement: "3 BHK · Vesu or City Light · up to ₹2 Cr" },
    { id: "b_204", name: "Meera Desai", phoneDigits: "9825032145", requirement: "2 BHK · Adajan · up to ₹85 L" },
    { id: "b_318", name: "Kunal Patel", phoneDigits: "9909981122", requirement: "Villa · Piplod · up to ₹3.5 Cr" },
    { id: "b_411", name: "Nisha Mehta", phoneDigits: "9898123401", requirement: "3 BHK on rent · Vesu · up to ₹45,000/mo" },
];

const OWNERS: PersonSummary[] = [
    { id: "o_1", name: "Zeet Patel", phoneDigits: "9879012345" },
    { id: "o_2", name: "Ramesh Shah", phoneDigits: "9825123456" },
    { id: "o_3", name: "Bhavna Desai", phoneDigits: "9898011223" },
    { id: "o_4", name: "Manish Vora", phoneDigits: "9825044556" },
];

export const MOCK_PROPERTIES: VisitPropertySummary[] = [
    { id: "p_1", title: "Shreeji Heights", configLabel: "3 BHK", propertyType: "Apartment", locality: "Vesu", city: "Surat", address: "Canal Road, near Someshwara Enclave, Vesu, Surat", areaSqft: 1850, amountInr: 18_500_000, purpose: "sale", coverUrl: "/properties/1.jpg", latitude: 21.1433, longitude: 72.7707 },
    { id: "p_2", title: "Riverstone Residency", configLabel: "2 BHK", propertyType: "Apartment", locality: "Adajan", city: "Surat", address: "Anand Mahal Road, Adajan, Surat", areaSqft: 1320, amountInr: 8_200_000, purpose: "sale", coverUrl: "/properties/2.jpg", latitude: 21.1959, longitude: 72.7933 },
    { id: "p_3", title: "Palm Grove Villa", configLabel: "4 BHK", propertyType: "Villa", locality: "Piplod", city: "Surat", address: "Dumas Road, Piplod, Surat", areaSqft: 3200, amountInr: 32_000_000, purpose: "sale", coverUrl: "/properties/3.jpg", latitude: 21.1593, longitude: 72.7712 },
    { id: "p_4", title: "Avadh Copperstone", configLabel: "3 BHK", propertyType: "Apartment", locality: "Pal", city: "Surat", address: "Pal–Hazira Road, Pal, Surat", areaSqft: 1680, amountInr: 42_000, purpose: "rent", coverUrl: "/properties/4.jpg", latitude: 21.1972, longitude: 72.7709 },
    { id: "p_5", title: "Orchid Business Hub", configLabel: "Office", propertyType: "Commercial", locality: "City Light", city: "Surat", address: "City Light Main Road, Surat", areaSqft: 950, amountInr: 12_500_000, purpose: "sale", coverUrl: "/properties/5.jpg", latitude: 21.169, longitude: 72.7931 },
];

function visit(index: number, day: number, hour: number, minute: number, status: BrokerSiteVisit["status"], buyerIds: string[], options: Partial<BrokerSiteVisit> = {}): BrokerSiteVisit {
    const property = MOCK_PROPERTIES[index % MOCK_PROPERTIES.length];
    const owner = OWNERS[index % OWNERS.length];
    const startsAt = dateAtIstOffset(day, hour, minute);
    const endsAt = new Date(new Date(startsAt).getTime() + 45 * 60_000).toISOString();
    return {
        id: `v_${index + 1}`,
        source: "slot",
        slotId: `slot_booked_${index + 1}`,
        propertyId: property.id,
        propertySource: "marketplace",
        ownerId: owner.id,
        brokerId: "broker_me",
        buyerIds,
        startsAt,
        endsAt,
        status,
        remindBuyer: true,
        createdAt: dateAtIstOffset(-2, 11, 0),
        updatedAt: dateAtIstOffset(-1, 17, 30),
        property,
        owner,
        buyers: buyerIds.map((id) => MOCK_BUYERS.find((buyer) => buyer.id === id) ?? MOCK_BUYERS[0]),
        distanceKm: [5.6, 11.4, 7.8, 13.2, 4.3][index % 5],
        driveMinutes: [16, 28, 22, 34, 14][index % 5],
        checklist: { documents: index % 2 === 0, keys: false, parking: index % 3 === 0 },
        ...options,
    };
}

export const MOCK_SITE_VISITS: BrokerSiteVisit[] = [
    visit(0, 0, 9, 30, "completed", ["b_123"], { outcome: undefined }),
    visit(1, 0, 12, 0, "confirmed", ["b_204"]),
    visit(2, 0, 16, 0, "confirmed", ["b_318"]),
    visit(3, 1, 10, 0, "awaiting_owner", ["b_411"]),
    visit(4, 1, 12, 30, "confirmed", ["b_123", "b_204"]),
    visit(0, 1, 15, 0, "reschedule_pending", ["b_318"]),
    visit(1, 1, 18, 0, "confirmed", ["b_204"]),
    visit(2, 2, 11, 0, "confirmed", ["b_318"]),
    visit(3, 3, 17, 30, "confirmed", ["b_411"]),
    visit(4, 4, 10, 30, "cancelled_by_owner", ["b_123"]),
    visit(0, 5, 14, 0, "confirmed", ["b_204"]),
    visit(1, -1, 13, 0, "completed", ["b_318"], { outcome: { interest: "warm", attended: "buyer_and_owner", feedback: "Buyer liked the light and layout.", objections: ["Price"], nextStep: "schedule_followup", followUpAt: dateAtIstOffset(1, 11, 0) } }),
];

function makeSlot(property: VisitPropertySummary, owner: PersonSummary, id: string, day: number, hour: number, minute = 0, options: Partial<PropertyWithSlots["slots"][number]> = {}) {
    const startsAt = dateAtIstOffset(day, hour, minute);
    return {
        id,
        propertyId: property.id,
        ownerId: owner.id,
        startsAt,
        endsAt: new Date(new Date(startsAt).getTime() + 45 * 60_000).toISOString(),
        capacity: 1,
        bookedCount: 0,
        status: "open" as const,
        visibility: "accepted_brokers" as const,
        autoConfirm: id.length % 2 === 0,
        note: "Ring the bell at gate 2",
        ...options,
    };
}

export const MOCK_PROPERTIES_WITH_SLOTS: PropertyWithSlots[] = MOCK_PROPERTIES.map((property, index) => {
    const owner = OWNERS[index % OWNERS.length];
    return {
        property,
        propertySource: index === 4 ? "own_listing" : "marketplace",
        owner,
        access: index === 4 ? "none" : index === 3 ? "requested" : "accepted",
        matchScore: [92, 78, 86, 69, 58][index],
        matchReasons: index === 0 ? ["budget fits", "Vesu", "3 BHK"] : index === 2 ? ["property type", "Piplod"] : [property.locality, property.configLabel],
        distanceKm: [9.2, 5.8, 11.7, 13.4, 4.6][index],
        slots: [
            makeSlot(property, owner, `slot_${index}_1`, 1, 10, 0, index === 4 ? { visibility: "all_brokers", autoConfirm: true } : {}),
            makeSlot(property, owner, `slot_${index}_2`, 1, 12, 0, index === 0 ? { capacity: 2, bookedCount: 1 } : {}),
            makeSlot(property, owner, `slot_${index}_3`, 1, 16),
            makeSlot(property, owner, `slot_${index}_4`, 1, 18, 0, index === 1 ? { status: "full", bookedCount: 1 } : {}),
            makeSlot(property, owner, `slot_${index}_5`, 2, 11),
            makeSlot(property, owner, `slot_${index}_6`, 2, 15),
            makeSlot(property, owner, `slot_${index}_7`, 2, 17, 0, index === 2 ? { requestedByMe: true } : {}),
            makeSlot(property, owner, `slot_${index}_8`, 3, 10, 30),
        ],
    };
});

export const MOCK_TIME_REQUESTS: TimeRequest[] = [
    {
        id: "tr_1", propertyId: "p_1", ownerId: "o_1", brokerId: "broker_me", buyerIds: ["b_123"], preferredStartsAt: dateAtIstOffset(1, 17), preferredEndsAt: dateAtIstOffset(1, 17, 45), alternates: [{ startsAt: dateAtIstOffset(1, 18), endsAt: dateAtIstOffset(1, 18, 45) }], message: "Buyer works till 5, evening suits better", status: "counter_offered", counterOffer: { startsAt: dateAtIstOffset(1, 17, 30), endsAt: dateAtIstOffset(1, 18, 15), ownerMessage: "I can reach by 5:30 PM." }, expiresAt: dateAtIstOffset(1, 17), createdAt: dateAtIstOffset(0, 8, 30), property: MOCK_PROPERTIES[0], owner: OWNERS[0], buyers: [MOCK_BUYERS[0]],
    },
    {
        id: "tr_2", propertyId: "p_3", ownerId: "o_3", brokerId: "broker_me", buyerIds: ["b_318"], preferredStartsAt: dateAtIstOffset(2, 18), preferredEndsAt: dateAtIstOffset(2, 18, 45), alternates: [], status: "pending", expiresAt: dateAtIstOffset(2, 18), createdAt: dateAtIstOffset(0, 7, 0), property: MOCK_PROPERTIES[2], owner: OWNERS[2], buyers: [MOCK_BUYERS[2]],
    },
    {
        id: "tr_3", propertyId: "p_2", ownerId: "o_2", brokerId: "broker_me", buyerIds: ["b_204"], preferredStartsAt: dateAtIstOffset(2, 9), preferredEndsAt: dateAtIstOffset(2, 9, 45), alternates: [], status: "declined", declineReason: "The property will be occupied that morning.", expiresAt: dateAtIstOffset(2, 9), createdAt: dateAtIstOffset(-1, 14, 0), property: MOCK_PROPERTIES[1], owner: OWNERS[1], buyers: [MOCK_BUYERS[1]],
    },
    {
        id: "tr_4", propertyId: "p_4", ownerId: "o_4", brokerId: "broker_me", buyerIds: ["b_411"], preferredStartsAt: dateAtIstOffset(-2, 18), preferredEndsAt: dateAtIstOffset(-2, 18, 45), alternates: [], status: "expired", expiresAt: dateAtIstOffset(-2, 18), createdAt: dateAtIstOffset(-4, 11, 0), property: MOCK_PROPERTIES[3], owner: OWNERS[3], buyers: [MOCK_BUYERS[3]],
    },
];

