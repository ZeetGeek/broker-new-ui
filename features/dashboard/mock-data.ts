import type { PipelineStageId } from "@/config/constants";

export type TodayItemKind = "site_visit" | "call";
export type TodayItemState = "done" | "upcoming" | "blocked";

export type TodayItem = {
    id: string;
    kind: TodayItemKind;
    /** 24h `HH:mm` for sorting. */
    time: string;
    timeLabel: string;
    title: string;
    subtitle: string;
    state: TodayItemState;
    /** Marks the next upcoming item after "now" — stronger type treatment. */
    isNext?: boolean;
    clientId?: string;
    propertyId?: string;
    href: string;
};

export type TodayAgenda = {
    date: string;
    doneCount: number;
    remainingCount: number;
    items: TodayItem[];
};

export type RequestAttentionType = "approved_untouched" | "pending_stale";

export type RequestCounts = {
    approved: number;
    pending: number;
    declined: number;
};

export type RequestQuota = {
    limit: number;
    used: number;
    remaining: number;
    /** ISO date — when the weekly quota resets. */
    resetsOn: string;
};

export type RequestAttentionItem = {
    id: string;
    type: RequestAttentionType;
    propertyId: string;
    title: string;
    amountInr: number;
    isRent: boolean;
    note: string;
    action: { label: string; href: string };
    /** Present when type is `approved_untouched`. */
    approvedAt?: string;
    daysSince?: number;
    /** Present when type is `pending_stale`. */
    requestedAt?: string;
    daysWaiting?: number;
    /** False = owner never opened; true + daysWaiting = stop waiting. */
    ownerSeen?: boolean;
};

export type RequestsData = {
    counts: RequestCounts;
    quota: RequestQuota;
    attention: RequestAttentionItem[];
};

export type PipelineStageCount = {
    stageId: PipelineStageId;
    count: number;
};

export type FollowUpItem = {
    id: string;
    title: string;
    dueLabel: string;
    isOverdue: boolean;
};

export type AreaPropertyItem = {
    id: string;
    configLabel: string;
    locality: string;
    amountInr: number;
    isRent: boolean;
    listedLabel: string;
    brokerRequestCount: number;
};

export type ReraStatus = "profile_incomplete" | "verifying" | "verified";

export type FirstWeekItem = {
    id: string;
    label: string;
    href: string;
    isComplete: boolean;
};

export type NextShowingStatus = "confirmed" | "awaiting_owner";

/** Static fields for the next showing; `scheduledAt` is derived from `now` + `minutesUntil`. */
export type NextShowingMock = {
    id: string;
    minutesUntil: number;
    configLabel: string;
    locality: string;
    amountInr: number;
    isRent: boolean;
    meetNote: string;
    status: NextShowingStatus;
    clientName: string;
    clientPhoneDigits: string;
};

export type DashboardMock = {
    siteVisitCount: number;
    requestsWaitingCount: number;
    reraStatus: ReraStatus;
    serviceAreas: string[];
    phoneDigits: string;
    email: string;
    daysSinceSignup: number;
    firstWeekItems: FirstWeekItem[];
    nextShowing: NextShowingMock | null;
    today: TodayAgenda;
    requests: RequestsData;
    activeClientCount: number;
    pipeline: PipelineStageCount[];
    followUps: FollowUpItem[];
    overdueFollowUpCount: number;
    newInAreas: AreaPropertyItem[];
};

export const FIRST_WEEK_DAYS = 7;

export const TODAY_PLACEHOLDER: TodayAgenda = {
    date: "2026-08-25",
    doneCount: 2,
    remainingCount: 5,
    items: [
        {
            id: "visit_00",
            kind: "site_visit",
            time: "08:30",
            timeLabel: "8:30 AM",
            title: "Site visit · 1 BHK, Pal",
            subtitle: "Amit Desai · marked done",
            state: "done",
            clientId: "cl_006",
            propertyId: "pr_099",
            href: "/broker/visits/visit_00",
        },
        {
            id: "visit_01",
            kind: "site_visit",
            time: "10:00",
            timeLabel: "10:00 AM",
            title: "Site visit · 2 BHK, Adajan",
            subtitle: "Priya Shah · marked done",
            state: "done",
            clientId: "cl_002",
            propertyId: "pr_114",
            href: "/broker/visits/visit_01",
        },
        {
            id: "visit_02",
            kind: "site_visit",
            time: "14:11",
            timeLabel: "2:11 PM",
            title: "Site visit · 3 BHK, Vesu",
            subtitle: "Milan Vamja · confirmed",
            state: "upcoming",
            isNext: true,
            clientId: "cl_001",
            propertyId: "pr_108",
            href: "/broker/visits/visit_02",
        },
        {
            id: "visit_03",
            kind: "site_visit",
            time: "16:30",
            timeLabel: "4:30 PM",
            title: "Site visit · 2 BHK rent, Pal",
            subtitle: "Awaiting owner slot confirmation",
            state: "blocked",
            clientId: "cl_004",
            propertyId: "pr_121",
            href: "/broker/visits/visit_03",
        },
        {
            id: "task_09",
            kind: "call",
            time: "18:00",
            timeLabel: "6:00 PM",
            title: "Call · Rahul Mehta",
            subtitle: "Discuss Vesu feedback",
            state: "upcoming",
            clientId: "cl_003",
            href: "/broker/clients/cl_003",
        },
        {
            id: "visit_04",
            kind: "site_visit",
            time: "19:00",
            timeLabel: "7:00 PM",
            title: "Site visit · 4 BHK, Vesu",
            subtitle: "Neha Patel · confirmed",
            state: "upcoming",
            clientId: "cl_007",
            propertyId: "pr_130",
            href: "/broker/visits/visit_04",
        },
        {
            id: "task_10",
            kind: "call",
            time: "20:15",
            timeLabel: "8:15 PM",
            title: "Call · Kavita Joshi",
            subtitle: "Share Pal options",
            state: "upcoming",
            clientId: "cl_008",
            href: "/broker/clients/cl_008",
        },
    ],
};

export const REQUESTS_PLACEHOLDER: RequestsData = {
    counts: { approved: 2, pending: 4, declined: 2 },
    quota: { limit: 10, used: 8, remaining: 2, resetsOn: "2026-08-31" },
    attention: [
        {
            id: "req_042",
            type: "approved_untouched",
            propertyId: "pr_108",
            title: "3 BHK · Vesu",
            amountInr: 11_500_000,
            isRent: false,
            approvedAt: "2026-08-23T09:10:00+05:30",
            daysSince: 2,
            note: "Approved 2 days ago · no client added yet",
            action: { label: "Open", href: "/broker/properties/pr_108" },
        },
        {
            id: "req_039",
            type: "approved_untouched",
            propertyId: "pr_099",
            title: "1 BHK · Pal",
            amountInr: 4_200_000,
            isRent: false,
            approvedAt: "2026-08-24T14:00:00+05:30",
            daysSince: 1,
            note: "Approved yesterday · no client added yet",
            action: { label: "Open", href: "/broker/properties/pr_099" },
        },
        {
            id: "req_047",
            type: "pending_stale",
            propertyId: "pr_121",
            title: "2 BHK rent · Adajan",
            amountInr: 22_000,
            isRent: true,
            requestedAt: "2026-08-19T16:40:00+05:30",
            daysWaiting: 6,
            ownerSeen: false,
            note: "Waiting 6 days · owner hasn't opened",
            action: { label: "Nudge", href: "/broker/properties/pr_121?nudge=1" },
        },
        {
            id: "req_051",
            type: "pending_stale",
            propertyId: "pr_130",
            title: "4 BHK · Pal",
            amountInr: 18_500_000,
            isRent: false,
            requestedAt: "2026-08-18T11:20:00+05:30",
            daysWaiting: 7,
            ownerSeen: true,
            note: "Waiting 7 days · owner saw it 4 days ago",
            action: { label: "View", href: "/broker/properties/pr_130" },
        },
    ],
};

export const dashboardMock: DashboardMock = {
    siteVisitCount: 2,
    requestsWaitingCount: 4,
    reraStatus: "verifying",
    serviceAreas: ["Vesu", "Adajan", "Pal"],
    phoneDigits: "9876543210",
    email: "zeet.patel@gmail.com",
    daysSinceSignup: 2,
    firstWeekItems: [
        {
            id: "rera",
            label: "Add your RERA number",
            href: "/broker/profile/edit",
            isComplete: true,
        },
        {
            id: "areas",
            label: "Set your service areas",
            href: "/broker/profile/edit",
            isComplete: true,
        },
        {
            id: "browse",
            label: "Browse properties in your areas",
            href: "/broker/properties",
            isComplete: false,
        },
        {
            id: "request",
            label: "Send your first request",
            href: "/broker/properties",
            isComplete: false,
        },
    ],
    nextShowing: {
        id: "visit_02",
        minutesUntil: 134,
        configLabel: "3 BHK",
        locality: "Vesu",
        amountInr: 11_500_000,
        isRent: false,
        meetNote: "Meet at the gate",
        status: "confirmed",
        clientName: "Milan Vamja",
        clientPhoneDigits: "9876501234",
    },
    today: TODAY_PLACEHOLDER,
    requests: REQUESTS_PLACEHOLDER,
    activeClientCount: 14,
    pipeline: [
        { stageId: "new", count: 5 },
        { stageId: "contacted", count: 4 },
        { stageId: "site_visit", count: 3 },
        { stageId: "negotiation", count: 1 },
        { stageId: "closed_won", count: 1 },
    ],
    followUps: [
        {
            id: "fu-1",
            title: "Call Milan Vamja",
            dueLabel: "2 days over",
            isOverdue: true,
        },
        {
            id: "fu-2",
            title: "Send Adajan options · Priya",
            dueLabel: "1 day over",
            isOverdue: true,
        },
        {
            id: "fu-3",
            title: "Confirm owner slot · Vesu",
            dueLabel: "Today",
            isOverdue: false,
        },
    ],
    overdueFollowUpCount: 2,
    newInAreas: [
        {
            id: "prop-1",
            configLabel: "3 BHK",
            locality: "Vesu",
            amountInr: 11_500_000,
            isRent: false,
            listedLabel: "Listed 2 hours ago",
            brokerRequestCount: 0,
        },
        {
            id: "prop-2",
            configLabel: "2 BHK rent",
            locality: "Adajan",
            amountInr: 22_000,
            isRent: true,
            listedLabel: "Listed 5 hours ago",
            brokerRequestCount: 1,
        },
    ],
};
