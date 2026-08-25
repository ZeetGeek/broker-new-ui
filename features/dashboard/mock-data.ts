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

export type RequestCounts = {
    waitingOnOwner: number;
    approved: number;
    notAccepted: number;
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
    requestCounts: RequestCounts;
    activeClientCount: number;
    pipeline: PipelineStageCount[];
    followUps: FollowUpItem[];
    overdueFollowUpCount: number;
    newInAreas: AreaPropertyItem[];
};

export const FIRST_WEEK_DAYS = 7;

export const TODAY_PLACEHOLDER: TodayAgenda = {
    date: "2026-08-25",
    doneCount: 1,
    remainingCount: 3,
    items: [
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
    ],
};

export const dashboardMock: DashboardMock = {
    siteVisitCount: 2,
    requestsWaitingCount: 3,
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
    requestCounts: {
        waitingOnOwner: 3,
        approved: 1,
        notAccepted: 2,
    },
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
