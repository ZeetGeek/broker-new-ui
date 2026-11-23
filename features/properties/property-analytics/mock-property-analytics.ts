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

/** One busy commercial plot — every analytics card has something real to show. */
function buildFilledLeads(): PropertyAnalyticsLead[] {
    return [
        lead({
            id: "lead_priya_offer",
            stage: "offer_made",
            buyerName: "Priya Mehta",
            buyerPhone: "+919820011223",
            buyerEmail: "priya.mehta@email.com",
            clientId: "client_priya",
            offerAmount: "19800000",
            offerStatus: "pending",
            closedAmount: null,
            notes: "Wants registry in her husband's name. Cash + home loan mix.",
            createdAt: atDays(-28),
            updatedAt: atDays(-1),
            showings: 2,
            latestShowing: { status: "completed", scheduledDate: atDays(-6) },
        }),
        lead({
            id: "lead_vivek_high",
            stage: "negotiation",
            buyerName: "Vivek Nair",
            buyerPhone: "+919887766554",
            buyerEmail: "vivek.nair@email.com",
            clientId: "client_vivek",
            offerAmount: "21000000",
            offerStatus: "pending",
            closedAmount: null,
            notes: "Above asking. Waiting on board resolution from his firm.",
            createdAt: atDays(-21),
            updatedAt: atDays(-0.2),
            showings: 3,
            latestShowing: { status: "completed", scheduledDate: atDays(-3) },
        }),
        lead({
            id: "lead_harsh_visit",
            stage: "site_visit",
            buyerName: "Harsh Patel",
            buyerPhone: "+919825501100",
            buyerEmail: "harsh.patel@email.com",
            clientId: "client_harsh",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Bringing his CA tomorrow. Focus on road access and NA papers.",
            createdAt: atDays(-12),
            updatedAt: atDays(-1),
            showings: 1,
            latestShowing: { status: "confirmed", scheduledDate: atDays(1, 10) },
        }),
        lead({
            id: "lead_ankit_update",
            stage: "site_visit",
            buyerName: "Ankit Shah",
            buyerPhone: "+919898989898",
            buyerEmail: "ankit.shah@email.com",
            clientId: "client_ankit",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Visited yesterday — still waiting on his feedback.",
            createdAt: atDays(-18),
            updatedAt: atDays(-2),
            showings: 1,
            latestShowing: { status: "scheduled", scheduledDate: atDays(-1, 16) },
        }),
        lead({
            id: "lead_neha_quiet",
            stage: "contacted",
            buyerName: "Neha Desai",
            buyerPhone: "+919712345678",
            buyerEmail: "neha.desai@email.com",
            clientId: "client_neha",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Liked the location. Went quiet after first call.",
            createdAt: atDays(-30),
            updatedAt: atDays(-18),
            showings: 0,
            latestShowing: null,
        }),
        lead({
            id: "lead_rohan_new",
            stage: "new",
            buyerName: "Rohan Joshi",
            buyerPhone: "+919909090901",
            buyerEmail: "rohan.joshi@email.com",
            clientId: "client_rohan",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Inbound from Instagram ad. Not contacted yet.",
            createdAt: atDays(-2),
            updatedAt: atDays(-2),
            showings: 0,
            latestShowing: null,
        }),
        lead({
            id: "lead_divyesh_new",
            stage: "new",
            buyerName: "Divyesh B",
            buyerPhone: "+919856525662",
            buyerEmail: "test@gmail.com",
            clientId: "client_divyesh",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "test add buyer",
            createdAt: atDays(-18),
            updatedAt: atDays(-18),
            showings: 0,
            latestShowing: null,
        }),
        lead({
            id: "lead_meera_ok",
            stage: "contacted",
            buyerName: "Meera Bhatt",
            buyerPhone: "+919933221100",
            buyerEmail: "meera.bhatt@email.com",
            clientId: "client_meera",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Comparing two plots. Call again after Diwali weekend.",
            createdAt: atDays(-9),
            updatedAt: atDays(-1),
            showings: 0,
            latestShowing: null,
        }),
        lead({
            id: "lead_kavya_rejected",
            stage: "offer_made",
            buyerName: "Kavya Iyer",
            buyerPhone: "+919944556677",
            buyerEmail: "kavya.iyer@email.com",
            clientId: "client_kavya",
            offerAmount: "18500000",
            offerStatus: "rejected",
            closedAmount: null,
            notes: "Offer too low vs circle rate. May come back.",
            createdAt: atDays(-40),
            updatedAt: atDays(-8),
            showings: 2,
            latestShowing: { status: "completed", scheduledDate: atDays(-14) },
        }),
        lead({
            id: "lead_amit_won",
            stage: "closed_won",
            buyerName: "Amit Trivedi",
            buyerPhone: "+919876543210",
            buyerEmail: "amit.trivedi@email.com",
            clientId: "client_amit",
            offerAmount: "20000000",
            offerStatus: "accepted",
            closedAmount: "20000000",
            notes: "Token paid. Agreement next Tuesday.",
            createdAt: atDays(-45),
            updatedAt: atDays(-4),
            showings: 4,
            latestShowing: { status: "completed", scheduledDate: atDays(-10) },
        }),
        lead({
            id: "lead_sneha_lost",
            stage: "closed_lost",
            buyerName: "Sneha Kapoor",
            buyerPhone: "+919900112233",
            buyerEmail: "sneha.kapoor@email.com",
            clientId: "client_sneha",
            offerAmount: null,
            offerStatus: null,
            closedAmount: null,
            notes: "Bought a smaller plot closer to the highway.",
            createdAt: atDays(-35),
            updatedAt: atDays(-7),
            showings: 1,
            latestShowing: { status: "completed", scheduledDate: atDays(-20) },
        }),
    ];
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
            salePrice: "20500000",
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
