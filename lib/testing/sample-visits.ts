import { paginateItems } from "@/lib/api/mock-mode";
import type {
    BookableLead,
    BrokerVisit,
    VisitDuration,
    VisitListPage,
    VisitListQuery,
    VisitTab,
} from "@/lib/api/site-visits";
import { matchesVisitSearch } from "@/lib/search/crm-search";
import { inputValueToUtc, istDateKey } from "@/lib/visits/time";

import { MOCK_DEALS } from "@/features/pipeline/mock-deals";

const now = Date.now();
const statuses: BrokerVisit["status"][] = [
    "confirmed",
    "confirmed",
    "scheduled",
    "completed",
    "no_show",
    "cancelled",
    "scheduled",
];
const offsets = [120, -10, -120, -1440, -2880, 2880, 1440];
const visits: BrokerVisit[] = MOCK_DEALS.map((deal, index) => {
    const startsAt = new Date(
        now + (offsets[index % offsets.length] + Math.floor(index / 7) * 3) * 60_000,
    ).toISOString();
    return {
        id: `test-visit-${deal.id}`,
        leadId: deal.id,
        clientId: deal.buyer.id,
        clientName: deal.buyer.name,
        clientPhone: deal.buyer.phoneDigits || null,
        ownerId: deal.owner.id,
        ownerName: deal.owner.name,
        ownerAvatarUrl: deal.owner.avatarUrl ?? null,
        propertyId: deal.property.id,
        propertyTitle: deal.property.title,
        locality: deal.property.locality,
        city: deal.property.city,
        isExclusive: true,
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 30 * 60_000).toISOString(),
        durationMinutes: 30,
        status: statuses[index % statuses.length],
        notes: index % 3 === 0 ? "Meet at the main gate. Sample visit for testing." : "",
        bookedAt: new Date(now - 86_400_000).toISOString(),
        updatedAt: new Date(now).toISOString(),
        reminders: [30],
        coverImage: deal.property.imageSrc,
        amountInr: deal.property.amountInr,
        isRent: deal.property.isRent,
        commissionPercent: deal.property.commissionPercent,
        commissionAmountInr: deal.property.commissionAmountInr,
    };
});

function tabFor(visit: BrokerVisit): VisitTab {
    if (visit.status === "completed") return "completed";
    if (visit.status === "no_show") return "not_attended";
    if (visit.status === "cancelled") return "cancelled";
    if (Date.parse(visit.endsAt) <= Date.now()) return "needs_update";
    return Date.parse(visit.startsAt) <= Date.now() ? "running" : "upcoming";
}

function find(id: string): BrokerVisit {
    const visit = visits.find((item) => item.id === id);
    if (!visit) throw new Error("Visit not found.");
    return visit;
}

function matchesDateBound(
    startsAt: string,
    bound: string | undefined,
    side: "from" | "to",
): boolean {
    if (!bound) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(bound)) {
        const day = istDateKey(startsAt);
        return side === "from" ? day >= bound : day <= bound;
    }
    const timestamp = Date.parse(startsAt);
    const boundary = Date.parse(bound);
    return side === "from" ? timestamp >= boundary : timestamp <= boundary;
}

export const sampleVisits = {
    list(query: VisitListQuery): VisitListPage {
        const scope = visits.filter(
            (visit) =>
                (!query.clientId || visit.clientId === query.clientId) &&
                (!query.propertyId || visit.propertyId === query.propertyId) &&
                (!query.leadId || visit.leadId === query.leadId) &&
                matchesDateBound(visit.startsAt, query.from, "from") &&
                matchesDateBound(visit.startsAt, query.to, "to") &&
                (!query.search || matchesVisitSearch(visit, query.search)),
        );
        const counts: VisitListPage["counts"] = {
            upcoming: 0,
            running: 0,
            needs_update: 0,
            completed: 0,
            not_attended: 0,
            cancelled: 0,
        };
        for (const visit of scope) counts[tabFor(visit)]++;
        const matched = scope.filter((visit) =>
            query.tab === "active"
                ? ["upcoming", "running", "needs_update"].includes(tabFor(visit))
                : tabFor(visit) === query.tab,
        );
        matched.sort((a, b) =>
            query.sort === "booked_desc"
                ? b.bookedAt.localeCompare(a.bookedAt)
                : query.sort === "start_desc"
                  ? b.startsAt.localeCompare(a.startsAt)
                  : a.startsAt.localeCompare(b.startsAt),
        );
        return {
            ...paginateItems(structuredClone(matched), query.page ?? 1, query.limit ?? 20),
            counts,
            clientOptions: [
                ...new Map(
                    scope.map((visit) => [
                        visit.clientId,
                        { id: visit.clientId, name: visit.clientName },
                    ]),
                ).values(),
            ],
            propertyOptions: [
                ...new Map(
                    scope.map((visit) => [
                        visit.propertyId,
                        { id: visit.propertyId, title: visit.propertyTitle },
                    ]),
                ).values(),
            ],
            nextChangeAt: null,
        };
    },
    bookable(): BookableLead[] {
        return MOCK_DEALS.filter((deal) => !["closed", "lost"].includes(deal.status)).map(
            (deal) => ({
                leadId: deal.id,
                clientId: deal.buyer.id,
                clientName: deal.buyer.name,
                propertyId: deal.property.id,
                propertyTitle: deal.property.title,
            }),
        );
    },
    freeTimes(args: {
        propertyId: string;
        date: string;
        durationMinutes: VisitDuration;
        excludeShowingId?: string;
    }): string[] {
        return ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"]
            .map((time) => inputValueToUtc(`${args.date}T${time}`))
            .filter(
                (start): start is string =>
                    !!start &&
                    Date.parse(start) > Date.now() &&
                    !visits.some(
                        (visit) =>
                            visit.id !== args.excludeShowingId &&
                            visit.propertyId === args.propertyId &&
                            !["cancelled", "no_show"].includes(visit.status) &&
                            Date.parse(visit.startsAt) <
                                Date.parse(start) + args.durationMinutes * 60_000 &&
                            Date.parse(visit.endsAt) > Date.parse(start),
                    ),
            );
    },
    book(args: {
        propertyId: string;
        leadId: string;
        startAt: string;
        durationMinutes: VisitDuration;
        notes?: string;
        reminders?: number[];
    }): void {
        const deal = MOCK_DEALS.find(
            (item) => item.id === args.leadId && item.property.id === args.propertyId,
        );
        if (!deal) throw new Error("Choose an available deal to book this visit.");
        const template = visits.find((visit) => visit.leadId === deal.id);
        if (!template) throw new Error("Sample visit details are unavailable for this deal.");
        visits.push({
            ...structuredClone(template),
            id: `test-booking-${Date.now()}`,
            startsAt: args.startAt,
            endsAt: new Date(
                Date.parse(args.startAt) + args.durationMinutes * 60_000,
            ).toISOString(),
            durationMinutes: args.durationMinutes,
            notes: args.notes ?? "",
            reminders: args.reminders ?? [],
            status: "confirmed",
            bookedAt: new Date().toISOString(),
        });
    },
    reschedule(
        id: string,
        args: {
            startAt: string;
            durationMinutes: VisitDuration;
            notes?: string;
            reminders?: number[];
        },
    ): BrokerVisit {
        const visit = find(id);
        Object.assign(visit, {
            startsAt: args.startAt,
            endsAt: new Date(
                Date.parse(args.startAt) + args.durationMinutes * 60_000,
            ).toISOString(),
            durationMinutes: args.durationMinutes,
            notes: args.notes ?? visit.notes,
            reminders: args.reminders ?? visit.reminders,
            status: "confirmed",
            updatedAt: new Date().toISOString(),
        });
        return structuredClone(visit);
    },
    updateReminders(id: string, reminders: number[]): BrokerVisit {
        const visit = find(id);
        visit.reminders = [...reminders];
        return structuredClone(visit);
    },
    cancel(id: string): void {
        find(id).status = "cancelled";
    },
    setOutcome(id: string, status: "completed" | "no_show"): BrokerVisit {
        const visit = find(id);
        visit.status = status;
        return structuredClone(visit);
    },
};
