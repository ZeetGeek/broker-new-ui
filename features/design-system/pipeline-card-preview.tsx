"use client";

import { DealCard, type DealCardHandlers } from "@/features/pipeline/deal-card";
import { DealCardRich } from "@/features/pipeline/deal-card-rich";
import type { DealItem, DealStatus } from "@/features/pipeline/types";

const NOOP_HANDLERS: DealCardHandlers = {
    onView: () => {},
    onAdvance: () => {},
    onLogContact: () => {},
    onClose: () => {},
    onLose: () => {},
    onReopen: () => {},
    onMakeOffer: () => {},
    onPin: () => {},
    onNote: () => {},
};

function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeDeal(id: string, status: DealStatus, overrides: Partial<DealItem> = {}): DealItem {
    const base: DealItem = {
        id,
        status,
        buyer: {
            id: `buyer-${id}`,
            name: "Vicky Shah",
            phoneDigits: "9876543210",
            budgetMaxInr: 6_000_000,
        },
        property: {
            id: `prop-${id}`,
            title: "2 BHK in Dindoli",
            configLabel: "2 BHK",
            propertyTypeLabel: "Apartment",
            locality: "Dindoli",
            city: "Surat",
            areaSqft: 1050,
            bhk: 2,
            amountInr: 6_500_000,
            isRent: false,
            imageSrc: "/properties/1.jpg",
            photoCount: 8,
        },
        owner: {
            name: "Anita Desai",
            phoneDigits: "9812345678",
            isRepresentationActive: true,
        },
        stageEnteredAt: daysAgo(3),
        lastContactedAt: daysAgo(4),
        nextVisitAt: null,
        note: "",
        resolvedAt: null,
        closedAmountInr: null,
        offerAmountInr: null,
        offerStatus: null,
        createdAt: daysAgo(12),
    };

    return { ...base, ...overrides };
}

const CASES: { label: string; note: string; deal: DealItem }[] = [
    {
        label: "New",
        note: "First stage. No time-fact yet, advance button leads.",
        deal: makeDeal("new-1", "new", { stageEnteredAt: daysAgo(0), lastContactedAt: null }),
    },
    {
        label: "Contacted",
        note: "Typical card. One chip, one time-fact.",
        deal: makeDeal("contacted-1", "contacted"),
    },
    {
        label: "Missing photo",
        note: "Designed placeholder, never a broken image or a stock building.",
        deal: makeDeal("nophoto-1", "contacted", {
            property: { ...makeDeal("x", "new").property, imageSrc: "", photoCount: 0 },
        }),
    },
    {
        label: "Representation ended",
        note: "Muted surface, danger chip, no contact actions.",
        deal: makeDeal("ended-1", "visit", {
            owner: { name: "Anita Desai", isRepresentationActive: false },
            // No phone: representation lapsed, so the API sends no number and
            // the card must drop Call/WhatsApp rather than render dead links.
            buyer: {
                id: "b-ended",
                name: "Divyesh Patel",
                phoneDigits: "",
                budgetMaxInr: 5_000_000,
            },
        }),
    },
    {
        label: "Rent, long names",
        note: "Width stress: /mo price plus names that must truncate.",
        deal: makeDeal("rent-1", "contacted", {
            buyer: {
                id: "b-long",
                name: "Chandrakant Balkrishna Ramanathan",
                phoneDigits: "9876543210",
                budgetMaxInr: 20_000,
            },
            owner: {
                name: "Premjibhai Kanjibhai Savaliya",
                phoneDigits: "9812345678",
                isRepresentationActive: true,
            },
            property: {
                ...makeDeal("x", "new").property,
                configLabel: "1 BHK",
                locality: "Victoria Memorial Road",
                areaSqft: 620,
                amountInr: 18_000,
                isRent: true,
            },
        }),
    },
    {
        label: "Crore price, stalled",
        note: "Widest price plus a quiet-deal chip.",
        deal: makeDeal("cr-1", "visit", {
            stageEnteredAt: daysAgo(14),
            lastContactedAt: daysAgo(12),
            property: {
                ...makeDeal("x", "new").property,
                configLabel: "4 BHK",
                locality: "Kharadi",
                areaSqft: 2050,
                amountInr: 19_800_000,
            },
        }),
    },
    {
        label: "Negotiation",
        note: "Offer block plus revise action.",
        deal: makeDeal("neg-1", "negotiation", {
            offerAmountInr: 6_200_000,
            offerStatus: "pending",
            stageEnteredAt: daysAgo(6),
        }),
    },
    {
        label: "Closed",
        note: "Outcome badge replaces the advance button.",
        deal: makeDeal("closed-1", "closed", {
            resolvedAt: daysAgo(1),
            closedAmountInr: 6_400_000,
        }),
    },
];

export function PipelineCardPreview() {
    return (
        <main className="mx-auto flex flex-col gap-8 p-6 max-inline-7xl">
            <header className="flex flex-col gap-1">
                <h1 className="h2 text-ink">Pipeline card</h1>
                <p className="body-sm text-ink-muted">
                    Every state the deal card has to survive. Column width below matches a
                    real board column, so truncation here is truncation in production.
                </p>
            </header>

            <div
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
                {CASES.map((item) => (
                    <section key={item.label} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="body-sm font-semibold text-ink">{item.label}</h2>
                            <p className="body-xs text-ink-subtle">{item.note}</p>
                        </div>
                        <div className="inline-72 max-inline-full">
                            <DealCard deal={item.deal} handlers={NOOP_HANDLERS} />
                        </div>
                    </section>
                ))}
            </div>

            <header className="flex flex-col gap-1 mbs-4">
                <h2 className="h3 text-ink">List view card</h2>
                <p className="body-sm text-ink-muted">
                    The full-detail card. One deal per row, photo leads, every action labelled.
                </p>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
                {CASES.map((item) => (
                    <section key={item.label} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-0.5">
                            <h3 className="body-sm font-semibold text-ink">{item.label}</h3>
                            <p className="body-xs text-ink-subtle">{item.note}</p>
                        </div>
                        <DealCardRich
                            deal={item.deal}
                            handlers={NOOP_HANDLERS}
                            photoCount={item.deal.property.photoCount}
                        />
                    </section>
                ))}
            </div>
        </main>
    );
}
