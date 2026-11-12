import { PIPELINE_STAGES } from "@/config/constants";

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
