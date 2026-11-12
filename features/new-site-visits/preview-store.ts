import { z } from "zod";

import { dateAtIstOffset } from "@/lib/visits/time";

import { type SiteVisit, visitSchema } from "./model";

// Isolated design-preview adapter. No slot/showing API can save the private CRM
// lifecycle in this design yet. Never present browser-local changes as API saves.
// Illustrative records transcribed from the Penpot storyboard, never API records.
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
export type PreviewProperty = {
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
        locality: "Pal",
        city: "Surat",
        address: "Green Residency, Pal, Surat",
    },
];
const envelope = z.object({
    version: z.union([z.literal(2), z.literal(3)]),
    visits: z.array(visitSchema),
});

export function sampleVisits(now = Date.now()): SiteVisit[] {
    const base = (
        index: number,
        startsAt: string,
        endsAt: string,
        status: SiteVisit["status"] = "scheduled",
    ): SiteVisit => ({
        id: `preview-visit-${index}`,
        clientId: PREVIEW_CLIENTS[index % PREVIEW_CLIENTS.length].id,
        propertyId: PREVIEW_PROPERTIES[index % PREVIEW_PROPERTIES.length].id,
        startsAt,
        endsAt,
        status,
        reminders: [30],
        notes: "Meet at the main gate. Ask for parking access.",
        attendanceNote: "",
        history: [{ at: new Date(now - 86_400_000).toISOString(), label: "Visit scheduled" }],
    });
    return [
        base(0, dateAtIstOffset(1, 10), dateAtIstOffset(1, 11)),
        base(1, dateAtIstOffset(1, 14), dateAtIstOffset(1, 15)),
        base(2, dateAtIstOffset(2, 11), dateAtIstOffset(2, 12)),
        {
            ...base(8, dateAtIstOffset(3, 17), dateAtIstOffset(3, 17, 45)),
            clientId: PREVIEW_CLIENTS[3].id,
            propertyId: PREVIEW_PROPERTIES[3].id,
        },
        base(
            3,
            new Date(now - 15 * 60_000).toISOString(),
            new Date(now + 30 * 60_000).toISOString(),
        ),
        base(
            4,
            new Date(now - 120 * 60_000).toISOString(),
            new Date(now - 60 * 60_000).toISOString(),
        ),
        base(5, dateAtIstOffset(-1, 10), dateAtIstOffset(-1, 11), "completed"),
        base(6, dateAtIstOffset(-2, 14), dateAtIstOffset(-2, 15), "not_attended"),
        base(7, dateAtIstOffset(-1, 16), dateAtIstOffset(-1, 17), "cancelled"),
    ];
}

const keyFor = (accountId: string) => `crm.site-visits.penpot-preview.v2.${accountId}`;

export const visitPreviewStore = {
    async list(accountId: string): Promise<SiteVisit[]> {
        const saved = sessionStorage.getItem(keyFor(accountId));
        if (saved === null) {
            const visits = sampleVisits();
            sessionStorage.setItem(keyFor(accountId), JSON.stringify({ version: 3, visits }));
            return visits;
        }
        let decoded: unknown;
        try {
            decoded = JSON.parse(saved);
        } catch {
            throw new Error(
                "This preview could not be loaded. Reset the sample visits to start again.",
            );
        }
        const parsed = envelope.safeParse(decoded);
        if (
            !parsed.success ||
            !parsed.data.visits.every(
                (v) =>
                    PREVIEW_CLIENTS.some((c) => c.id === v.clientId) &&
                    PREVIEW_PROPERTIES.some((p) => p.id === v.propertyId),
            )
        )
            throw new Error(
                "This preview could not be loaded. Reset the sample visits to start again.",
            );
        if (parsed.data.version === 2)
            sessionStorage.setItem(
                keyFor(accountId),
                JSON.stringify({ version: 3, visits: parsed.data.visits }),
            );
        return parsed.data.visits;
    },
    async save(accountId: string, visits: SiteVisit[]): Promise<SiteVisit[]> {
        const checked = envelope.parse({ version: 3, visits });
        if (
            !checked.visits.every(
                (v) =>
                    PREVIEW_CLIENTS.some((c) => c.id === v.clientId) &&
                    PREVIEW_PROPERTIES.some((p) => p.id === v.propertyId),
            )
        )
            throw new Error("Choose an existing client and property.");
        sessionStorage.setItem(keyFor(accountId), JSON.stringify(checked));
        return checked.visits;
    },
};
