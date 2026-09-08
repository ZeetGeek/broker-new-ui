import type { RepresentationItem } from "@/lib/api/representative";
import { calendarDaysBetween } from "@/lib/format/date";

import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";

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
    const subtype = rep.propertySubtype?.trim();
    if (subtype && SUBTYPE_LABELS[subtype]) return SUBTYPE_LABELS[subtype];
    const type = rep.propertyType?.trim();
    if (type) return titleCase(type.replace(/_/g, " "));
    return "Property";
}

function mapStage(status: string | undefined): InviteStage {
    const value = status?.toLowerCase();
    if (value === "pending") return "pending";
    if (value === "accepted") return "accepted";
    if (value === "rejected") return "declined";
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
        [config, locality || city].filter(Boolean).join(" · ") ||
        rep.propertyTitle?.trim() ||
        "Property";
    const invitedAt = rep.createdAt ?? new Date().toISOString();
    const respondedAt = stage === "pending" ? null : (rep.decidedAt ?? rep.updatedAt ?? invitedAt);
    const photos = (rep.propertyPhotos ?? []).filter(Boolean);
    const bhk = rep.propertyBhkConfig
        ? (BHK_CONFIG_TO_NUMBER[rep.propertyBhkConfig] ?? rep.propertyBedrooms ?? 0)
        : (rep.propertyBedrooms ?? 0);

    return {
        id: rep.id,
        propertyId: rep.propertyId,
        stage,
        title,
        configLabel: config,
        propertyTypeLabel: typeLabel,
        locality: locality || city,
        city,
        areaSqft: rep.propertyAreaSqft ?? 0,
        bhk,
        amountInr,
        isRent,
        commissionPercent: toNumber(rep.propertyCommissionPercent),
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
    };
}
