/**
 * Static sample deals for the earnings page.
 *
 * Shown only when the broker has no deals yet, behind a clear "Sample data"
 * banner, so the page can be reviewed before real deals exist. Turn off with
 * `SHOW_SAMPLE_EARNINGS_WHEN_EMPTY` once real data is flowing.
 *
 * Dates are relative to "now" so every period preset has something in it.
 * Values are deterministic (seeded), so the page looks the same on reload.
 */
import type { DealItem, DealLostReason, DealStage, DealStatus } from "@/features/pipeline/types";

export const SHOW_SAMPLE_EARNINGS_WHEN_EMPTY = true;

const DAY_MS = 86_400_000;

/** Tiny seeded PRNG (mulberry32) — same output every load. */
function seeded(seed: number) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const BUYERS = [
    "Ravi Mehta",
    "Priya Shah",
    "Amit Desai",
    "Neha Patel",
    "Karan Joshi",
    "Sneha Iyer",
    "Rohit Verma",
    "Anjali Nair",
    "Vikram Rao",
    "Pooja Gupta",
    "Arjun Reddy",
    "Kavya Menon",
];

const OWNERS = [
    "Suresh Kapoor",
    "Meena Agarwal",
    "Rajesh Bhatt",
    "Lata Kulkarni",
    "Harish Trivedi",
];

const LOCALITIES = [
    ["Adajan", "Surat"],
    ["Vesu", "Surat"],
    ["Andheri West", "Mumbai"],
    ["Baner", "Pune"],
    ["Whitefield", "Bengaluru"],
    ["Satellite", "Ahmedabad"],
    ["Gachibowli", "Hyderabad"],
] as const;

type Listing = {
    configLabel: string;
    bhk: number;
    typeLabel: string;
    isRent: boolean;
    minInr: number;
    maxInr: number;
};

const LISTINGS: Listing[] = [
    {
        configLabel: "2 BHK",
        bhk: 2,
        typeLabel: "Apartment",
        isRent: false,
        minInr: 45_00_000,
        maxInr: 85_00_000,
    },
    {
        configLabel: "3 BHK",
        bhk: 3,
        typeLabel: "Apartment",
        isRent: false,
        minInr: 80_00_000,
        maxInr: 1_80_00_000,
    },
    {
        configLabel: "4 BHK",
        bhk: 4,
        typeLabel: "Villa",
        isRent: false,
        minInr: 1_50_00_000,
        maxInr: 3_50_00_000,
    },
    {
        configLabel: "Shop",
        bhk: 0,
        typeLabel: "Shop",
        isRent: false,
        minInr: 30_00_000,
        maxInr: 90_00_000,
    },
    {
        configLabel: "Plot",
        bhk: 0,
        typeLabel: "Plot",
        isRent: false,
        minInr: 25_00_000,
        maxInr: 1_20_00_000,
    },
    {
        configLabel: "1 BHK",
        bhk: 1,
        typeLabel: "Apartment",
        isRent: true,
        minInr: 12_000,
        maxInr: 22_000,
    },
    {
        configLabel: "2 BHK",
        bhk: 2,
        typeLabel: "Apartment",
        isRent: true,
        minInr: 18_000,
        maxInr: 45_000,
    },
    {
        configLabel: "Office",
        bhk: 0,
        typeLabel: "Office",
        isRent: true,
        minInr: 40_000,
        maxInr: 1_20_000,
    },
];

const LOST_REASONS: Array<DealLostReason | undefined> = [
    "price",
    "price",
    "bought_elsewhere",
    "not_responding",
    "not_responding",
    "changed_mind",
    undefined,
];

const LIVE_STAGES: DealStage[] = [
    "new",
    "new",
    "contacted",
    "contacted",
    "visit",
    "visit",
    "negotiation",
];

function roundTo(value: number, step: number) {
    return Math.round(value / step) * step;
}

function iso(now: number, daysAgo: number) {
    return new Date(now - daysAgo * DAY_MS).toISOString();
}

export function buildSampleEarningsDeals(now = new Date()): DealItem[] {
    const rand = seeded(20261117);
    const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
    const nowMs = now.getTime();
    const deals: DealItem[] = [];

    function makeDeal(index: number, status: DealStatus, resolvedDaysAgo: number | null): DealItem {
        const listing = pick(LISTINGS);
        const [locality, city] = pick(LOCALITIES);
        const amountInr = roundTo(
            listing.minInr + rand() * (listing.maxInr - listing.minInr),
            listing.isRent ? 500 : 50_000,
        );
        // Most owners set a commission; a few leave it blank (realistic gap).
        const hasCommission = rand() > 0.1;
        const commissionPercent = listing.isRent ? 0 : hasCommission ? pick([1, 1.5, 2, 2]) : 0;
        const commissionAmountInr = listing.isRent && hasCommission ? amountInr : 0;
        const createdDaysAgo = (resolvedDaysAgo ?? 0) + 10 + Math.floor(rand() * 50);
        const isSold = status === "closed";
        const closedAmountInr =
            isSold && !listing.isRent && rand() > 0.4
                ? roundTo(amountInr * (0.93 + rand() * 0.06), 50_000)
                : null;
        const hasOffer = status === "negotiation" && rand() > 0.3;

        return {
            id: `sample-${index}`,
            status,
            buyer: {
                id: `sample-buyer-${index}`,
                name: pick(BUYERS),
                phoneDigits: "",
                budgetMaxInr: null,
            },
            property: {
                id: `sample-property-${index}`,
                title: `${listing.configLabel} ${listing.typeLabel === "Apartment" ? "Apartment" : ""} in ${locality}`
                    .replace(/\s+/g, " ")
                    .trim(),
                configLabel: listing.configLabel,
                propertyTypeLabel: listing.typeLabel,
                locality,
                city,
                areaSqft: 600 + Math.floor(rand() * 2400),
                bhk: listing.bhk,
                amountInr,
                isRent: listing.isRent,
                commissionPercent,
                commissionAmountInr,
                imageSrc: "",
            },
            owner: { name: pick(OWNERS), isRepresentationActive: true, origin: "platform" },
            stageEnteredAt: iso(nowMs, resolvedDaysAgo ?? Math.floor(rand() * 25)),
            lastContactedAt:
                status === "closed" || status === "lost"
                    ? null
                    : iso(nowMs, Math.floor(rand() * 24)),
            nextVisitAt: null,
            note: "",
            lostReason: status === "lost" ? pick(LOST_REASONS) : undefined,
            lostFromStage:
                status === "lost"
                    ? pick(["contacted", "visit", "visit", "negotiation"] as const)
                    : undefined,
            resolvedAt: resolvedDaysAgo == null ? null : iso(nowMs, resolvedDaysAgo),
            closedAmountInr,
            offerAmountInr: hasOffer
                ? roundTo(amountInr * 0.95, listing.isRent ? 500 : 50_000)
                : null,
            offerStatus: hasOffer ? pick(["pending", "accepted", "accepted"] as const) : null,
            createdAt: iso(nowMs, createdDaysAgo),
        };
    }

    let index = 0;
    // ~16 months of history: 1–4 sold and 0–2 lost per month, busier lately.
    for (let month = 0; month < 16; month += 1) {
        const busy = month < 6 ? 1 : 0;
        const sold = 1 + Math.floor(rand() * 3) + busy;
        const lost = Math.floor(rand() * 2) + (month % 3 === 0 ? 1 : 0);
        for (let i = 0; i < sold; i += 1) {
            const daysAgo = month * 30 + Math.floor(rand() * 28) + (month === 0 ? 0 : 1);
            deals.push(
                makeDeal(
                    index++,
                    "closed",
                    Math.min(daysAgo, month === 0 ? now.getDate() - 1 : daysAgo),
                ),
            );
        }
        for (let i = 0; i < lost; i += 1) {
            const daysAgo = month * 30 + Math.floor(rand() * 28);
            deals.push(
                makeDeal(
                    index++,
                    "lost",
                    Math.min(daysAgo, month === 0 ? now.getDate() - 1 : daysAgo),
                ),
            );
        }
    }

    // Live pipeline right now.
    for (let i = 0; i < 18; i += 1) {
        deals.push(makeDeal(index++, pick(LIVE_STAGES), null));
    }

    return deals;
}

/** Sample rows have no real deal page to open. */
export function isSampleDeal(dealId: string): boolean {
    return dealId.startsWith("sample-");
}
