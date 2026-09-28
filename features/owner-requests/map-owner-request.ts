import type { RepresentationItem } from "@/lib/api/representative";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";

import type {
    OwnerDealListing,
    OwnerRepStatus,
    OwnerRequestCardItem,
} from "@/features/owner-requests/types";

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

function mapStatus(status: string | undefined): OwnerRepStatus {
    const value = status?.toLowerCase();
    if (value === "pending") return "pending";
    if (value === "accepted") return "accepted";
    if (value === "rejected") return "rejected";
    if (value === "withdrawn") return "withdrawn";
    if (value === "revoked") return "revoked";
    return "unknown";
}

function toListing(rep: RepresentationItem): OwnerDealListing {
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
    const photos = (rep.propertyPhotos ?? []).filter(Boolean);
    const bhk = rep.propertyBhkConfig
        ? (BHK_CONFIG_TO_NUMBER[rep.propertyBhkConfig] ?? rep.propertyBedrooms ?? 0)
        : (rep.propertyBedrooms ?? 0);

    return {
        propertyId: rep.propertyId,
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
        imageSrc: photos[0] ?? "",
    };
}

export function ownerRequestDetailHref(propertyId: string): string {
    return ownerPropertyDetailHref(propertyId);
}

export function mapRepresentationToOwnerCard(
    rep: RepresentationItem,
): OwnerRequestCardItem | null {
    if (!rep.id || !rep.propertyId) return null;

    const status = mapStatus(rep.status);
    const listing = toListing(rep);
    const brokerName =
        rep.brokerDisplayName?.trim() ||
        rep.brokerName?.trim() ||
        rep.brokerOrgName?.trim() ||
        "Broker";

    return {
        ...listing,
        id: rep.id,
        status,
        message: rep.message?.trim() || null,
        createdAt: rep.createdAt ?? new Date().toISOString(),
        brokerName,
        brokerAvatarUrl: rep.brokerAvatarUrl ?? undefined,
        brokerPhoneDigits: status === "accepted" ? digitsOnly(rep.brokerPhone) : undefined,
        brokerOrgName: rep.brokerOrgName,
        brokerVerified: Boolean(rep.brokerVerified),
    };
}
