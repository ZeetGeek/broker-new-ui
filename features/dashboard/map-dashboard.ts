import type {
    DashboardBrokerRequest,
    DashboardResponse,
    DashboardVisit,
    PipelineFunnelStage,
} from "@/lib/api/dashboard";
import type { UserProfile } from "@/lib/api/profile";
import { formatDateIso } from "@/lib/format/date";

import type {
    FollowUpsData,
    NextShowingMock,
    PipelineData,
    PipelineStageKey,
    RequestsData,
    ReraStatus,
    TodayAgenda,
    TodayItem,
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

function isSameLocalDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function timeParts(date: Date): { time: string; timeLabel: string } {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const timeLabel = date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    return { time, timeLabel };
}

function parseTitle(propertyTitle: string): { configLabel: string; locality: string } {
    const parts = propertyTitle
        .split(/[·,|-]/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (parts.length >= 2) {
        return { configLabel: parts[0], locality: parts[1] };
    }
    return { configLabel: propertyTitle || "Property", locality: "" };
}

function daysBetween(from: Date, to: Date) {
    const ms = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(ms / 86_400_000));
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
        address: visit.propertyTitle,
        amountInr: 0,
        isRent: false,
        meetNote: visit.statusLabel || "Scheduled",
        distanceKm: 0,
        brokerNote: "",
        status: visit.status === "confirmed" ? ("confirmed" as const) : ("awaiting_owner" as const),
        clientName: visit.clientName || "Client",
        clientPhoneDigits: phoneDigits(visit.clientPhone),
    };
}

function mapTodayAgenda(visits: DashboardVisit[], now: Date): TodayAgenda {
    const todays = visits
        .map((visit) => {
            const scheduledAt = new Date(visit.scheduledAt);
            if (Number.isNaN(scheduledAt.getTime()) || !isSameLocalDay(scheduledAt, now)) {
                return null;
            }
            const { time, timeLabel } = timeParts(scheduledAt);
            const item: TodayItem = {
                id: visit.id,
                kind: "site_visit",
                time,
                timeLabel,
                title: `Site visit · ${visit.propertyTitle}`,
                subtitle: `${visit.clientName} · ${visit.statusLabel.toLowerCase()}`,
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

function mapRequests(
    summary: Record<string, number | string>,
    requests: DashboardBrokerRequest[],
    now: Date,
): RequestsData {
    console.log("summary===>", summary);
    console.log("requests===>", requests);
    const approved = Number(summary.approvedBrokerRequests ?? requests.length) || 0;
    const pending = Number(summary.pendingBrokerRequests ?? requests.length) || 0;
    const declined = Number(summary.declinedBrokerRequests ?? requests.length) || 0;
    const attention = requests.slice(0, 5).map((request) => {
        const createdAt = new Date(request.createdAt);
        const daysWaiting = Number.isNaN(createdAt.getTime()) ? 0 : daysBetween(createdAt, now);
        return {
            id: request.id,
            type: "pending_stale" as const,
            propertyId: request.propertyId,
            title: request.propertyTitle,
            amountInr: 0,
            isRent: false,
            requestedAt: request.createdAt,
            daysWaiting,
            ownerSeen: false,
            note:
                daysWaiting > 0
                    ? `Waiting ${daysWaiting} day${daysWaiting === 1 ? "" : "s"} · from ${request.ownerName}`
                    : `New request from ${request.ownerName}`,
            action: {
                label: "View",
                href: `/broker/properties/${request.propertyId}`,
            },
        };
    });

    return {
        counts: {
            approved,
            pending,
            declined,
        },
        quota: {
            limit: Math.max(pending, 10),
            used: pending,
            remaining: Math.max(0, 10 - pending),
            resetsOn: formatDateIso(now),
        },
        attention,
    };
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
        return !Number.isNaN(scheduledAt.getTime()) && isSameLocalDay(scheduledAt, now);
    });

    const fullName =
        profile?.fullName?.trim() || data?.greeting?.fullName?.trim() || profile?.email || "Broker";

    console.log("data", data);
    return {
        siteVisitCount: todayVisits.length,
        requestsWaitingCount: Number(data?.summary?.pendingRequests ?? 0) || 0,
        reraStatus: mapReraStatus(profile),
        serviceAreas: profile?.broker?.serviceAreas ?? [],
        phoneDigits: phoneDigits(profile?.phone),
        email: profile?.email ?? "",
        nextShowing: mapNextShowing(visits[0]),
        today: mapTodayAgenda(visits, now),
        requests: mapRequests(data?.summary ?? {}, data?.brokerRequests ?? [], now),
        pipelineCard: mapPipeline(data?.charts?.pipelineFunnel),
        followUps: {
            overdueCount: 0,
            remainingThisWeek: 0,
            items: [],
        },
        userName: fullName,
        avatarUrl: profile?.avatarUrl ?? undefined,
        unreadCount: profile?.notifications?.unreadCount ?? 0,
    };
}
