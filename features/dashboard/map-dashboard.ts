import type {
    DashboardActivity,
    DashboardBrokerRequest,
    DashboardFollowUps,
    DashboardResponse,
    DashboardVisit,
    PipelineFunnelStage,
} from "@/lib/api/dashboard";
import type { UserProfile } from "@/lib/api/profile";
import {
    calendarDaysBetween,
    formatDateIso,
    formatTime24,
    formatTimeIn,
    isSameCalendarDay,
} from "@/lib/format/date";

import type {
    ActivityData,
    ActivityEventType,
    AreaPropertyItem,
    FollowUp,
    FollowUpsData,
    NextShowingMock,
    PipelineData,
    PipelineStageKey,
    RequestRowItem,
    RequestsData,
    ReraStatus,
    TodayAgenda,
    TodayItem,
    YouRepresentData,
} from "./mock-data";

export type BrokerDashboardView = {
    siteVisitCount: number;
    requestsWaitingCount: number;
    reraStatus: ReraStatus;
    serviceAreas: string[];
    phoneDigits: string;
    email: string;
    nextShowing: {
        id: string;
        scheduledAt: Date;
        configLabel: string;
        locality: string;
        address: string;
        amountInr: number;
        isRent: boolean;
        meetNote: string;
        distanceKm: number;
        brokerNote: string;
        status: NextShowingMock["status"];
        clientName: string;
        clientPhoneDigits: string;
    } | null;
    today: TodayAgenda;
    requests: RequestsData;
    pipelineCard: PipelineData;
    followUps: FollowUpsData;
    activity: ActivityData;
    youRepresent: YouRepresentData;
    newInAreas: AreaPropertyItem[];
    userName: string;
    avatarUrl?: string;
    unreadCount: number;
};

const PIPELINE_KEYS: PipelineStageKey[] = ["new", "contacted", "site_visit", "negotiation"];

const PIPELINE_LABELS: Record<PipelineStageKey, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    negotiation: "Negotiation",
};

function phoneDigits(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "").slice(-10);
}

/**
 * API titles arrive in two shapes: delimited ("3 BHK · Vesu") and prose
 * ("2BHK Apartment in Baner"). Split on whichever is present so the locality
 * does not end up duplicated into the config label.
 */
function parseTitle(propertyTitle: string): { configLabel: string; locality: string } {
    const title = propertyTitle.trim();
    const delimited = title
        .split(/[·,|-]/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (delimited.length >= 2) {
        return { configLabel: delimited[0], locality: delimited[1] };
    }
    const prose = title.match(/^(.*?)\s+in\s+(.+)$/i);
    if (prose) {
        return { configLabel: prose[1].trim(), locality: prose[2].trim() };
    }
    return { configLabel: title || "Property", locality: "" };
}

function mapReraStatus(profile: UserProfile | null): ReraStatus {
    const license = profile?.licenseNumber ?? profile?.broker?.licenseNumber;
    const verified = profile?.verified ?? profile?.broker?.verified;
    if (verified) return "verified";
    if (license?.trim()) return "verifying";
    return "profile_incomplete";
}

function mapNextShowing(visit: DashboardVisit | undefined) {
    if (!visit) return null;
    const scheduledAt = new Date(visit.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return null;
    const { configLabel, locality } = parseTitle(visit.propertyTitle);
    return {
        id: visit.id,
        scheduledAt,
        configLabel,
        locality,
        // The visits API carries no address, price, or meeting note - only
        // propertyTitle. Leave them empty so the card hides those lines rather
        // than echoing the title or repeating the status badge.
        address: "",
        amountInr: 0,
        isRent: false,
        meetNote: "",
        distanceKm: 0,
        brokerNote: "",
        status: visit.status === "confirmed" ? ("confirmed" as const) : ("awaiting_owner" as const),
        clientName: visit.clientName || "Client",
        clientPhoneDigits: phoneDigits(visit.clientPhone),
    };
}

/**
 * Visit status in the broker's words. The raw `statusLabel` is internal shorthand
 * ("pending"), which does not tell the broker who they are waiting on.
 */
function visitStateLabel(visit: DashboardVisit): string {
    if (visit.status === "confirmed") return "Owner confirmed the slot";
    if (visit.status === "cancelled") return "Visit cancelled";
    if (visit.status === "completed") return "Visit done";
    return visit.statusLabel ? "Owner hasn't confirmed yet" : "Awaiting owner";
}

function mapTodayAgenda(visits: DashboardVisit[], now: Date): TodayAgenda {
    const todays = visits
        .map((visit) => {
            const scheduledAt = new Date(visit.scheduledAt);
            if (Number.isNaN(scheduledAt.getTime()) || !isSameCalendarDay(scheduledAt, now)) {
                return null;
            }
            const time = formatTime24(scheduledAt);
            const timeLabel = formatTimeIn(scheduledAt);
            const item: TodayItem = {
                id: visit.id,
                kind: "site_visit",
                time,
                timeLabel,
                title: `Site visit · ${visit.propertyTitle}`,
                clientName: visit.clientName || "Client",
                subtitle: visitStateLabel(visit),
                state: scheduledAt.getTime() < now.getTime() ? "done" : "upcoming",
                href: `/broker/visits/${visit.id}`,
            };
            return item;
        })
        .filter((item): item is TodayItem => item != null)
        .sort((a, b) => a.time.localeCompare(b.time));

    const nextUpcoming = todays.find((item) => item.state === "upcoming");
    if (nextUpcoming) {
        nextUpcoming.isNext = true;
    }

    return {
        date: formatDateIso(now),
        doneCount: todays.filter((item) => item.state === "done").length,
        remainingCount: todays.filter((item) => item.state !== "done").length,
        items: todays,
    };
}

/** Localities arrive from the API in mixed case ("baner"); render them as names. */
function titleCaseLocality(value: string): string {
    return value.replace(/[a-z]/g, (char) => char.toUpperCase());
}

/**
 * What the broker is actually waiting on, in plain words. The API's
 * "awaiting owner response" is shorthand that does not say what to do next.
 */
function requestNote(request: DashboardBrokerRequest, daysWaiting: number): string {
    const status = request.status.toLowerCase();

    if (status === "declined" || status === "rejected") {
        return "The owner said no to this one";
    }
    if (status === "approved" || status === "accepted") {
        return "Approved - you can start working this property";
    }
    if (daysWaiting <= 0) {
        return "Sent today - waiting on the owner";
    }
    const days = daysWaiting === 1 ? "1 day" : `${daysWaiting} days`;
    return `Waiting ${days} - the owner hasn't replied yet`;
}

function mapRequestRow(request: DashboardBrokerRequest, now: Date): RequestRowItem {
    const locality = titleCaseLocality(request.locality ?? "");
    const title =
        [request.configLabel, locality].filter(Boolean).join(" · ") || request.propertyTitle;
    const waitingDays =
        request.daysWaiting ?? calendarDaysBetween(new Date(request.createdAt), now);
    const base = {
        id: request.id,
        propertyId: request.propertyId,
        title,
        amountInr: request.amountInr,
        isRent: request.isRent,
        note: requestNote(request, waitingDays),
        action: request.action,
    };

    if (request.attentionType === "approved_untouched") {
        return {
            ...base,
            type: "approved_untouched",
            approvedAt: request.decidedAt ?? request.createdAt,
            daysSince: request.daysSinceDecision ?? 0,
        };
    }

    if (request.attentionType === "pending_stale") {
        return {
            ...base,
            note: `No reply in ${waitingDays} days - worth a nudge`,
            type: "pending_stale",
            requestedAt: request.createdAt,
            daysWaiting: waitingDays,
            ownerSeen: false,
        };
    }

    const status = request.status.toLowerCase();
    if (status === "declined" || status === "rejected") {
        return { ...base, type: "declined" };
    }

    if (status === "approved" || status === "accepted") {
        return {
            ...base,
            type: "approved",
            approvedAt: request.decidedAt ?? request.createdAt,
            daysSince: request.daysSinceDecision ?? undefined,
        };
    }

    return {
        ...base,
        type: "pending",
        requestedAt: request.createdAt,
        daysWaiting: waitingDays,
    };
}

function mapRequests(
    summary: DashboardResponse["summary"],
    requests: DashboardBrokerRequest[],
    now: Date,
): RequestsData {
    const approved = Number(summary.approvedBrokerRequests ?? 0) || 0;
    const pending = Number(summary.pendingBrokerRequests ?? 0) || 0;
    const declined = Number(summary.declinedBrokerRequests ?? 0) || 0;
    const quotaFromApi = summary.requestQuota;
    const quota =
        typeof quotaFromApi === "object" && quotaFromApi !== null
            ? {
                  limit: Number(quotaFromApi.limit) || 10,
                  used: Number(quotaFromApi.used) || 0,
                  remaining: Number(quotaFromApi.remaining) || 0,
                  resetsOn: String(quotaFromApi.resetsOn || formatDateIso(now)),
              }
            : {
                  limit: 10,
                  used: Math.min(10, approved + pending + declined),
                  remaining: Math.max(0, 10 - (approved + pending + declined)),
                  resetsOn: formatDateIso(now),
              };

    const items = [...requests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map((request) => mapRequestRow(request, now));

    return {
        counts: {
            approved,
            pending,
            declined,
        },
        quota,
        items,
    };
}

function mapFollowUps(followUps: DashboardFollowUps | undefined): FollowUpsData {
    if (!followUps) {
        return {
            overdueCount: 0,
            remainingThisWeek: 0,
            items: [],
        };
    }

    const items: FollowUp[] = (followUps.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        context: item.context,
        due: item.due,
        dueLabel: item.dueLabel,
        daysOverdue: item.daysOverdue ?? 0,
        clientId: item.clientId,
        clientName: item.clientName,
        clientPhone: item.clientPhone || "",
        channel: item.channel,
        href: item.href,
    }));

    return {
        overdueCount: followUps.overdueCount ?? items.filter((i) => i.due === "overdue").length,
        remainingThisWeek: followUps.remainingThisWeek ?? 0,
        items,
    };
}

function mapActivityEventType(category: string, action: string): ActivityEventType {
    const haystack = `${category} ${action}`.toLowerCase();
    if (haystack.includes("approv")) return "request_approved";
    if (haystack.includes("declin") || haystack.includes("reject")) return "request_declined";
    if (haystack.includes("share") || haystack.includes("link") || haystack.includes("open")) {
        return "share_link_opened";
    }
    if (haystack.includes("unavailable")) return "property_unavailable";
    if (haystack.includes("price")) return "price_changed";
    if (haystack.includes("verif") || haystack.includes("rera")) return "verification_approved";
    if (haystack.includes("view")) return "request_viewed";
    return "request_viewed";
}

function mapActivity(activity: DashboardActivity | undefined): ActivityData {
    if (!activity) {
        return { items: [], remainingCount: 0 };
    }

    return {
        items: (activity.items ?? []).map((item) => ({
            id: item.id,
            type: mapActivityEventType(item.category, item.action),
            occurredAt: item.createdAt,
            href: item.href,
            title: item.title,
            subtitle: item.detail ?? "",
            actorKind: "owner",
        })),
        remainingCount: activity.remainingCount ?? 0,
    };
}

function mapYouRepresent(youRepresent: DashboardResponse["youRepresent"]): YouRepresentData {
    if (!youRepresent) {
        return { totalCount: 0, properties: [] };
    }

    return {
        totalCount: youRepresent.totalCount ?? 0,
        properties: (youRepresent.properties ?? []).map((property) => ({
            id: property.id,
            configLabel: property.configLabel,
            locality: property.locality,
            amountInr: property.amountInr,
            isRent: property.isRent,
            areaSqft: property.areaSqft,
            furnishingLabel: property.furnishingLabel,
            ownerFirstName: property.ownerFirstName,
            visitCount: property.visitCount,
            interestedCount: property.interestedCount,
            daysSinceActivity: property.daysSinceActivity,
            isStale: property.isStale,
            ...(property.stageLabel ? { stageLabel: property.stageLabel } : {}),
            ...(property.negotiationClientName
                ? { negotiationClientName: property.negotiationClientName }
                : {}),
            shareHref: property.shareHref,
            bookVisitHref: property.bookVisitHref,
            imageSrc: property.imageSrc,
        })),
    };
}

function mapNewInAreas(newInAreas: DashboardResponse["newInAreas"]): AreaPropertyItem[] {
    if (!newInAreas?.length) {
        return [];
    }

    return newInAreas.map((property) => ({
        id: property.id,
        configLabel: property.configLabel,
        locality: property.locality,
        amountInr: property.amountInr,
        isRent: property.isRent,
        areaSqft: property.areaSqft,
        furnishingLabel: property.furnishingLabel,
        ...(property.detailLabel ? { detailLabel: property.detailLabel } : {}),
        listedHoursAgo: property.listedHoursAgo,
        brokerRequestCount: property.brokerRequestCount,
        hasRequested: property.hasRequested,
        isBookmarked: property.isBookmarked,
        imageSrc: property.imageSrc,
    }));
}

function mapPipeline(funnel: PipelineFunnelStage[] | undefined): PipelineData {
    const byStage = new Map((funnel ?? []).map((row) => [row.stage, row.count]));
    const stages = PIPELINE_KEYS.map((key) => ({
        key,
        label: PIPELINE_LABELS[key],
        count: byStage.get(key) ?? 0,
    }));
    const activeTotal = stages.reduce((sum, stage) => sum + stage.count, 0);
    const won = byStage.get("closed_won") ?? 0;
    const lost = byStage.get("closed_lost") ?? 0;

    return {
        activeTotal,
        stages,
        stalled: null,
        thisMonth: { won, lost },
    };
}

export function mapBrokerDashboardView(
    data: DashboardResponse | null,
    profile: UserProfile | null,
    now = new Date(),
): BrokerDashboardView {
    const visits = data?.upcomingVisits ?? [];
    const todayVisits = visits.filter((visit) => {
        const scheduledAt = new Date(visit.scheduledAt);
        return !Number.isNaN(scheduledAt.getTime()) && isSameCalendarDay(scheduledAt, now);
    });

    const fullName =
        profile?.fullName?.trim() || data?.greeting?.fullName?.trim() || profile?.email || "Broker";

    return {
        siteVisitCount: todayVisits.length,
        requestsWaitingCount: Number(data?.summary?.pendingBrokerRequests ?? 0) || 0,
        reraStatus: mapReraStatus(profile),
        serviceAreas: profile?.broker?.serviceAreas ?? [],
        phoneDigits: phoneDigits(profile?.phone),
        email: profile?.email ?? "",
        nextShowing: mapNextShowing(visits[0]),
        today: mapTodayAgenda(visits, now),
        requests: mapRequests(data?.summary ?? {}, data?.brokerRequests ?? [], now),
        pipelineCard: mapPipeline(data?.charts?.pipelineFunnel),
        followUps: mapFollowUps(data?.followUps),
        activity: mapActivity(data?.activity),
        youRepresent: mapYouRepresent(data?.youRepresent),
        newInAreas: mapNewInAreas(data?.newInAreas),
        userName: fullName,
        avatarUrl: profile?.avatarUrl ?? undefined,
        unreadCount: profile?.notifications?.unreadCount ?? 0,
    };
}
