import type { PropertyFilterRecord } from "@/lib/properties/list-criteria";

// Sample clients and properties for the Tasks design preview only. Visits now
// read real data from the slots API and no longer use these records.
export const PREVIEW_CLIENTS = [
    {
        id: "preview-aarav",
        name: "Aarav Shah",
        type: "Buyer",
        requirement: "3 BHK in Vesu",
        phoneDigits: "",
    },
    {
        id: "preview-mehul",
        name: "Mehul Patel",
        type: "Investor",
        requirement: "Commercial property",
        phoneDigits: "",
    },
    {
        id: "preview-priya",
        name: "Priya Desai",
        type: "Buyer",
        requirement: "2 BHK in Adajan",
        phoneDigits: "",
    },
    {
        id: "preview-nisha",
        name: "Nisha Mehta",
        type: "Tenant",
        requirement: "3 BHK in Pal",
        phoneDigits: "",
    },
];
export type PreviewProperty = PropertyFilterRecord & {
    id: string;
    title: string;
    configLabel: string;
    locality: string;
    city: string;
    address: string;
    imageUrl?: string;
    imageUrls?: string[];
    owner?: { name: string; imageUrl?: string };
};

export const PREVIEW_PROPERTIES: PreviewProperty[] = [
    {
        id: "preview-happy",
        imageUrl: "/properties/1.jpg",
        imageUrls: ["/properties/1.jpg", "/properties/5.jpg", "/properties/6.jpg"],
        title: "Happy Elegance",
        configLabel: "3 BHK apartment",
        category: "residential",
        subtype: "apartment",
        bhk: 3,
        locality: "Vesu",
        city: "Surat",
        address: "Main gate, Happy Elegance, VIP Road, Vesu",
    },
    {
        id: "preview-ibc",
        imageUrl: "/properties/2.jpg",
        imageUrls: ["/properties/2.jpg", "/properties/5.jpg", "/properties/6.jpg"],
        title: "International Business Center",
        configLabel: "Office",
        category: "commercial",
        subtype: "office_space",
        locality: "Piplod",
        city: "Surat",
        address: "International Business Center, Piplod, Surat",
    },
    {
        id: "preview-orchid",
        imageUrl: "/properties/3.jpg",
        imageUrls: ["/properties/3.jpg", "/properties/5.jpg", "/properties/6.jpg"],
        title: "Orchid Homes",
        configLabel: "2 BHK apartment",
        category: "residential",
        subtype: "apartment",
        bhk: 2,
        locality: "Adajan",
        city: "Surat",
        address: "Orchid Homes, Adajan, Surat",
    },
    {
        id: "preview-green",
        imageUrl: "/properties/4.jpg",
        imageUrls: ["/properties/4.jpg", "/properties/5.jpg", "/properties/6.jpg"],
        title: "Green Residency",
        configLabel: "3 BHK apartment",
        category: "residential",
        subtype: "apartment",
        bhk: 3,
        locality: "Pal",
        city: "Surat",
        address: "Green Residency, Pal, Surat",
    },
];
