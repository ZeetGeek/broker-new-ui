import type { DealStatus } from "@/features/pipeline/types";

/** Deliberately separate from saved clients, offers and property analytics. */
export type DemoClient = {
    id: string;
    name: string;
    type: "Buyer" | "Investor";
    stage: DealStatus;
    activity: string;
    followUp: string;
    offer?: number;
    withdrawn?: boolean;
    attention?: { kind: "overdue" | "today" | "visit"; title: string; detail: string };
};

export const DEMO_ASK_INR = 25_000_000;
export const DEMO_CLOSED_INR = 24_800_000;
export const DEMO_COMMISSION_PERCENT = 0.5;
export const DEMO_DAYS_LISTED = 24;

export const DEMO_CLIENTS: DemoClient[] = [
    {
        id: "demo-karan",
        name: "Karan Shah",
        type: "Buyer",
        stage: "negotiation",
        activity: "Revised offer recorded today",
        followUp: "Today, 4:00 PM",
        offer: 24_800_000,
        attention: {
            kind: "today",
            title: "Discuss the revised offer",
            detail: "Karan Shah · Follow up today at 4:00 PM",
        },
    },
    {
        id: "demo-deepa",
        name: "Deepa Shah",
        type: "Investor",
        stage: "negotiation",
        activity: "Offer recorded 2 days ago",
        followUp: "Yesterday, 11:00 AM",
        offer: 24_000_000,
        attention: {
            kind: "overdue",
            title: "Follow up on the offer",
            detail: "Deepa Shah · Due yesterday at 11:00 AM",
        },
    },
    {
        id: "demo-pranav",
        name: "Pranav Rao",
        type: "Buyer",
        stage: "negotiation",
        activity: "Discussed price yesterday",
        followUp: "Tomorrow, 10:30 AM",
        offer: 24_500_000,
    },
    {
        id: "demo-shreya",
        name: "Shreya Kapoor",
        type: "Investor",
        stage: "negotiation",
        activity: "Offer recorded 3 days ago",
        followUp: "Tomorrow, 3:00 PM",
        offer: 23_700_000,
    },
    {
        id: "demo-vikas",
        name: "Vikas Mehta",
        type: "Buyer",
        stage: "visit",
        activity: "Visit booked for tomorrow",
        followUp: "Tomorrow, 12:00 PM",
    },
    {
        id: "demo-anjali",
        name: "Anjali Verma",
        type: "Buyer",
        stage: "visit",
        activity: "Yesterday’s visit needs an outcome",
        followUp: "Record visit outcome",
        attention: {
            kind: "visit",
            title: "How did yesterday’s visit go?",
            detail: "Anjali Verma · Visit outcome not recorded",
        },
    },
    {
        id: "demo-gaurav",
        name: "Gaurav Sinha",
        type: "Investor",
        stage: "visit",
        activity: "Second visit booked for Friday",
        followUp: "Friday, 10:00 AM",
    },
    {
        id: "demo-meera",
        name: "Meera Bhatt",
        type: "Buyer",
        stage: "visit",
        activity: "Visit booked for Saturday",
        followUp: "Saturday, 11:30 AM",
    },
    {
        id: "demo-rohan",
        name: "Rohan Joshi",
        type: "Buyer",
        stage: "contacted",
        activity: "Spoke about the property 3 days ago",
        followUp: "2 days overdue",
        attention: {
            kind: "overdue",
            title: "Arrange a first visit",
            detail: "Rohan Joshi · Follow-up is 2 days overdue",
        },
    },
    {
        id: "demo-neha",
        name: "Neha Desai",
        type: "Buyer",
        stage: "contacted",
        activity: "Property details shared yesterday",
        followUp: "Tomorrow, 5:00 PM",
    },
    {
        id: "demo-arjun",
        name: "Arjun Rao",
        type: "Investor",
        stage: "contacted",
        activity: "Spoke about location today",
        followUp: "Friday, 2:00 PM",
    },
    {
        id: "demo-priya",
        name: "Priya Mehta",
        type: "Buyer",
        stage: "new",
        activity: "Attached to this property today",
        followUp: "Tomorrow, 11:00 AM",
    },
    {
        id: "demo-vivek",
        name: "Vivek Nair",
        type: "Investor",
        stage: "new",
        activity: "Attached to this property yesterday",
        followUp: "Tomorrow, 2:00 PM",
    },
    {
        id: "demo-kavya",
        name: "Kavya Iyer",
        type: "Buyer",
        stage: "new",
        activity: "Attached to this property yesterday",
        followUp: "Friday, 4:00 PM",
    },
    {
        id: "demo-amit",
        name: "Amit Trivedi",
        type: "Buyer",
        stage: "lost",
        activity: "Withdrew offer 4 days ago",
        followUp: "No follow-up",
        offer: 23_000_000,
        withdrawn: true,
    },
    {
        id: "demo-ishita",
        name: "Ishita Shah",
        type: "Buyer",
        stage: "lost",
        activity: "Chose another location 5 days ago",
        followUp: "No follow-up",
    },
];

export const DEMO_VISITS = {
    completed: 18,
    cancelled: 1,
    appointments: [
        { clientId: "demo-vikas", day: "Tomorrow", time: "12:00 PM", status: "Upcoming" },
        { clientId: "demo-gaurav", day: "Friday", time: "10:00 AM", status: "Upcoming" },
        { clientId: "demo-meera", day: "Saturday", time: "11:30 AM", status: "Upcoming" },
        { clientId: "demo-anjali", day: "Yesterday", time: "3:00 PM", status: "Needs outcome" },
        { clientId: "demo-ishita", day: "5 days ago", time: "11:00 AM", status: "Cancelled" },
    ],
};

export function getDemoClients(closed: boolean): DemoClient[] {
    if (!closed) return DEMO_CLIENTS;
    return DEMO_CLIENTS.map((client) => ({
        ...client,
        stage: client.id === "demo-karan" ? "closed" : "lost",
        activity:
            client.id === "demo-karan"
                ? "Deal closed today · Recorded by you"
                : client.stage === "lost"
                  ? client.activity
                  : "Property closed with another client",
        followUp: "No follow-up",
        attention: undefined,
    }));
}
