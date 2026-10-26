import type { RepresentationItem } from "@/lib/api/representative";
import { calendarDaysBetween } from "@/lib/format/date";

import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";
import { representationEndedBy } from "@/features/properties/my-requests/map-my-request";
import { mapApiPropertyType } from "@/features/properties/owner-listings/map-browse-listing";

const BHK_CONFIG_TO_NUMBER: Record<string, number> = {
    one_rk: 1,
    one_bhk: 1,
    two_bhk: 2,
    three_bhk: 3,
    four_bhk: 4,
    five_plus_bhk: 5,
};

const SUBTYPE_LABELS: Record<string, string> = {
    apartment: "Apartment",
    villa: "Villa",
    independent_house: "Independent house",
    builder_floor: "Builder floor",
    penthouse: "Penthouse",
    farm_house: "Farm house",
    flat: "Flat",
};

function toNumber(value: string | number | null | undefined): number {
    if (value == null) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function titleCase(value: string): string {
    return value.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function digitsOnly(phone: string | null | undefined): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits || undefined;
}

function configLabel(rep: RepresentationItem): string {
    const bhk = rep.propertyBhkConfig
        ? BHK_CONFIG_TO_NUMBER[rep.propertyBhkConfig]
        : (rep.propertyBedrooms ?? 0);
    if (bhk && bhk > 0) return bhk >= 5 ? "5+ BHK" : `${bhk} BHK`;
    const subtype = rep.propertySubtype?.trim();
    if (subtype && SUBTYPE_LABELS[subtype]) return SUBTYPE_LABELS[subtype];
    if (subtype) {
        return subtype
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    }
    return "Listing";
}

function propertyTypeLabel(rep: RepresentationItem): string {
    return mapApiPropertyType(rep.propertySubtype, rep.propertyType);
}

/** Bedrooms first, then the BHK key — same order as the owner-listings card. */
function bhkCount(rep: RepresentationItem): number {
    if (rep.propertyBedrooms != null && rep.propertyBedrooms > 0) return rep.propertyBedrooms;
    return rep.propertyBhkConfig ? (BHK_CONFIG_TO_NUMBER[rep.propertyBhkConfig] ?? 0) : 0;
}

function bathroomCount(rep: RepresentationItem): number | null {
    return rep.propertyBathrooms != null && rep.propertyBathrooms > 0
        ? rep.propertyBathrooms
        : null;
}

function mapStage(status: string | undefined): InviteStage {
    const value = status?.toLowerCase();
    if (value === "pending") return "pending";
    if (value === "accepted") return "accepted";
    if (value === "rejected") return "declined";
    // Accepted, then the owner or the broker cancelled it.
    if (value === "owner_cancelled" || value === "broker_cancelled") return "ended";
    // Owner revoked / broker withdrew without a decision → invite closed.
    if (value === "withdrawn" || value === "revoked") return "expired";
    return "expired";
}

/** Map a broker-side owner invitation into the Invites card model. */
export function mapRepresentationToInviteItem(
    rep: RepresentationItem,
    now = new Date(),
): InviteItem | null {
    if ((rep.initiatedBy ?? "owner").toLowerCase() !== "owner") {
        return null;
    }

    const stage = mapStage(rep.status);
    const isRent =
        rep.propertyTransactionType === "rent" ||
        (rep.propertyTransactionType !== "sale" &&
            toNumber(rep.propertyMonthlyRent) > 0 &&
            toNumber(rep.propertySalePrice) <= 0);
    const amountInr = isRent ? toNumber(rep.propertyMonthlyRent) : toNumber(rep.propertySalePrice);
    const locality = titleCase(rep.propertyAddress?.trim() || "");
    const city = titleCase(rep.propertyCity?.trim() || "City");
    const config = configLabel(rep);
    const typeLabel = propertyTypeLabel(rep);
    const title =
        rep.propertyTitle?.trim() ||
        [config, locality || city].filter(Boolean).join(" · ") ||
        "Property";
    const invitedAt = rep.createdAt ?? new Date().toISOString();
    const respondedAt =
        stage === "pending"
            ? null
            : stage === "ended"
              ? (rep.cancelledAt ?? rep.updatedAt ?? invitedAt)
              : (rep.decidedAt ?? rep.updatedAt ?? invitedAt);
    const photos = (rep.propertyPhotos ?? []).filter(Boolean);
    const bhk = bhkCount(rep);

    return {
        id: rep.id,
        propertyId: rep.propertyId,
        stage,
        endedBy: stage === "ended" ? representationEndedBy(rep.status) : undefined,
        cancelReason: stage === "ended" ? rep.cancelReason?.trim() || undefined : undefined,
        title,
        configLabel: config,
        propertyTypeLabel: typeLabel,
        category: rep.propertyType ?? null,
        subtype: rep.propertySubtype ?? null,
        transactionType: rep.propertyTransactionType ?? null,
        saleAmountInr:
            rep.propertyTransactionType === "rent"
                ? null
                : toNumber(rep.propertySalePrice) || null,
        rentAmountInr:
            rep.propertyTransactionType === "sale"
                ? null
                : toNumber(rep.propertyMonthlyRent) || null,
        locality: locality || city,
        city,
        areaSqft: rep.propertyAreaSqft ?? 0,
        bhk,
        bathrooms: bathroomCount(rep),
        balconies: rep.propertyBalconies ?? rep.propertyBalconyCount ?? null,
        parkingSpaces: rep.propertyParkingSpaces ?? null,
        floorNumber: rep.propertyFloorNumber ?? null,
        facing: rep.propertyFacing ?? rep.propertyFacingDirection ?? null,
        propertyCondition: rep.propertyCondition ?? null,
        propertyAge: rep.propertyAge ?? null,
        suitableFor: rep.propertySuitableFor?.length ? rep.propertySuitableFor : null,
        furnishing: rep.propertyFurnishing ?? rep.propertyFurnishingStatus ?? null,
        listedAt: rep.propertyListedAt ?? null,
        amountInr,
        isRent,
        commissionPercent: toNumber(rep.propertyCommissionPercent),
        commissionAmount: toNumber(rep.propertyCommissionAmount),
        ownerName: rep.propertyOwnerName?.trim() || "Owner",
        ownerAvatarUrl: rep.propertyOwnerAvatarUrl ?? undefined,
        ownerPhoneDigits: stage === "accepted" ? digitsOnly(rep.propertyOwnerPhone) : undefined,
        message: rep.message?.trim() || null,
        invitedAt,
        respondedAt,
        daysWaiting: stage === "pending" ? calendarDaysBetween(new Date(invitedAt), now) : 0,
        clientsAttached: 0,
        attachedClients: [],
        brokerSlotsOpen: 0,
        brokerSlotsTotal: 3,
        imageSrc: photos[0] ?? "",
        unreadMessageCount:
            typeof rep.unreadMessageCount === "number" && rep.unreadMessageCount > 0
                ? rep.unreadMessageCount
                : undefined,
    };
}
