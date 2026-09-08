import type { VisitBroker, VisitEvent, VisitItem } from "@/features/site-visits/types";

const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

/** Today at a given wall-clock time, offset by whole days. */
function at(dayOffset: number, hour: number, minute = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
}

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function daysAgo(days: number): string {
    return new Date(Date.now() - days * DAY_MS).toISOString();
}

/**
 * Properties, owners and buyers are copied from `features/pipeline/mock-deals.ts`
 * on purpose — a visit exists because a representation was approved, so the
 * two fixture sets have to agree about who owns what and who is buying.
 */
const PROPERTIES = {
    vesu3bhk: {
        id: "pr_108",
        title: "3 BHK Apartment in Vesu",
        configLabel: "3 BHK",
        propertyTypeLabel: "Apartment",
        locality: "Vesu",
        city: "Surat",
        areaSqft: 1_680,
        bhk: 3,
        amountInr: 1_15_00_000,
        isRent: false,
        imageSrc: "/properties/1.jpg",
    },
    palFlat: {
        id: "pr_099",
        title: "1 BHK Apartment in Pal",
        configLabel: "1 BHK",
        propertyTypeLabel: "Apartment",
        locality: "Pal",
        city: "Surat",
        areaSqft: 620,
        bhk: 1,
        amountInr: 42_00_000,
        isRent: false,
        imageSrc: "/properties/2.jpg",
    },
    piplodRent: {
        id: "pr_088",
        title: "2 BHK Apartment in Piplod",
        configLabel: "2 BHK",
        propertyTypeLabel: "Apartment",
        locality: "Piplod",
        city: "Surat",
        areaSqft: 1_100,
        bhk: 2,
        amountInr: 28_000,
        isRent: true,
        imageSrc: "/properties/3.jpg",
    },
    adajanRent: {
        id: "pr_121",
        title: "2 BHK Apartment in Adajan",
        configLabel: "2 BHK",
        propertyTypeLabel: "Apartment",
        locality: "Adajan",
        city: "Surat",
        areaSqft: 980,
        bhk: 2,
        amountInr: 22_000,
        isRent: true,
        imageSrc: "/properties/4.jpg",
    },
    vesuVilla: {
        id: "pr_130",
        title: "4 BHK Villa in Vesu",
        configLabel: "4 BHK",
        propertyTypeLabel: "Villa",
        locality: "Vesu",
        city: "Surat",
        areaSqft: 3_200,
        bhk: 4,
        amountInr: 1_85_00_000,
        isRent: false,
        imageSrc: "/properties/5.jpg",
    },
} as const;

const OWNERS = {
    rakesh: {
        id: "ow_001",
        name: "Rakesh Mehta",
        phoneDigits: "9825044556",
        isRepresentationActive: true,
    },
    sunita: {
        id: "ow_002",
        name: "Sunita Desai",
        phoneDigits: "9898033221",
        isRepresentationActive: true,
    },
    imran: {
        id: "ow_003",
        name: "Imran Shaikh",
        phoneDigits: "9727011990",
        isRepresentationActive: true,
    },
    bhavesh: {
        id: "ow_004",
        name: "Bhavesh Patel",
        phoneDigits: "9016022114",
        isRepresentationActive: true,
    },
    /** Representation lapsed — name stays, the phone number goes. */
    nilesh: { id: "ow_005", name: "Nilesh Trivedi", isRepresentationActive: false },
} as const;

const BUYERS = {
    ankit: { id: "cl_001", name: "Ankit Shah", phoneDigits: "9825011223" },
    priya: { id: "cl_002", name: "Priya Nair", phoneDigits: "9898044556" },
    mohit: { id: "cl_003", name: "Mohit Agarwal", phoneDigits: "9727066778" },
    sneha: { id: "cl_004", name: "Sneha Bhatt", phoneDigits: "9016077889" },
    rajesh: { id: "cl_005", name: "Rajesh Kumar", phoneDigits: "9825099001" },
    farida: { id: "cl_006", name: "Farida Contractor", phoneDigits: "9898122334" },
    deepak: { id: "cl_007", name: "Deepak Solanki", phoneDigits: "9727144556" },
} as const;

/** The signed-in broker, from the owner portal's point of view. */
const BROKER: VisitBroker = {
    id: "bk_001",
    name: "Jignesh Panchal",
    phoneDigits: "9825177889",
    agencyName: "Panchal Realty",
    isVerified: true,
};

/** A second broker, so the owner portal shows more than one relationship. */
const BROKER_TWO: VisitBroker = {
    id: "bk_002",
    name: "Meera Joshi",
    phoneDigits: "9898266778",
    isVerified: false,
};

function history(entries: Array<Omit<VisitEvent, "id">>): VisitEvent[] {
    return entries.map((entry, index) => ({ ...entry, id: `ev_${index + 1}` }));
}

/**
 * Fixture set for the visits screen. Deliberately covers every state the UI
 * has to render honestly rather than a tidy happy path:
 *
 * - a visit starting within the hour (the "leave now" case)
 * - two visits stacked in the same hour (column packing)
 * - back-to-back visits across localities (the travel warning)
 * - a proposal waiting on the owner, and one waiting on the broker
 * - a completed visit with no outcome recorded (the pipeline killer)
 * - a lapsed representation, so the owner phone number is gone
 * - a declined proposal that carries alternative slots
 */
export const MOCK_VISITS: VisitItem[] = [
    {
        id: "vs_001",
        status: "confirmed",
        scheduledAt: at(0, new Date().getHours() + 1, 0),
        durationMin: 45,
        property: PROPERTIES.vesu3bhk,
        owner: OWNERS.rakesh,
        broker: BROKER,
        buyer: BUYERS.ankit,
        dealId: "dl_002",
        proposedBy: "broker",
        meetingNote: "Meet at the society gate. Tell the guard flat B-704.",
        brokerNote: "Ankit is comparing this against the villa. Lead with the balcony.",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
        alternativeSlots: [],
        history: history([
            {
                at: daysAgo(2),
                actor: "broker",
                kind: "proposed",
                label: "Asked the owner for this time",
            },
            { at: daysAgo(1), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
        ]),
    },
    // Same hour as vs_001 on purpose — the day grid has to pack these into
    // two columns rather than stack them on top of each other.
    {
        id: "vs_002",
        status: "confirmed",
        scheduledAt: at(0, new Date().getHours() + 1, 30),
        durationMin: 30,
        property: PROPERTIES.palFlat,
        owner: OWNERS.sunita,
        broker: BROKER,
        buyer: BUYERS.mohit,
        dealId: "dl_004",
        proposedBy: "owner",
        meetingNote: "Owner will be there with the keys.",
        brokerNote: "",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
        alternativeSlots: [],
        history: history([
            {
                at: daysAgo(3),
                actor: "owner",
                kind: "proposed",
                label: "Owner offered this time",
            },
            { at: daysAgo(2), actor: "broker", kind: "confirmed", label: "You confirmed" },
        ]),
    },
    // Waiting on the owner. This is what the broker sees as "sent, no reply".
    {
        id: "vs_003",
        status: "proposed",
        scheduledAt: at(1, 11, 0),
        durationMin: 45,
        property: PROPERTIES.vesuVilla,
        owner: OWNERS.nilesh,
        broker: BROKER,
        buyer: BUYERS.rajesh,
        dealId: "dl_009",
        proposedBy: "broker",
        meetingNote: "Buyer is driving from Bharuch, so a firm time helps.",
        brokerNote: "Rajesh has the budget. Worth chasing the owner on this.",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(30),
        alternativeSlots: [at(1, 16, 0), at(2, 11, 0)],
        history: history([
            {
                at: hoursAgo(30),
                actor: "broker",
                kind: "proposed",
                label: "Asked the owner for this time",
            },
        ]),
    },
    // Waiting on the broker — the owner proposed. Mirror case of vs_003.
    {
        id: "vs_004",
        status: "proposed",
        scheduledAt: at(1, 17, 30),
        durationMin: 30,
        property: PROPERTIES.piplodRent,
        owner: OWNERS.imran,
        broker: BROKER,
        buyer: BUYERS.sneha,
        dealId: "dl_006",
        proposedBy: "owner",
        meetingNote: "After office hours suits me better.",
        brokerNote: "",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: hoursAgo(5),
        updatedAt: hoursAgo(5),
        alternativeSlots: [at(2, 18, 0)],
        history: history([
            { at: hoursAgo(5), actor: "owner", kind: "proposed", label: "Owner offered this time" },
        ]),
    },
    // Back-to-back with vs_006 across two localities — trips the travel warning.
    {
        id: "vs_005",
        status: "confirmed",
        scheduledAt: at(2, 10, 0),
        durationMin: 45,
        property: PROPERTIES.adajanRent,
        owner: OWNERS.bhavesh,
        broker: BROKER,
        buyer: BUYERS.deepak,
        dealId: "dl_007",
        proposedBy: "broker",
        meetingNote: "",
        brokerNote: "",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(3),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(4), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(3), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
        ]),
    },
    {
        id: "vs_006",
        status: "confirmed",
        scheduledAt: at(2, 11, 0),
        durationMin: 45,
        property: PROPERTIES.vesu3bhk,
        owner: OWNERS.rakesh,
        broker: BROKER,
        buyer: BUYERS.priya,
        dealId: "dl_003",
        proposedBy: "broker",
        meetingNote: "Second viewing. Priya is bringing her father.",
        brokerNote: "Close to an offer. Do not rush her.",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(3),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(4), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(3), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
        ]),
    },
    // Happened, verdict recorded. The good case.
    {
        id: "vs_007",
        status: "completed",
        scheduledAt: at(-2, 16, 0),
        durationMin: 45,
        property: PROPERTIES.vesuVilla,
        owner: OWNERS.nilesh,
        broker: BROKER,
        buyer: BUYERS.ankit,
        dealId: "dl_001",
        proposedBy: "broker",
        meetingNote: "",
        brokerNote: "Loved the terrace. Price is the only sticking point.",
        outcome: "made_offer",
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(2),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(6), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(5), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
            { at: daysAgo(2), actor: "broker", kind: "completed", label: "You marked it done" },
        ]),
    },
    // Happened three days ago and still has no verdict. The quiet pipeline
    // killer the summary counts and the dark card chases.
    {
        id: "vs_008",
        status: "completed",
        scheduledAt: at(-3, 12, 0),
        durationMin: 30,
        property: PROPERTIES.palFlat,
        owner: OWNERS.sunita,
        broker: BROKER,
        buyer: BUYERS.farida,
        dealId: "dl_005",
        proposedBy: "broker",
        meetingNote: "",
        brokerNote: "",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(3),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(7), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(6), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
            { at: daysAgo(3), actor: "broker", kind: "completed", label: "You marked it done" },
        ]),
    },
    {
        id: "vs_009",
        status: "cancelled",
        scheduledAt: at(-1, 15, 0),
        durationMin: 45,
        property: PROPERTIES.piplodRent,
        owner: OWNERS.imran,
        broker: BROKER,
        buyer: BUYERS.sneha,
        dealId: "dl_006",
        meetingNote: "",
        brokerNote: "",
        proposedBy: "broker",
        outcome: null,
        cancelReason: "buyer_unavailable",
        cancelledBy: "broker",
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(5), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(4), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
            {
                at: daysAgo(1),
                actor: "broker",
                kind: "cancelled",
                label: "You cancelled — the buyer could not make it",
            },
        ]),
    },
    // Owner said no but offered two other times. The proposal carries its own
    // negotiation because the product has no chat.
    {
        id: "vs_010",
        status: "declined",
        scheduledAt: at(-1, 9, 0),
        durationMin: 30,
        property: PROPERTIES.adajanRent,
        owner: OWNERS.bhavesh,
        broker: BROKER_TWO,
        buyer: BUYERS.deepak,
        dealId: null,
        proposedBy: "broker",
        meetingNote: "",
        brokerNote: "",
        outcome: null,
        cancelReason: "owner_unavailable",
        cancelledBy: "owner",
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
        alternativeSlots: [at(3, 10, 0), at(3, 17, 0)],
        history: history([
            {
                at: daysAgo(3),
                actor: "broker",
                kind: "proposed",
                label: "Broker asked for this time",
            },
            {
                at: daysAgo(2),
                actor: "owner",
                kind: "declined",
                label: "Owner could not do that time and offered two others",
            },
        ]),
    },
    {
        id: "vs_011",
        status: "confirmed",
        scheduledAt: at(4, 18, 0),
        durationMin: 60,
        property: PROPERTIES.vesuVilla,
        owner: OWNERS.nilesh,
        broker: BROKER,
        buyer: BUYERS.rajesh,
        dealId: "dl_009",
        proposedBy: "owner",
        meetingNote: "Evening light shows the garden best.",
        brokerNote: "",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(1),
        updatedAt: hoursAgo(20),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(1), actor: "owner", kind: "proposed", label: "Owner offered this time" },
            { at: hoursAgo(20), actor: "broker", kind: "confirmed", label: "You confirmed" },
        ]),
    },
    {
        id: "vs_012",
        status: "no_show",
        scheduledAt: at(-5, 11, 0),
        durationMin: 45,
        property: PROPERTIES.vesu3bhk,
        owner: OWNERS.rakesh,
        broker: BROKER,
        buyer: BUYERS.mohit,
        dealId: "dl_008",
        proposedBy: "broker",
        meetingNote: "",
        brokerNote: "Mohit stopped replying after this.",
        outcome: null,
        cancelReason: null,
        cancelledBy: null,
        createdAt: daysAgo(9),
        updatedAt: daysAgo(5),
        alternativeSlots: [],
        history: history([
            { at: daysAgo(9), actor: "broker", kind: "proposed", label: "You asked for this time" },
            { at: daysAgo(8), actor: "owner", kind: "confirmed", label: "Owner confirmed" },
            {
                at: daysAgo(5),
                actor: "broker",
                kind: "note",
                label: "You marked it as nobody turned up",
            },
        ]),
    },
];

export { BROKER as MOCK_BROKER, BUYERS as MOCK_BUYERS, PROPERTIES as MOCK_VISIT_PROPERTIES };
