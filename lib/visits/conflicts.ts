import { differenceInMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import {
    MIN_NOTICE_MINUTES,
    TRAVEL_BUFFER_MINUTES,
    VISITS_TIME_ZONE,
} from "@/lib/visits/constants";
import { istDateKey } from "@/lib/visits/time";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

export type ConflictResult = {
    level: "clear" | "tight" | "clash";
    reasons: {
        code:
            | "OVERLAP"
            | "BUYER_BUSY"
            | "TOO_SOON"
            | "TRAVEL_TIGHT"
            | "BACK_TO_BACK"
            | "DAY_OVERLOAD"
            | "LATE_EVENING";
        message: string;
        visitId?: string;
    }[];
};

export type ConflictCandidate = {
    startsAt: string;
    endsAt: string;
    buyerIds: string[];
    locality: string;
    /** When set, ignore an existing visit for this same open slot (retry / stale cache). */
    slotId?: string;
};

export type TravelEstimates = Record<string, { minutes: number; distanceKm?: number }>;

function overlaps(
    a: { startsAt: string; endsAt: string },
    b: { startsAt: string; endsAt: string },
) {
    return new Date(a.startsAt) < new Date(b.endsAt) && new Date(b.startsAt) < new Date(a.endsAt);
}

function isActive(visit: BrokerSiteVisit) {
    return ![
        "cancelled_by_broker",
        "cancelled_by_owner",
        "completed",
        "no_show",
        "expired",
    ].includes(visit.status);
}

export function checkVisitConflicts(
    candidate: ConflictCandidate,
    existingVisits: BrokerSiteVisit[],
    travelEstimates: TravelEstimates = {},
    now = new Date(),
): ConflictResult {
    const reasons: ConflictResult["reasons"] = [];
    const active = existingVisits.filter(
        (visit) =>
            isActive(visit) &&
            !(candidate.slotId && visit.slotId && visit.slotId === candidate.slotId),
    );
    const overlapping = active.filter((visit) => overlaps(candidate, visit));

    for (const visit of overlapping) {
        reasons.push({
            code: "OVERLAP",
            message: `Clashes with ${visit.property.title} at ${formatInTimeZone(visit.startsAt, VISITS_TIME_ZONE, "h:mm a")}.`,
            visitId: visit.id,
        });
    }
    for (const visit of overlapping.filter((item) =>
        item.buyerIds.some((id) => candidate.buyerIds.includes(id)),
    )) {
        const buyer = visit.buyers.find((person) => candidate.buyerIds.includes(person.id));
        reasons.push({
            code: "BUYER_BUSY",
            message: `${buyer?.name ?? "This buyer"} already has a visit at ${visit.property.title}.`,
            visitId: visit.id,
        });
    }
    if (differenceInMinutes(new Date(candidate.startsAt), now) < MIN_NOTICE_MINUTES) {
        reasons.push({
            code: "TOO_SOON",
            message: `This starts within ${MIN_NOTICE_MINUTES} minutes. Choose a later time.`,
        });
    }

    const nonOverlapping = active.filter((visit) => !overlaps(candidate, visit));
    const neighbours = nonOverlapping
        .map((visit) => {
            const before = new Date(visit.endsAt) <= new Date(candidate.startsAt);
            const gap = before
                ? differenceInMinutes(new Date(candidate.startsAt), new Date(visit.endsAt))
                : differenceInMinutes(new Date(visit.startsAt), new Date(candidate.endsAt));
            return { visit, gap };
        })
        .filter(({ gap }) => gap >= 0)
        .sort((a, b) => a.gap - b.gap)
        .slice(0, 2);

    for (const { visit, gap } of neighbours) {
        const estimate = travelEstimates[visit.id];
        const travel = estimate?.minutes ?? visit.driveMinutes ?? 20;
        const distance = estimate?.distanceKm ?? visit.distanceKm;
        const distanceLabel = distance == null ? "" : `${distance.toFixed(1)} km, `;
        if (gap === 0)
            reasons.push({
                code: "BACK_TO_BACK",
                message: `Back-to-back with ${visit.property.locality}; there is no travel gap.`,
                visitId: visit.id,
            });
        else if (gap < travel + TRAVEL_BUFFER_MINUTES)
            reasons.push({
                code: "TRAVEL_TIGHT",
                message: `Only ${gap} min gap from ${visit.property.locality} visit, ${distanceLabel}drive takes ${travel} min.`,
                visitId: visit.id,
            });
    }

    if (
        active.filter((visit) => istDateKey(visit.startsAt) === istDateKey(candidate.startsAt))
            .length >= 5
    ) {
        reasons.push({ code: "DAY_OVERLOAD", message: "This would be your sixth visit that day." });
    }
    const endHour = Number(formatInTimeZone(candidate.endsAt, VISITS_TIME_ZONE, "H"));
    if (endHour >= 20)
        reasons.push({ code: "LATE_EVENING", message: `This visit ends after 8:00 PM.` });

    const level = reasons.some((reason) => ["OVERLAP", "TOO_SOON"].includes(reason.code))
        ? "clash"
        : reasons.length
          ? "tight"
          : "clear";
    return { level, reasons };
}
