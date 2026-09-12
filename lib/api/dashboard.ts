import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

export type DashboardVisit = {
    id: string;
    propertyTitle: string;
    scheduledAt: string;
    dateLabel: string;
    timeLabel: string;
    status: string | null;
    statusLabel: string;
    clientName: string;
    brokerName: string;
    participantsLabel: string;
    clientPhone?: string | null;
};

export type DashboardOwnerInvite = {
    id: string;
    propertyId: string;
    propertyTitle: string;
    ownerName: string;
    ownerVerified: boolean;
    message: string | null;
    createdAt: string;
};

export type DashboardBrokerRequestAction = {
    label: string;
    href: string;
};

export type DashboardBrokerRequest = {
    id: string;
    propertyId: string;
    propertyTitle: string;
    configLabel: string;
    locality: string;
    city: string | null;
    amountInr: number;
    isRent: boolean;
    transactionType: string | null;
    ownerName: string;
    ownerVerified: boolean;
    status: string;
    statusLabel: string;
    message: string | null;
    createdAt: string;
    decidedAt: string | null;
    daysWaiting: number | null;
    daysSinceDecision: number | null;
    clientCount: number;
    hasClient: boolean;
    attentionType: "approved_untouched" | "pending_stale" | null;
    note: string;
    action: DashboardBrokerRequestAction;
};

export type DashboardRequestQuota = {
    limit: number;
    used: number;
    remaining: number;
    resetsOn: string;
};

export type DashboardFollowUp = {
    id: string;
    leadId: string;
    stage: string;
    title: string;
    context: string;
    due: "overdue" | "today" | "upcoming";
    dueLabel: string;
    daysOverdue: number;
    daysStuck?: number;
    clientId: string;
    clientName: string;
    clientPhone: string;
    channel: "whatsapp" | "phone" | "none";
    href: string;
    propertyId?: string | null;
    updatedAt?: string | null;
};

export type DashboardFollowUps = {
    overdueCount: number;
    remainingThisWeek: number;
    items: DashboardFollowUp[];
    allCount?: number;
};

export type DashboardActivityItem = {
    id: string;
    category: string;
    action: string;
    title: string;
    detail: string | null;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
    whenLabel: string;
    href: string;
    actorName: string | null;
    actorAvatarUrl: string | null;
};

export type DashboardActivity = {
    items: DashboardActivityItem[];
    remainingCount: number;
    totalCount: number;
};

export type DashboardRepresentedProperty = {
    id: string;
    configLabel: string;
    locality: string;
    amountInr: number;
    isRent: boolean;
    areaSqft: number;
    furnishingLabel: string;
    ownerFirstName: string;
    visitCount: number;
    interestedCount: number;
    daysSinceActivity: number;
    isStale: boolean;
    stageLabel?: string;
    negotiationClientName?: string;
    shareHref: string;
    bookVisitHref: string;
    imageSrc: string;
};

export type DashboardYouRepresent = {
    totalCount: number;
    properties: DashboardRepresentedProperty[];
};

export type DashboardAreaProperty = {
    id: string;
    configLabel: string;
    locality: string;
    amountInr: number;
    isRent: boolean;
    areaSqft: number;
    furnishingLabel: string;
    detailLabel?: string;
    listedHoursAgo: number;
    brokerRequestCount: number;
    hasRequested: boolean;
    isBookmarked: boolean;
    imageSrc: string;
};

export type PipelineFunnelStage = {
    stage: string;
    label: string;
    count: number;
};

export type DashboardResponse = {
    portal: "owner" | "broker";
    greeting: { firstName: string; fullName: string };
    dayStreak: number;
    summary: Record<string, number | string | DashboardRequestQuota>;
    quickActions: Array<{ key: string; label: string }>;
    charts: {
        leadsTrend?: unknown;
        pipelineFunnel?: PipelineFunnelStage[];
        propertyStatus?: unknown;
        requestsAndVisits?: unknown;
    };
    upcomingVisits?: DashboardVisit[];
    ownerInvites?: DashboardOwnerInvite[];
    brokerRequests?: DashboardBrokerRequest[];
    followUps?: DashboardFollowUps;
    activity?: DashboardActivity;
    youRepresent?: DashboardYouRepresent;
    newInAreas?: DashboardAreaProperty[];
};

export const dashboardApi = {
    get() {
        if (isMockMode()) {
            return Promise.resolve({
                portal: "broker",
                greeting: { firstName: "Zeet", fullName: "Zeet Patel" },
                dayStreak: 2,
                summary: {
                    pendingBrokerRequests: 4,
                    requestQuota: {
                        limit: 10,
                        used: 8,
                        remaining: 2,
                        resetsOn: new Date(Date.now() + 9 * 86_400_000).toISOString(),
                    },
                },
                quickActions: [],
                charts: {
                    pipelineFunnel: [
                        { stage: "new", label: "New", count: 5 },
                        { stage: "contacted", label: "Contacted", count: 3 },
                        { stage: "site_visit", label: "Site visit", count: 3 },
                        { stage: "negotiation", label: "Negotiation", count: 1 },
                    ],
                },
            } satisfies DashboardResponse);
        }
        return apiFetch<DashboardResponse>("/dashboard");
    },
};
