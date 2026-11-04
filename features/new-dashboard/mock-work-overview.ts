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

export type PreviewTask = {
    id: string;
    title: string;
    attachments: TaskAttachment[];
    due: string;
    dueTime: string;
    reminders: string[];
    group: "overdue" | "today" | "later";
    completed: boolean;
    important?: boolean;
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
    },
    {
        id: "task-2",
        important: true,
        title: "Collect signed owner consent",
        attachments: [OWNER, PROPERTIES[0]],
        due: "2 days ago",
        dueTime: "10:00 AM",
        reminders: ["Reminder sent"],
        group: "overdue",
        completed: false,
    },
    {
        id: "task-3",
        important: true,
        title: "Confirm visit with Priya Desai",
        attachments: [PRIYA, PROPERTIES[1]],
        due: "Today",
        dueTime: "10:30 AM",
        reminders: ["15 min before", "1 hour before", "1 day before"],
        group: "today",
        completed: false,
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
};

export const MOCK_VISITS: PreviewVisit[] = [
    {
        id: "visit-1",
        time: "9:00 AM",
        end: "9:45 AM",
        client: "Aarav Shah",
        property: "3 BHK · Happy Elegance",
        location: "Vesu, Surat",
        needsUpdate: true,
    },
    {
        id: "visit-2",
        time: "11:00 AM",
        end: "11:45 AM",
        client: "Priya Desai",
        property: "2 BHK · Orchid Homes",
        location: "Adajan, Surat",
        needsUpdate: false,
    },
    {
        id: "visit-3",
        time: "3:30 PM",
        end: "4:15 PM",
        client: "Mehul Patel",
        property: "Office · Business Centre",
        location: "Piplod, Surat",
        needsUpdate: false,
    },
];
