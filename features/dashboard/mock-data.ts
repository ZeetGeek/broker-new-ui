import type { PipelineStageId } from "@/config/constants";

export type SiteVisitItem = {
    id: string;
    timeLabel: string;
    title: string;
    clientName: string;
    statusLabel: string;
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
    activityStreakDays: number;
    phoneDigits: string;
    email: string;
    daysSinceSignup: number;
    firstWeekItems: FirstWeekItem[];
    nextShowing: NextShowingMock | null;
    todayVisits: SiteVisitItem[];
    requestCounts: RequestCounts;
    activeClientCount: number;
    pipeline: PipelineStageCount[];
    followUps: FollowUpItem[];
    overdueFollowUpCount: number;
    newInAreas: AreaPropertyItem[];
};

export const FIRST_WEEK_DAYS = 7;

export const dashboardMock: DashboardMock = {
    siteVisitCount: 2,
    requestsWaitingCount: 3,
    reraStatus: "verifying",
    serviceAreas: ["Vesu", "Adajan", "Pal"],
    activityStreakDays: 5,
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
        id: "visit-1",
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
    todayVisits: [
        {
            id: "visit-1",
            timeLabel: "11:00 am",
            title: "Site visit · 3 BHK, Vesu",
            clientName: "Milan Vamja",
            statusLabel: "confirmed",
        },
        {
            id: "visit-2",
            timeLabel: "4:30 pm",
            title: "Site visit · 2 BHK, Adajan",
            clientName: "Priya Shah",
            statusLabel: "awaiting owner slot",
        },
    ],
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
