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

/** Active CRM stages shown on the dashboard pipeline card (excludes won/lost). */
export type PipelineStageKey = "new" | "contacted" | "site_visit" | "negotiation";

export type PipelineStage = {
    key: PipelineStageKey;
    label: string;
    count: number;
};

export type PipelineData = {
    /** Excludes won/lost. */
    activeTotal: number;
    /** Always 4 stages, always New → Contacted → Site visit → Negotiation. */
    stages: PipelineStage[];
    stalled: { count: number; thresholdDays: number; href: string } | null;
    thisMonth: { won: number; lost: number };
};

export type FollowUpDue = "overdue" | "today" | "upcoming";
export type FollowUpChannel = "whatsapp" | "phone" | "none";

export type FollowUp = {
    id: string;
    /** The action, e.g. "Call Rahul Mehta". */
    title: string;
    /** Client + why, e.g. "After Vesu site visit · 3 BHK". */
    context: string;
    due: FollowUpDue;
    /** "2d over" | "Today" | "Tomorrow" | "Fri". */
    dueLabel: string;
    /** 0 when not overdue. */
    daysOverdue: number;
    clientId: string;
    /** Display name for a11y labels on channel actions. */
    clientName: string;
    /** E.164, e.g. "+919876543210". */
    clientPhone: string;
    channel: FollowUpChannel;
    href: string;
};

export type FollowUpsData = {
    overdueCount: number;
    /** Pre-sorted by the server. */
    items: FollowUp[];
    /** Items not shown in the card. */
    remainingThisWeek: number;
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
    /** Full property address for the visit. */
    address: string;
    amountInr: number;
    isRent: boolean;
    meetNote: string;
    /** Approximate travel distance to the property, in kilometres. */
    distanceKm: number;
    /** Extra visit note the broker shared with the client. */
    brokerNote: string;
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
    pipelineCard: PipelineData;
    followUps: FollowUpsData;
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

export const PIPELINE_PLACEHOLDER: PipelineData = {
    activeTotal: 12,
    stages: [
        { key: "new", label: "New", count: 5 },
        { key: "contacted", label: "Contacted", count: 3 },
        { key: "site_visit", label: "Site visit", count: 3 },
        { key: "negotiation", label: "Negotiation", count: 1 },
    ],
    stalled: { count: 2, thresholdDays: 14, href: "/broker/clients?filter=stalled" },
    thisMonth: { won: 1, lost: 2 },
};

export const FOLLOWUPS_PLACEHOLDER: FollowUpsData = {
    overdueCount: 2,
    remainingThisWeek: 2,
    items: [
        {
            id: "fu_01",
            title: "Call Rahul Mehta",
            context: "After Vesu site visit · 3 BHK",
            due: "overdue",
            dueLabel: "2d over",
            daysOverdue: 2,
            clientId: "cl_003",
            clientName: "Rahul Mehta",
            clientPhone: "+919876543210",
            channel: "whatsapp",
            href: "/broker/clients/cl_003",
        },
        {
            id: "fu_02",
            title: "Send Adajan options",
            context: "Priya Shah · budget ₹20–25 L",
            due: "overdue",
            dueLabel: "1d over",
            daysOverdue: 1,
            clientId: "cl_002",
            clientName: "Priya Shah",
            clientPhone: "+919876500011",
            channel: "whatsapp",
            href: "/broker/clients/cl_002",
        },
        {
            id: "fu_03",
            title: "Confirm owner slot · Pal",
            context: "Visit booked — chase confirmation",
            due: "today",
            dueLabel: "Today",
            daysOverdue: 0,
            clientId: "cl_004",
            clientName: "Pal visit",
            clientPhone: "+919876500022",
            channel: "phone",
            href: "/broker/clients/cl_004",
        },
        {
            id: "fu_04",
            title: "Share Piplod listing",
            context: "Nisha Desai · asked on WhatsApp",
            due: "upcoming",
            dueLabel: "Tomorrow",
            daysOverdue: 0,
            clientId: "cl_005",
            clientName: "Nisha Desai",
            clientPhone: "+919876500033",
            channel: "whatsapp",
            href: "/broker/clients/cl_005",
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
        address: "12, Green Park Society, Vesu, Surat 395007",
        amountInr: 11_500_000,
        isRent: false,
        meetNote: "Meet at the gate",
        distanceKm: 4.2,
        brokerNote: "Share gate code 4821 — parking in basement 2.",
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
    pipelineCard: PIPELINE_PLACEHOLDER,
    followUps: FOLLOWUPS_PLACEHOLDER,
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
