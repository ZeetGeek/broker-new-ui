import {
    LEAD_STAGES,
    type LeadStageKey,
    type PropertyAnalytics,
    type PropertyAnalyticsLead,
    type StageCounts,
} from "@/lib/api/property-analytics";

import type { MyListingItem } from "@/features/properties/your-listings/types";

const CLIENT_NAMES = [
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
    "Karan Joshi",
    "Bhavya Patel",
    "Aditya Menon",
    "Ritika Shah",
    "Nitin Jain",
    "Pallavi Rao",
    "Suresh Iyer",
    "Tanya Bhat",
    "Yash Gupta",
    "Ruchi Sethi",
    "Mihir Desai",
    "Shalini Kumar",
    "Dhruv Mehta",
    "Sana Khan",
    "Tejas Shah",
    "Nandini Rao",
    "Rakesh Patel",
    "Diya Kapoor",
    "Abhay Nair",
    "Anusha Reddy",
] as const;

const CLIENT_NOTES = [
    "Call to confirm the client's requirements and preferred location.",
    "Property details shared. Follow up on the client's shortlist.",
    "Client requested a floor plan before booking a visit.",
    "Discuss commute time and the client's preferred move-in date.",
    "Client is comparing two properties. Arrange a follow-up call.",
    "Confirm the client's budget and preferred visit time.",
];

/** Broker CRM fixtures only: no representation, requests or approval records. */
export function getBrokerAnalyticsPreview(
    propertyId: string,
    listing: MyListingItem,
    now = Date.now(),
): PropertyAnalytics {
    const at = (days: number) => new Date(now + days * 86_400_000).toISOString();
    const ask =
        listing.transactionType === "rent"
            ? listing.rentAmountInr
            : (listing.saleAmountInr ?? listing.rentAmountInr);
    const leads: PropertyAnalyticsLead[] = CLIENT_NAMES.map((name, index) => {
        const stage: LeadStageKey =
            index < 16
                ? "new"
                : index < 28
                  ? "contacted"
                  : index < 42
                    ? "site_visit"
                    : index < 50
                      ? "negotiation"
                      : index < 56
                        ? "offer_made"
                        : index === 56
                          ? "closed_won"
                          : "closed_lost";
        const hasOffer = index >= 44 && index <= 58 && ask != null && ask > 0;
        const offerAmount = hasOffer
            ? String(Math.round(ask * (0.88 + (index - 44) * 0.01)))
            : null;
        const offerStatus = !hasOffer
            ? null
            : index === 55 || index === 56
              ? "accepted"
              : index === 53 || index >= 57
                ? "rejected"
                : "pending";
        const hasVisit = index >= 28;
        const upcoming = index >= 28 && index <= 33;
        const needsOutcome = index >= 34 && index <= 37;
        const status = upcoming
            ? index % 2
                ? "scheduled"
                : "confirmed"
            : needsOutcome
              ? "scheduled"
              : index === 38
                ? "cancelled"
                : index === 39
                  ? "no_show"
                  : "completed";
        return {
            id: `preview_analytics_broker_${index + 1}`,
            clientId: null,
            stage,
            buyerName: name,
            buyerPhone: index % 13 === 0 ? null : `+910000000${String(index + 1).padStart(3, "0")}`,
            buyerEmail:
                index % 4 === 0 ? null : `${name.toLowerCase().replaceAll(" ", ".")}@example.test`,
            offerAmount,
            offerStatus,
            listPrice: ask != null && ask > 0 ? String(ask) : null,
            closedAmount: stage === "closed_won" ? offerAmount : null,
            notes:
                stage === "closed_won"
                    ? "Deal closed. Record the final paperwork and commission."
                    : stage === "closed_lost"
                      ? "Client selected another property. Keep their requirements for future follow-up."
                      : upcoming
                        ? "Visit booked. Confirm the meeting point and share the property directions with the client."
                        : needsOutcome
                          ? "Visit finished. Record the client's feedback and agree on the next step."
                          : hasOffer
                            ? "Client's offer recorded. Call the client to discuss their budget and next steps."
                            : CLIENT_NOTES[index % CLIENT_NOTES.length],
            createdAt: at(-24 + (index % 6)),
            updatedAt: at(index === 56 ? 0 : -(index % 17)),
            showings: hasVisit ? 1 + (index % 3) : 0,
            latestShowing: hasVisit
                ? {
                      status,
                      scheduledDate: at(upcoming ? index - 27 : -(1 + (index % 7))),
                  }
                : null,
        };
    });
    const byStage = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, 0])) as StageCounts;
    for (const client of leads) byStage[client.stage] += 1;
    return {
        property: {
            id: propertyId,
            title: listing.title,
            city: listing.city,
            address: listing.address,
            status: listing.isSold ? "sold" : "available",
            publishStatus: listing.status,
            transactionType: listing.transactionType,
            salePrice: listing.saleAmountInr == null ? null : String(listing.saleAmountInr),
            monthlyRent: listing.rentAmountInr == null ? null : String(listing.rentAmountInr),
            photo: listing.imageSrc || null,
            createdAt: listing.createdAt,
            soldAt: listing.soldAt ?? null,
        },
        summary: {
            totalLeads: leads.length,
            openLeads: leads.length - byStage.closed_won - byStage.closed_lost,
            closedWon: byStage.closed_won,
            closedLost: byStage.closed_lost,
            pendingOffers: leads.filter((client) => client.offerStatus === "pending").length,
            acceptedOffers: leads.filter((client) => client.offerStatus === "accepted").length,
            rejectedOffers: leads.filter((client) => client.offerStatus === "rejected").length,
            showings: leads.reduce((total, client) => total + client.showings, 0),
            closedWonAmount:
                leads.find((client) => client.stage === "closed_won")?.closedAmount ?? null,
        },
        byStage,
        leads,
    };
}
