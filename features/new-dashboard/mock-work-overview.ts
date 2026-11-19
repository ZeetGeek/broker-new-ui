import { PIPELINE_STAGES } from "@/config/constants";

const COUNTS = [10, 7, 4, 3];
const COLORS = ["bg-stage-1", "bg-stage-2", "bg-stage-3", "bg-stage-4"];
export const MOCK_PIPELINE = PIPELINE_STAGES.slice(0, 4).map((stage, index) => ({
    ...stage,
    count: COUNTS[index],
    color: COLORS[index],
}));

export type PreviewVisitPhase = "upcoming" | "running" | "needs_update";

export type PreviewVisit = {
    id: string;
    time: string;
    end: string;
    client: string;
    property: string;
    location: string;
    phase: PreviewVisitPhase;
    outcome?: "attended" | "notAttended";
    /** Preview only: minutes until an upcoming visit starts. */
    startsInMinutes?: number;
    coverImage: string;
    owner: string;
    amountInr: number;
    isRent: boolean;
    commissionPercent?: number | null;
    commissionAmountInr?: number | null;
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
        phase: "needs_update",
        amountInr: 1_25_00_000,
        isRent: false,
        commissionPercent: 1.5,
    },
    {
        id: "visit-4",
        coverImage: "/properties/4.jpg",
        owner: "Jignesh Mehta",
        time: "10:00 AM",
        end: "10:45 AM",
        client: "Riya Joshi",
        property: "4 BHK · Palm Residency",
        location: "Pal, Surat",
        phase: "needs_update",
        amountInr: 2_10_00_000,
        isRent: false,
        commissionPercent: 2,
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
        phase: "running",
        amountInr: 28_000,
        isRent: true,
        commissionAmountInr: 14_000,
    },
    {
        id: "visit-5",
        startsInMinutes: 60,
        coverImage: "/properties/1.jpg",
        owner: "Bhavna Shah",
        time: "12:30 PM",
        end: "1:15 PM",
        client: "Rahul Mehta",
        property: "3 BHK · Green Meadows",
        location: "Althan, Surat",
        phase: "upcoming",
        amountInr: 95_00_000,
        isRent: false,
        commissionPercent: 1,
    },
    {
        id: "visit-6",
        startsInMinutes: 150,
        coverImage: "/properties/2.jpg",
        owner: "Sanjay Patel",
        time: "2:00 PM",
        end: "2:45 PM",
        client: "Ananya Shah",
        property: "2 BHK · River View Apartments",
        location: "Jahangirpura, Surat",
        phase: "upcoming",
        amountInr: 22_000,
        isRent: true,
        commissionAmountInr: null,
    },
    {
        id: "visit-3",
        startsInMinutes: 240,
        coverImage: "/properties/3.jpg",
        owner: "Kiran Desai",
        time: "3:30 PM",
        end: "4:15 PM",
        client: "Mehul Patel",
        property: "Office · Business Centre",
        location: "Piplod, Surat",
        phase: "upcoming",
        amountInr: 1_85_00_000,
        isRent: false,
        commissionPercent: 2,
    },
    {
        id: "visit-7",
        startsInMinutes: 330,
        coverImage: "/properties/3.jpg",
        owner: "Pooja Desai",
        time: "5:00 PM",
        end: "5:45 PM",
        client: "Dev Shah",
        property: "Villa · Shantivan Bungalows",
        location: "Dumas, Surat",
        phase: "upcoming",
        amountInr: 3_40_00_000,
        isRent: false,
        commissionPercent: 1.25,
    },
    {
        id: "visit-8",
        startsInMinutes: 390,
        coverImage: "/properties/4.jpg",
        owner: "Manish Joshi",
        time: "6:00 PM",
        end: "6:45 PM",
        client: "Neha Patel",
        property: "Shop · High Street Plaza",
        location: "City Light, Surat",
        phase: "upcoming",
        amountInr: 75_00_000,
        isRent: false,
        commissionPercent: null,
    },
];
