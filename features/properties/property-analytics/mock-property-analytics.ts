import type {
    LeadStageKey,
    ListingsAnalytics,
    PropertyAnalytics,
    PropertyAnalyticsLead,
    StageCounts,
} from "@/lib/api/property-analytics";

/**
 * Filled listing-analytics fixtures for UI testing.
 * Relative dates keep upcoming / overdue / quiet attention states honest.
 */

const DAY_MS = 86_400_000;

function atDays(daysFromNow: number, hour = 11): string {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    date.setTime(date.getTime() + daysFromNow * DAY_MS);
    return date.toISOString();
}

function emptyStages(): StageCounts {
    return {
        new: 0,
        contacted: 0,
        site_visit: 0,
        negotiation: 0,
        offer_made: 0,
        closed_won: 0,
        closed_lost: 0,
    };
}

function countStages(leads: PropertyAnalyticsLead[]): StageCounts {
    const byStage = emptyStages();
    for (const lead of leads) {
        if (lead.stage in byStage) byStage[lead.stage] += 1;
    }
    return byStage;
}

function summarize(leads: PropertyAnalyticsLead[]): PropertyAnalytics["summary"] {
    const byStage = countStages(leads);
    const openLeads = leads.filter(
        (lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost",
    ).length;
    const won = leads.filter((lead) => lead.stage === "closed_won");
    const closedWonAmount = won.find((lead) => lead.closedAmount)?.closedAmount ?? null;

    return {
        totalLeads: leads.length,
        openLeads,
        closedWon: byStage.closed_won,
        closedLost: byStage.closed_lost,
        pendingOffers: leads.filter((lead) => lead.offerStatus === "pending").length,
        acceptedOffers: leads.filter((lead) => lead.offerStatus === "accepted").length,
        rejectedOffers: leads.filter((lead) => lead.offerStatus === "rejected").length,
        showings: leads.reduce((sum, lead) => sum + Math.max(0, lead.showings ?? 0), 0),
        closedWonAmount,
    };
}

function lead(
    partial: Omit<PropertyAnalyticsLead, "listPrice"> & { listPrice?: string | null },
): PropertyAnalyticsLead {
    return {
        listPrice: "20500000",
        ...partial,
    };
}

/** Busy listing for layout review: every stage, offer state and visit outcome. */
function buildFilledLeads(): PropertyAnalyticsLead[] {
    const names = [
        "Priya Mehta",
        "Vivek Nair",
        "Harsh Patel",
        "Ankit Shah",
        "Neha Desai",
        "Rohan Joshi",
        "Meera Bhatt",
        "Kavya Iyer",
        "Amit Trivedi",
        "Sneha Kapoor",
        "Arjun Rao",
        "Ishita Shah",
        "Rahul Verma",
        "Pooja Menon",
        "Kunal Jain",
        "Nisha Reddy",
        "Sanjay Gupta",
        "Aditi Kulkarni",
        "Dev Patel",
        "Riya Sethi",
        "Manish Bansal",
        "Ananya Das",
        "Varun Malhotra",
        "Sonal Agarwal",
        "Akash Nair",
        "Tanvi Joshi",
        "Rajesh Kumar",
        "Sakshi Bhat",
        "Nikhil Deshmukh",
        "Deepa Shah",
        "Gaurav Sinha",
        "Shreya Kapoor",
        "Vikas Mehta",
        "Simran Kaur",
        "Pranav Rao",
        "Swati Iyer",
        "Karan Shah",
        "Anjali Verma",
        "Sameer Khan",
        "Divya Nair",
    ];
    return names.map((name, index) => {
        const stage: LeadStageKey =
            index < 8
                ? "new"
                : index < 16
                  ? "contacted"
                  : index < 26
                    ? "site_visit"
                    : index < 32
                      ? "negotiation"
                      : index < 36
                        ? "offer_made"
                        : index === 36
                          ? "closed_won"
                          : "closed_lost";
        const hasOffer = index >= 29 && index <= 37;
        const offerStatus: PropertyAnalyticsLead["offerStatus"] = !hasOffer
            ? null
            : index === 36 || index === 35
              ? "accepted"
              : index === 33 || index === 37
                ? "rejected"
                : "pending";
        const hasVisit = index >= 16;
        const upcoming = index >= 16 && index <= 19;
        const needsUpdate = index === 20 || index === 21;
        const visitStatus = upcoming
            ? index % 2
                ? "scheduled"
                : "confirmed"
            : needsUpdate
              ? "scheduled"
              : index === 22
                ? "cancelled"
                : index === 23
                  ? "no_show"
                  : "completed";
        const offerAmount = hasOffer ? String(23_000_000 + (index - 29) * 350_000) : null;
        const note =
            stage === "new"
                ? "New client. Call to understand their requirements."
                : upcoming
                  ? "Visit booked. Confirm the meeting point before leaving."
                  : needsUpdate
                    ? "Visit time has passed. Record the outcome and next step."
                    : offerStatus === "pending"
                      ? "Offer shared with the owner. Follow up on their response."
                      : stage === "closed_won"
                        ? "Deal closed. Documents handed over."
                        : stage === "closed_lost"
                          ? "Client chose another property closer to their workplace."
                          : index % 3 === 0
                            ? "Comparing nearby properties. Follow up with the latest availability and documents."
                            : index % 3 === 1
                              ? "Interested in the location. Discuss access, paperwork and the expected timeline."
                              : null;
        return lead({
            id: `preview_analytics_${index + 1}`,
            clientId: null,
            buyerName: name,
            // Deliberately non-dialable sample numbers; preview contact actions are disabled.
            buyerPhone: index === 14 ? null : `+910000000${String(index + 1).padStart(3, "0")}`,
            buyerEmail:
                index % 4 === 0 ? null : `${name.toLowerCase().replaceAll(" ", ".")}@example.test`,
            stage,
            offerAmount,
            offerStatus,
            listPrice: "25000000",
            closedAmount: stage === "closed_won" ? offerAmount : null,
            notes: note,
            createdAt: atDays(-18 + (index % 4)),
            updatedAt:
                stage === "contacted" && index % 2 === 0
                    ? atDays(-15)
                    : index % 6 === 0
                      ? new Date().toISOString()
                      : atDays(-(index % 6)),
            showings: hasVisit ? 1 + (index % 3) : 0,
            latestShowing: hasVisit
                ? {
                      status: visitStatus,
                      scheduledDate: atDays(
                          upcoming ? index - 15 : -(1 + (index % 7)),
                          10 + (index % 7),
                      ),
                  }
                : null,
        });
    });
}

export function isPreviewAnalyticsClient(id: string): boolean {
    return id.startsWith("preview_analytics_");
}

export function getMockPropertyAnalytics(propertyId: string): PropertyAnalytics {
    const leads = buildFilledLeads();
    return {
        property: {
            id: propertyId,
            title: "Commercial Plot in Mota Varachha, Surat",
            city: "Surat",
            address: "Mota Varachha, Surat",
            status: "available",
            publishStatus: "published",
            transactionType: "sale",
            salePrice: "25000000",
            monthlyRent: null,
            photo: "/properties/1.jpg",
            createdAt: atDays(-17),
            soldAt: null,
        },
        summary: summarize(leads),
        byStage: countStages(leads),
        leads,
    };
}

function portfolioRow(
    propertyId: string,
    title: string,
    city: string,
    salePrice: string,
    leads: PropertyAnalyticsLead[],
): ListingsAnalytics["properties"][number] {
    const byStage = countStages(leads);
    const summary = summarize(leads);
    return {
        id: propertyId,
        title,
        city,
        address: city,
        status: "available",
        publishStatus: "published",
        transactionType: "sale",
        salePrice,
        monthlyRent: null,
        photo: "/properties/1.jpg",
        totalLeads: summary.totalLeads,
        openLeads: summary.openLeads,
        closedWon: summary.closedWon,
        closedLost: summary.closedLost,
        showings: summary.showings,
        pendingOffers: summary.pendingOffers,
        byStage,
    };
}

/** Portfolio analytics for mock / preview mode. */
export function getMockListingsAnalytics(): ListingsAnalytics {
    const primary = buildFilledLeads();
    const secondary: PropertyAnalyticsLead[] = [
        lead({
            id: "lead_ayush",
            stage: "contacted",
            buyerName: "Ayush",
            buyerPhone: "+919811122233",
            buyerEmail: null,
            clientId: "buy_01",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: null,
            createdAt: atDays(-6),
            updatedAt: atDays(-1),
            showings: 0,
            latestShowing: null,
            listPrice: "11500000",
        }),
        lead({
            id: "lead_shiv",
            stage: "site_visit",
            buyerName: "Shiv",
            buyerPhone: "+919822233344",
            buyerEmail: null,
            clientId: "buy_02",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: null,
            createdAt: atDays(-10),
            updatedAt: atDays(-2),
            showings: 1,
            latestShowing: { status: "confirmed", scheduledDate: atDays(2) },
            listPrice: "11500000",
        }),
    ];

    const properties = [
        portfolioRow(
            "preview_mota_varachha",
            "Commercial Plot in Mota Varachha, Surat",
            "Surat",
            "20500000",
            primary,
        ),
        portfolioRow("own_001", "3 BHK · Andheri West", "Mumbai", "11500000", secondary),
    ];

    const byStage = emptyStages();
    let totalLeads = 0;
    let openLeads = 0;
    let closedWon = 0;
    let closedLost = 0;
    let showings = 0;
    let pendingOffers = 0;

    for (const property of properties) {
        totalLeads += property.totalLeads;
        openLeads += property.openLeads;
        closedWon += property.closedWon;
        closedLost += property.closedLost;
        showings += property.showings;
        pendingOffers += property.pendingOffers;
        for (const stage of Object.keys(byStage) as LeadStageKey[]) {
            byStage[stage] += property.byStage[stage];
        }
    }

    return {
        totals: {
            properties: properties.length,
            totalLeads,
            openLeads,
            closedWon,
            closedLost,
            showings,
            pendingOffers,
        },
        byStage,
        properties,
    };
}
