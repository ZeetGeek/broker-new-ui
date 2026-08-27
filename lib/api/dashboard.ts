import { apiFetch } from "@/lib/api/client";

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
};

export const dashboardApi = {
    get() {
        return apiFetch<DashboardResponse>("/dashboard");
    },
};
