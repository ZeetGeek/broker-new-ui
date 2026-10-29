import { differenceInMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { MIN_NOTICE_MINUTES, VISITS_TIME_ZONE } from "@/lib/visits/constants";
import { istDateKey } from "@/lib/visits/time";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

export type ConflictResult = {
    level: "clear" | "tight" | "clash";
    reasons: {
        code: "OVERLAP" | "BUYER_BUSY" | "TOO_SOON" | "DAY_OVERLOAD" | "LATE_EVENING";
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
