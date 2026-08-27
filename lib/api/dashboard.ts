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

export type DashboardBrokerRequest = {
    id: string;
    status: string;
    statusLabel: string;
    propertyId: string;
    propertyTitle: string;
    createdAt: string;
    decidedAt: string;
    ownerName: string;
    ownerVerified: boolean;
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
    summary: Record<string, number | string>;
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
