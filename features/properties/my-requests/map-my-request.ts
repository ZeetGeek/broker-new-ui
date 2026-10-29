import type { RepresentationItem } from "@/lib/api/representative";
import { calendarDaysBetween } from "@/lib/format/date";

import { mapApiPropertyType } from "@/features/properties/owner-listings/map-browse-listing";
import {
    ATTEMPT_LIMIT,
    REMINDER_LIMIT,
    type RequestItem,
    type RequestStage,
    type RequestTimelineStep,
} from "@/features/properties/my-requests/types";

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

function mapStage(
    rep: RepresentationItem,
    attemptNumber: number,
    requestsRemaining: number,
): RequestStage {
    const status = rep.status?.toLowerCase();
    if (status === "pending") return "pending";
    if (status === "accepted") return "approved";
    if (status === "rejected") {
        return requestsRemaining <= 0 || attemptNumber >= ATTEMPT_LIMIT ? "locked" : "declined";
    }
    if (status === "withdrawn") {
        return requestsRemaining <= 0 || attemptNumber >= ATTEMPT_LIMIT ? "locked" : "cancelled";
    }
    if (status === "owner_cancelled" || status === "broker_cancelled") return "ended";
    if (status === "revoked") return "declined";
    return "cancelled";
}

/** Who ended an approved representation, from the API status. */
export function representationEndedBy(
    status: string | null | undefined,
): "owner" | "broker" | undefined {
    const value = status?.toLowerCase();
    if (value === "owner_cancelled") return "owner";
    if (value === "broker_cancelled") return "broker";
    return undefined;
}

/** Shared by My Deals cards and owner-listing request timeline. */
export function buildRepresentationTimeline(
    rep: RepresentationItem,
    stage: RequestStage,
    attemptNumber: number,
): RequestTimelineStep[] {
    const steps: RequestTimelineStep[] = [];
    const requestedAt = rep.createdAt ?? new Date().toISOString();

    steps.push({
        key: "sent",
        label: `You sent the request (${attemptNumber} of ${ATTEMPT_LIMIT})`,
        at: requestedAt,
    });

    if (rep.lastRemindedAt) {
        const count = Math.max(1, rep.reminderCount ?? 1);
        steps.push({
            key: "nudged",
            label:
                count === 1
                    ? "You sent a reminder"
                    : `You sent reminder ${count} of ${REMINDER_LIMIT}`,
            at: rep.lastRemindedAt,
        });
    }

    const resolvedAt = rep.decidedAt ?? rep.updatedAt ?? requestedAt;

    if (stage === "approved") {
        steps.push({ key: "approved", label: "Owner approved", at: resolvedAt });
    } else if (stage === "declined") {
        steps.push({
            key: "declined",
            label: rep.message?.trim() || "Owner declined",
            at: resolvedAt,
        });
    } else if (stage === "cancelled") {
        steps.push({
            key: "cancelled",
            label: `You cancelled attempt ${attemptNumber}`,
            at: resolvedAt,
        });
    } else if (stage === "locked") {
        steps.push({
            key: "locked",
            label: "No attempts left — owner never approved",
            at: resolvedAt,
        });
    } else if (stage === "ended") {
        steps.push({ key: "approved", label: "Owner approved", at: resolvedAt });
        const reason = rep.cancelReason?.trim();
        const who =
            representationEndedBy(rep.status) === "owner"
                ? "Owner cancelled the representation"
                : "You stopped selling this property";
        steps.push({
            key: "cancelled",
            label: reason ? `${who}: ${reason}` : who,
            at: rep.cancelledAt ?? rep.updatedAt ?? resolvedAt,
        });
    }

    return steps;
}

/** Map a broker-side representation row into the My Requests card model. */
export function mapRepresentationToRequestItem(
    rep: RepresentationItem,
    now = new Date(),
): RequestItem | null {
    // Owner→broker invites are a different inbox; this screen is outbound requests.
    if ((rep.initiatedBy ?? "broker").toLowerCase() === "owner") {
        return null;
    }

    const attemptNumber = Math.max(1, rep.brokerRequestCount ?? 1);
    const requestsRemaining =
        rep.brokerRequestsRemaining ?? Math.max(0, ATTEMPT_LIMIT - attemptNumber);
    const stage = mapStage(rep, attemptNumber, requestsRemaining);
    const reminderCount = rep.reminderCount ?? 0;
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
    const requestedAt = rep.createdAt ?? new Date().toISOString();
    const resolvedAt =
        stage === "pending"
            ? null
            : stage === "ended"
              ? (rep.cancelledAt ?? rep.updatedAt ?? requestedAt)
              : (rep.decidedAt ?? rep.updatedAt ?? requestedAt);
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
            rep.propertyTransactionType === "rent" ? null : toNumber(rep.propertySalePrice) || null,
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
        // Consent-gated — only after the owner accepts (API may still omit it).
        ownerPhoneDigits: stage === "approved" ? digitsOnly(rep.propertyOwnerPhone) : undefined,
        ownerSeen: false,
        requestedAt,
        resolvedAt,
        daysWaiting: stage === "pending" ? calendarDaysBetween(new Date(requestedAt), now) : 0,
        clientsAttached: 0,
        attachedClients: [],
        brokerSlotsOpen: 0,
        brokerSlotsTotal: 3,
        attemptNumber,
        reminderCount,
        reminderUsed: reminderCount >= REMINDER_LIMIT,
        nudgedAt: rep.lastRemindedAt ?? null,
        declineReason: stage === "declined" ? (rep.message ?? undefined) : undefined,
        imageSrc: photos[0] ?? "",
        timeline: buildRepresentationTimeline(rep, stage, attemptNumber),
        unreadMessageCount:
            typeof rep.unreadMessageCount === "number" && rep.unreadMessageCount > 0
                ? rep.unreadMessageCount
                : undefined,
    };
}
