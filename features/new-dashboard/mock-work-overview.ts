import { PIPELINE_STAGES } from "@/config/constants";

export type TaskAttachment = {
    id: string;
    kind: "client" | "owner" | "property";
    name: string;
    imageUrl?: string;
};

const RAHUL: TaskAttachment = { id: "client-rahul", kind: "client", name: "Rahul Mehta" };
const PRIYA: TaskAttachment = { id: "client-priya", kind: "client", name: "Priya Desai" };
const OWNER: TaskAttachment = { id: "owner-harsh", kind: "owner", name: "Harsh Shah" };
const PROPERTIES: TaskAttachment[] = [
    { id: "property-1", kind: "property", name: "3 BHK, Vesu", imageUrl: "/properties/1.jpg" },
    {
        id: "property-2",
        kind: "property",
        name: "2 BHK, Orchid Homes",
        imageUrl: "/properties/2.jpg",
    },
    { id: "property-3", kind: "property", name: "2 BHK, Adajan", imageUrl: "/properties/3.jpg" },
    { id: "property-4", kind: "property", name: "3 BHK, Pal", imageUrl: "/properties/4.jpg" },
];

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type PreviewTask = {
    id: string;
    title: string;
    attachments: TaskAttachment[];
    due: string;
    dueTime: string;
    reminders: string[];
    group: "overdue" | "today" | "later";
    completed: boolean;
    priority: TaskPriority;
};

export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
};

export const MOCK_TASKS: PreviewTask[] = [
    {
        id: "task-1",
        title: "Call Rahul about Vesu options",
        attachments: [RAHUL, PROPERTIES[0]],
        due: "Yesterday",
        dueTime: "9:00 AM",
        reminders: ["At due time"],
        group: "overdue",
        completed: false,
        priority: "high",
    },
    {
        id: "task-2",
        title: "Collect signed owner consent",
        attachments: [OWNER, PROPERTIES[0]],
        due: "2 days ago",
        dueTime: "10:00 AM",
        reminders: ["Reminder sent"],
        group: "overdue",
        completed: false,
        priority: "urgent",
    },
    {
        id: "task-3",
        title: "Confirm visit with Priya Desai",
        attachments: [PRIYA, PROPERTIES[1]],
        due: "Today",
        dueTime: "10:30 AM",
        reminders: ["15 min before", "1 hour before", "1 day before"],
        group: "today",
        completed: false,
        priority: "urgent",
    },
    {
        id: "task-4",
        title: "Send Vesu shortlist to Rahul",
        attachments: [RAHUL, ...PROPERTIES],
        due: "Today",
        dueTime: "12:00 PM",
        reminders: ["At due time"],
        group: "today",
        completed: false,
        priority: "high",
    },
    {
        id: "task-5",
        title: "Review Adajan listing details",
        attachments: [PROPERTIES[2]],
        due: "Today",
        dueTime: "Any time",
        reminders: [],
        group: "today",
        completed: false,
        priority: "low",
    },
    {
        id: "task-8",
        title: "Share Orchid Homes documents with Priya",
        attachments: [PRIYA, PROPERTIES[1]],
        due: "Today",
        dueTime: "2:00 PM",
        reminders: [],
        group: "today",
        completed: false,
        priority: "medium",
    },
    {
        id: "task-9",
        title: "Confirm commission for the Pal listing",
        attachments: [OWNER, PROPERTIES[3]],
        due: "Today",
        dueTime: "4:00 PM",
        reminders: [],
        group: "today",
        completed: false,
        priority: "urgent",
    },
    {
        id: "task-10",
        title: "Call Mehul about the office visit",
        attachments: [{ id: "client-mehul", kind: "client", name: "Mehul Patel" }],
        due: "Today",
        dueTime: "5:30 PM",
        reminders: [],
        group: "today",
        completed: false,
        priority: "medium",
    },
    {
        id: "task-6",
        title: "Follow up on the office shortlist",
        attachments: [{ id: "client-mehul", kind: "client", name: "Mehul Patel" }],
        due: "Tomorrow",
        dueTime: "11:00 AM",
        reminders: ["At due time"],
        group: "later",
        completed: false,
        priority: "medium",
    },
    {
        id: "task-7",
        title: "Check new listing photographs",
        attachments: [PROPERTIES[3]],
        due: "Tomorrow",
        dueTime: "Any time",
        reminders: [],
        group: "later",
        completed: false,
        priority: "low",
    },
];

const COUNTS = [10, 7, 4, 3];
const COLORS = ["bg-stage-1", "bg-stage-2", "bg-stage-3", "bg-stage-4"];
export const MOCK_PIPELINE = PIPELINE_STAGES.slice(0, 4).map((stage, index) => ({
    ...stage,
    count: COUNTS[index],
    color: COLORS[index],
}));

export type PreviewVisit = {
    id: string;
    time: string;
    end: string;
    client: string;
    property: string;
    location: string;
    needsUpdate: boolean;
    outcome?: "attended" | "notAttended";
    coverImage: string;
    owner: string;
};

export const MOCK_VISITS: PreviewVisit[] = [
    {
        id: "visit-1",
        coverImage: "/properties/1.jpg",
        owner: "Harsh Shah",
        time: "9:00 AM",
        end: "9:45 AM",
        client: "Aarav Shah",
        property: "3 BHK · Happy Elegance",
        location: "Vesu, Surat",
        needsUpdate: true,
    },
    {
        id: "visit-4",
        coverImage: "/properties/4.jpg",
        owner: "Jignesh Mehta",
        time: "10:00 AM",
        end: "10:45 AM",
        client: "Riya Joshi",
        property: "4 BHK � Palm Residency",
        location: "Pal, Surat",
        needsUpdate: true,
    },
    {
        id: "visit-2",
        coverImage: "/properties/2.jpg",
        owner: "Nisha Patel",
        time: "11:00 AM",
        end: "11:45 AM",
        client: "Priya Desai",
        property: "2 BHK · Orchid Homes",
        location: "Adajan, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-5",
        coverImage: "/properties/1.jpg",
        owner: "Bhavna Shah",
        time: "12:30 PM",
        end: "1:15 PM",
        client: "Rahul Mehta",
        property: "3 BHK � Green Meadows",
        location: "Althan, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-6",
        coverImage: "/properties/2.jpg",
        owner: "Sanjay Patel",
        time: "2:00 PM",
        end: "2:45 PM",
        client: "Ananya Shah",
        property: "2 BHK � River View Apartments",
        location: "Jahangirpura, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-3",
        coverImage: "/properties/3.jpg",
        owner: "Kiran Desai",
        time: "3:30 PM",
        end: "4:15 PM",
        client: "Mehul Patel",
        property: "Office · Business Centre",
        location: "Piplod, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-7",
        coverImage: "/properties/3.jpg",
        owner: "Pooja Desai",
        time: "5:00 PM",
        end: "5:45 PM",
        client: "Dev Shah",
        property: "Villa � Shantivan Bungalows",
        location: "Dumas, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-8",
        coverImage: "/properties/4.jpg",
        owner: "Manish Joshi",
        time: "6:00 PM",
        end: "6:45 PM",
        client: "Neha Patel",
        property: "Shop � High Street Plaza",
        location: "City Light, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-9",
        coverImage: "/properties/1.jpg",
        owner: "Kavita Shah",
        time: "7:00 AM",
        end: "7:30 AM",
        client: "Ishaan Mehta",
        property: "3 BHK � Sunrise Heights",
        location: "Vesu, Surat",
        needsUpdate: false,
        outcome: "attended",
    },
    {
        id: "visit-10",
        coverImage: "/properties/2.jpg",
        owner: "Rajesh Patel",
        time: "8:00 AM",
        end: "8:30 AM",
        client: "Sneha Desai",
        property: "2 BHK � Lakeview Residency",
        location: "Pal, Surat",
        needsUpdate: false,
        outcome: "attended",
    },
    {
        id: "visit-11",
        coverImage: "/properties/3.jpg",
        owner: "Alpa Mehta",
        time: "7:30 AM",
        end: "8:00 AM",
        client: "Kunal Shah",
        property: "Villa � Garden Enclave",
        location: "Dumas, Surat",
        needsUpdate: false,
        outcome: "notAttended",
    },
    {
        id: "visit-12",
        coverImage: "/properties/4.jpg",
        owner: "Vivek Joshi",
        time: "8:30 AM",
        end: "9:00 AM",
        client: "Pooja Patel",
        property: "Office � Trade Square",
        location: "Piplod, Surat",
        needsUpdate: false,
        outcome: "notAttended",
    },
];
