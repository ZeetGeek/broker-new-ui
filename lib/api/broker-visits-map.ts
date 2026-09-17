import type {
    BrokerSiteVisit,
    BrokerVisitStatus,
    PersonSummary,
    PropertyWithSlots,
    TimeRequest,
    TimeRequestStatus,
    VisitPropertySummary,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import type { RepresentationItem } from "@/lib/api/representative";
import type { MyListingItem } from "@/features/properties/your-listings/types";
import type { PropertyListing } from "@/lib/api/properties";

export type ApiShowing = {
    id: string;
    leadId: string;
    propertyId: string;
    visitSlotId: string | null;
    scheduledDate: string;
    status: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt?: string | null;
    durationMin?: number;
    property?: {
        id: string;
        title: string | null;
        city: string;
        address: string | null;
        salePrice?: string | null;
        monthlyRent?: string | null;
        transactionType?: string | null;
        propertyType?: string | null;
        subtype?: string | null;
        bhkConfig?: string | null;
        bedrooms?: number | null;
        areaSqft?: number | null;
        photos?: string[] | null;
    } | null;
    owner?: {
        id: string;
        fullName: string | null;
        avatarUrl?: string | null;
        phone?: string | null;
        isRepresentationActive?: boolean;
    } | null;
    lead?: { id: string; stage: string | null } | null;
    broker?: {
        id: string;
        fullName: string | null;
        email?: string;
        phone?: string | null;
        avatarUrl?: string | null;
    } | null;
    client?: {
        id: string;
        name: string;
        phone?: string;
        email?: string | null;
    } | null;
    visitSlot?: {
        id: string;
        startAt: string;
        endAt: string;
        status: string;
    } | null;
};

export type ApiVisitSlot = {
    id: string;
    propertyId: string;
    ownerId: string;
    startAt: string;
    endAt: string;
    status: string;
    showingId: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    property?: {
        id: string;
        title: string | null;
        city: string;
        address: string | null;
    } | null;
    booking?: {
        id: string;
        leadId: string;
        status: string | null;
        scheduledDate: string;
        notes: string | null;
    } | null;
};

export type Paged<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

function iso(value: string | Date | null | undefined, fallback?: string): string {
    if (!value) return fallback ?? new Date().toISOString();
    return typeof value === "string" ? value : value.toISOString();
}

function phoneDigits(value?: string | null): string | undefined {
    if (!value) return undefined;
    const digits = value.replace(/\D/g, "");
    if (!digits) return undefined;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

function localityFromAddress(address?: string | null, city?: string | null): string {
    if (address?.trim()) {
        const part = address.split(",")[0]?.trim();
        if (part) return part;
    }
    return city?.trim() || "—";
}

function moneyNumber(value?: string | number | null): number {
    if (value == null || value === "") return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function purposeFromTransaction(type?: string | null): "sale" | "rent" {
    return type === "rent" ? "rent" : "sale";
}

function configLabel(
    bhkConfig?: string | null,
    bedrooms?: number | null,
    subtype?: string | null,
): string {
    if (bhkConfig?.trim()) return bhkConfig.trim();
    if (bedrooms != null && bedrooms > 0) return `${bedrooms} BHK`;
    if (subtype?.trim()) return subtype.trim();
    return "Property";
}

export function mapShowingStatus(
    status: string | null | undefined,
    startsAt: string,
): BrokerVisitStatus {
    const now = Date.now();
    const startMs = new Date(startsAt).getTime();
    switch (status) {
        case "scheduled":
            return "awaiting_owner";
        case "confirmed":
            return startMs < now ? "completed" : "confirmed";
        case "completed":
            return "completed";
        case "cancelled":
            return "cancelled_by_owner";
        case "no_show":
            return "no_show";
        default:
            return "awaiting_owner";
    }
}

export function mapShowingToVisit(showing: ApiShowing): BrokerSiteVisit {
    const startsAt = iso(showing.visitSlot?.startAt ?? showing.scheduledDate);
    const endsAt = iso(
        showing.visitSlot?.endAt,
        new Date(new Date(startsAt).getTime() + (showing.durationMin ?? 45) * 60_000).toISOString(),
    );
    const property = mapShowingProperty(showing);
    const client = showing.client;
    const buyer: PersonSummary = client
        ? {
              id: client.id,
              name: client.name,
              phoneDigits: phoneDigits(client.phone),
          }
        : { id: showing.leadId, name: "Buyer" };
    const owner: PersonSummary = showing.owner
        ? {
              id: showing.owner.id,
              name: showing.owner.fullName?.trim() || "Owner",
              phoneDigits: phoneDigits(showing.owner.phone),
              avatarUrl: showing.owner.avatarUrl ?? undefined,
          }
        : { id: "owner", name: "Owner" };

    return {
        id: showing.id,
        source: "slot",
        slotId: showing.visitSlotId ?? showing.visitSlot?.id ?? undefined,
        propertyId: showing.propertyId,
        propertySource: "marketplace",
        ownerId: owner.id,
        brokerId: showing.broker?.id ?? "broker_me",
        buyerIds: [buyer.id],
        startsAt,
        endsAt,
        status: mapShowingStatus(showing.status, startsAt),
        brokerNote: showing.notes ?? undefined,
        remindBuyer: true,
        createdAt: iso(showing.createdAt, startsAt),
        updatedAt: iso(showing.updatedAt ?? showing.createdAt, startsAt),
        property,
        owner,
        buyers: [buyer],
    };
}

function mapShowingProperty(showing: ApiShowing): VisitPropertySummary {
    const p = showing.property;
    const amount = moneyNumber(p?.salePrice) || moneyNumber(p?.monthlyRent) || 0;
    return {
        id: showing.propertyId,
        title: p?.title?.trim() || "Property",
        configLabel: configLabel(p?.bhkConfig, p?.bedrooms, p?.subtype),
        propertyType: p?.propertyType?.trim() || p?.subtype?.trim() || "Apartment",
        locality: localityFromAddress(p?.address, p?.city),
        city: p?.city ?? "—",
        address: p?.address?.trim() || p?.city || "—",
        areaSqft: p?.areaSqft ?? 0,
        amountInr: amount,
        purpose: purposeFromTransaction(p?.transactionType),
        coverUrl: p?.photos?.[0] ?? undefined,
    };
}

export function mapShowingToTimeRequest(showing: ApiShowing): TimeRequest {
    const visit = mapShowingToVisit(showing);
    const startsAt = visit.startsAt;
    const endsAt = visit.endsAt;
    let status: TimeRequestStatus = "pending";
    if (showing.status === "confirmed" || showing.status === "completed") status = "accepted";
    else if (showing.status === "cancelled") status = "declined";
    else if (showing.status === "scheduled" && new Date(startsAt).getTime() < Date.now())
        status = "expired";
    else status = "pending";

    return {
        id: showing.id,
        propertyId: visit.propertyId,
        ownerId: visit.ownerId,
        brokerId: visit.brokerId,
        buyerIds: visit.buyerIds,
        preferredStartsAt: startsAt,
        preferredEndsAt: endsAt,
        alternates: [],
        message: showing.notes ?? undefined,
        status,
        expiresAt: startsAt,
        createdAt: visit.createdAt,
        property: visit.property,
        owner: visit.owner,
        buyers: visit.buyers,
        createdVisitId: showing.id,
    };
}

export function mapApiSlot(slot: ApiVisitSlot, ownerId?: string): VisitSlot {
    const isOpen = slot.status === "open";
    return {
        id: slot.id,
        propertyId: slot.propertyId,
        ownerId: ownerId ?? slot.ownerId,
        startsAt: iso(slot.startAt),
        endsAt: iso(slot.endAt),
        capacity: 1,
        bookedCount: isOpen ? 0 : 1,
        status: isOpen ? "open" : slot.status === "closed" ? "cancelled" : "full",
        visibility: "accepted_brokers",
        autoConfirm: false,
        bookedVisitId: slot.showingId ?? slot.booking?.id ?? undefined,
    };
}

function listingToPropertySummary(listing: MyListingItem | PropertyListing): VisitPropertySummary {
    if ("configLabel" in listing && "locality" in listing && typeof listing.locality === "string") {
        const mine = listing as MyListingItem;
        return {
            id: mine.id,
            title: mine.title,
            configLabel: mine.configLabel,
            propertyType: mine.propertyTypeLabel || mine.propertyType,
            locality: mine.locality,
            city: mine.city,
            address: mine.address,
            areaSqft: mine.areaSqft,
            amountInr: mine.saleAmountInr ?? mine.rentAmountInr ?? 0,
            purpose: mine.transactionType === "rent" ? "rent" : "sale",
            coverUrl: mine.imageSrc || mine.imageSrcs?.[0],
        };
    }
    const api = listing as PropertyListing;
    return {
        id: api.id,
        title: api.title?.trim() || "Property",
        configLabel: configLabel(api.bhkConfig, api.bedrooms, api.subtype),
        propertyType: api.propertyType?.trim() || "Apartment",
        locality: localityFromAddress(api.address, api.city),
        city: api.city ?? "—",
        address: api.address?.trim() || api.city || "—",
        areaSqft: api.areaSqft ?? 0,
        amountInr: moneyNumber(api.salePrice) || moneyNumber(api.monthlyRent),
        purpose: purposeFromTransaction(api.transactionType),
        coverUrl: api.photos?.[0] ?? undefined,
    };
}

export function representationToPropertyCard(
    item: RepresentationItem,
    slots: VisitSlot[],
): PropertyWithSlots {
    const amount = moneyNumber(item.propertySalePrice) || moneyNumber(item.propertyMonthlyRent);
    const property: VisitPropertySummary = {
        id: item.propertyId,
        title: item.propertyTitle?.trim() || "Property",
        configLabel: configLabel(
            item.propertyBhkConfig,
            item.propertyBedrooms,
            item.propertySubtype,
        ),
        propertyType: item.propertyType?.trim() || "Apartment",
        locality: localityFromAddress(item.propertyAddress, item.propertyCity),
        city: item.propertyCity ?? "—",
        address: item.propertyAddress?.trim() || item.propertyCity || "—",
        areaSqft: item.propertyAreaSqft ?? 0,
        amountInr: amount,
        purpose: purposeFromTransaction(item.propertyTransactionType),
        coverUrl: item.propertyPhotos?.[0] ?? undefined,
    };
    const owner: PersonSummary = {
        id: item.id,
        name: item.propertyOwnerName?.trim() || "Owner",
        phoneDigits: phoneDigits(item.propertyOwnerPhone),
        avatarUrl: item.propertyOwnerAvatarUrl ?? undefined,
    };
    return {
        property,
        propertySource: "marketplace",
        owner,
        access: "accepted",
        slots: slots.map((slot) => ({ ...slot, ownerId: owner.id })),
    };
}

export function ownListingToPropertyCard(
    listing: MyListingItem,
    slots: VisitSlot[],
): PropertyWithSlots {
    return {
        property: listingToPropertySummary(listing),
        propertySource: "own_listing",
        owner: {
            id: listing.ownerId ?? "me",
            name: listing.ownerName?.trim() || "You",
        },
        access: "none",
        slots,
    };
}

export function filterPropertyCards(
    items: PropertyWithSlots[],
    filters: {
        propertyIds?: string[];
        localities?: string[];
        purpose?: "sale" | "rent";
        propertyType?: string;
        bhk?: string;
        minBudget?: number;
        maxBudget?: number;
        ownerId?: string;
        q?: string;
        from?: string;
        to?: string;
        timeBuckets?: string[];
    },
): PropertyWithSlots[] {
    return items
        .map((item) => {
            let slots = item.slots;
            if (filters.from) slots = slots.filter((slot) => slot.startsAt >= filters.from!);
            if (filters.to) slots = slots.filter((slot) => slot.startsAt <= filters.to!);
            if (filters.timeBuckets?.length) {
                slots = slots.filter((slot) => {
                    const hour = new Date(slot.startsAt).getHours();
                    return filters.timeBuckets!.some((bucket) => {
                        if (bucket === "morning") return hour >= 6 && hour < 12;
                        if (bucket === "afternoon") return hour >= 12 && hour < 16;
                        if (bucket === "evening") return hour >= 16 && hour < 21;
                        return true;
                    });
                });
            }
            return { ...item, slots };
        })
        .filter((item) => {
            if (filters.propertyIds?.length && !filters.propertyIds.includes(item.property.id))
                return false;
            if (filters.localities?.length && !filters.localities.includes(item.property.locality))
                return false;
            if (filters.purpose && item.property.purpose !== filters.purpose) return false;
            if (
                filters.propertyType &&
                item.property.propertyType.toLowerCase() !== filters.propertyType.toLowerCase()
            )
                return false;
            if (filters.bhk && !item.property.configLabel.startsWith(filters.bhk)) return false;
            if (filters.minBudget && item.property.amountInr < filters.minBudget) return false;
            if (filters.maxBudget && item.property.amountInr > filters.maxBudget) return false;
            if (filters.ownerId && item.owner.id !== filters.ownerId) return false;
            if (filters.q) {
                const hay =
                    `${item.property.title} ${item.property.locality} ${item.owner.name}`.toLowerCase();
                if (!hay.includes(filters.q.toLowerCase())) return false;
            }
            return item.slots.length > 0 || !filters.propertyIds?.length;
        })
        .filter((item) => item.slots.length > 0);
}

export function mapClientToPerson(client: {
    id: string;
    name: string;
    phoneDigits?: string;
    lookingFor?: string;
    preferredLocalities?: string[];
    budgetMaxInr?: number | null;
    bhk?: number | null;
}): PersonSummary {
    const parts: string[] = [];
    if (client.bhk) parts.push(`${client.bhk} BHK`);
    if (client.preferredLocalities?.length)
        parts.push(client.preferredLocalities.slice(0, 2).join(" or "));
    if (client.budgetMaxInr) {
        const lakhs = client.budgetMaxInr / 100_000;
        parts.push(
            lakhs >= 100
                ? `up to ₹${(lakhs / 100).toFixed(1)} Cr`
                : `up to ₹${Math.round(lakhs)} L`,
        );
    }
    if (client.lookingFor === "rent" && !parts.some((p) => p.includes("rent"))) {
        parts.push("rent");
    }
    return {
        id: client.id,
        name: client.name,
        phoneDigits: client.phoneDigits,
        requirement: parts.length ? parts.join(" · ") : undefined,
    };
}
