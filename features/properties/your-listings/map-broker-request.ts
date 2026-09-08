import type { DashboardRequestQuota } from "@/lib/api/dashboard";
import type { RepresentationItem } from "@/lib/api/representative";
import { calendarDaysBetween, formatDateIso } from "@/lib/format/date";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";

import type {
    BrokerRequestItem,
    BrokerRequestRowType,
    BrokerRequestsResult,
} from "@/features/properties/your-listings/types";

const BHK_CONFIG_TO_NUMBER: Record<string, number> = {
    one_rk: 1,
    one_bhk: 1,
    two_bhk: 2,
    three_bhk: 3,
    four_bhk: 4,
    five_plus_bhk: 5,
};

const STALE_PENDING_DAYS = 3;

function toNumber(value: string | number | null | undefined): number {
    if (value == null) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function titleCase(value: string): string {
    return value.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function configLabel(rep: RepresentationItem): string {
    const bhk = rep.propertyBhkConfig
        ? BHK_CONFIG_TO_NUMBER[rep.propertyBhkConfig]
        : (rep.propertyBedrooms ?? 0);
    if (bhk && bhk > 0) return bhk >= 5 ? "5+ BHK" : `${bhk} BHK`;
    const subtype = rep.propertySubtype?.trim();
    if (subtype) {
        return subtype
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
    }
    return "Listing";
}

function requestNote(type: BrokerRequestRowType, daysWaiting: number): string {
    if (type === "declined") return "The owner said no to this one";
    if (type === "approved_untouched") {
        const days = daysWaiting === 1 ? "1 day" : `${daysWaiting} days`;
        return `Approved ${days} ago · no client added yet`;
    }
    if (type === "approved") return "Approved - you can start working this property";
    if (type === "pending_stale") {
        return `No reply in ${daysWaiting} days - worth a nudge`;
    }
    if (daysWaiting <= 0) return "Sent today - waiting on the owner";
    const days = daysWaiting === 1 ? "1 day" : `${daysWaiting} days`;
    return `Waiting ${days} - the owner hasn't replied yet`;
}

function mapRow(rep: RepresentationItem, now: Date): BrokerRequestItem | null {
    const status = rep.status?.toLowerCase();
    if (status !== "pending" && status !== "accepted" && status !== "rejected") {
        return null;
    }

    const isRent =
        rep.propertyTransactionType === "rent" ||
        (rep.propertyTransactionType !== "sale" &&
            toNumber(rep.propertyMonthlyRent) > 0 &&
            toNumber(rep.propertySalePrice) <= 0);
    const amountInr = isRent ? toNumber(rep.propertyMonthlyRent) : toNumber(rep.propertySalePrice);
    const locality = titleCase(rep.propertyAddress?.trim() || rep.propertyCity?.trim() || "");
    const title =
        [configLabel(rep), locality].filter(Boolean).join(" · ") ||
        rep.propertyTitle?.trim() ||
        "Property";
    const createdAt = rep.createdAt ? new Date(rep.createdAt) : now;
    const decidedAt = rep.decidedAt ? new Date(rep.decidedAt) : null;
    const daysWaiting = calendarDaysBetween(createdAt, now);
    const daysSince = decidedAt ? calendarDaysBetween(decidedAt, now) : 0;

    let type: BrokerRequestRowType;
    if (status === "rejected") {
        type = "declined";
    } else if (status === "accepted") {
        type = "approved";
    } else if (daysWaiting >= STALE_PENDING_DAYS) {
        type = "pending_stale";
    } else {
        type = "pending";
    }

    const isPending = type === "pending" || type === "pending_stale";
    const isApproved = type === "approved";
    const reminderCount = rep.reminderCount ?? 0;
    const remindersRemaining = rep.remindersRemaining ?? Math.max(0, 2 - reminderCount);
    const canRemind = isPending && remindersRemaining > 0;

    const href = brokerPropertyDetailHref(rep.propertyId);
    const action = isPending
        ? {
              label: canRemind
                  ? reminderCount > 0
                      ? `Remind again (${remindersRemaining} left)`
                      : "Remind owner"
                  : "Reminders used",
              href,
              kind: "remind" as const,
          }
        : type === "declined"
          ? { label: "View", href, kind: "view" as const }
          : { label: "Open", href, kind: "open" as const };

    return {
        id: rep.id,
        type,
        propertyId: rep.propertyId,
        title,
        amountInr,
        isRent,
        note: requestNote(type, isApproved ? daysSince : daysWaiting),
        action,
        reminderCount,
        remindersRemaining,
        canRemind,
        ...(isApproved
            ? {
                  approvedAt: decidedAt?.toISOString() ?? createdAt.toISOString(),
                  daysSince,
              }
            : {}),
        ...(isPending
            ? {
                  requestedAt: createdAt.toISOString(),
                  daysWaiting,
                  ownerSeen: false,
              }
            : {}),
    };
}

export function mapBrokerRequests(
    representations: RepresentationItem[],
    quotaFromApi: DashboardRequestQuota | null | undefined,
    now = new Date(),
): BrokerRequestsResult {
    const outbound = representations.filter(
        (rep) => (rep.initiatedBy ?? "broker").toLowerCase() === "broker",
    );

    const counts = {
        approved: outbound.filter((rep) => rep.status === "accepted").length,
        pending: outbound.filter((rep) => rep.status === "pending").length,
        declined: outbound.filter((rep) => rep.status === "rejected").length,
    };

    const quota =
        quotaFromApi != null
            ? {
                  limit: Number(quotaFromApi.limit) || 10,
                  used: Number(quotaFromApi.used) || 0,
                  remaining: Number(quotaFromApi.remaining) || 0,
                  resetsOn: String(quotaFromApi.resetsOn || formatDateIso(now)),
              }
            : {
                  limit: 10,
                  used: Math.min(10, counts.approved + counts.pending + counts.declined),
                  remaining: Math.max(0, 10 - (counts.approved + counts.pending + counts.declined)),
                  resetsOn: formatDateIso(now),
              };

    const items = outbound
        .map((rep) => mapRow(rep, now))
        .filter((item): item is BrokerRequestItem => item != null)
        .sort((left, right) => {
            const leftAt = left.requestedAt ?? left.approvedAt ?? "";
            const rightAt = right.requestedAt ?? right.approvedAt ?? "";
            return +new Date(rightAt) - +new Date(leftAt);
        });

    return { counts, quota, items };
}
