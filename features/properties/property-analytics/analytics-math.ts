import type {
    LeadStageKey,
    PropertyAnalytics,
    PropertyAnalyticsLead,
} from "@/lib/api/property-analytics";
import { parseMoney } from "@/lib/format/money";

import type { DealStatus } from "@/features/pipeline/types";

/**
 * Everything the listing analytics page shows, worked out from
 * `GET /properties/:id/analytics` alone. Pure: no React, no formatting, so the
 * page renders the same from live data or a test.
 */

export type Side = "sale" | "rent";
export type ClientGroup = "active" | "won" | "lost";

/** An active client with no update for this long needs a follow-up. Same as earnings. */
export const QUIET_AFTER_DAYS = 14;

const DAY_MS = 86_400_000;

/** Same mapping as `fromApiStage` in lib/api/pipeline.ts, so stages match the board. */
const STAGE_TO_STATUS: Record<LeadStageKey, DealStatus> = {
    new: "new",
    contacted: "contacted",
    site_visit: "visit",
    negotiation: "negotiation",
    offer_made: "negotiation",
    closed_won: "closed",
    closed_lost: "lost",
};

/** How far along the API stage is. Lost says nothing about how far it got. */
const STAGE_RANK: Record<LeadStageKey, number> = {
    new: 0,
    contacted: 1,
    site_visit: 2,
    negotiation: 3,
    offer_made: 4,
    closed_won: 5,
    closed_lost: -1,
};

/** Board order, then the two outcomes. */
export const STATUS_ORDER: DealStatus[] = [
    "new",
    "contacted",
    "visit",
    "negotiation",
    "closed",
    "lost",
];

const LIVE_VISIT_STATUSES = new Set(["scheduled", "confirmed"]);

/** Length assumed for a visit stored without an end. Same as the API. */
const DEFAULT_VISIT_MS = 30 * 60_000;

export type ListingAsk = { saleInr: number | null; rentInr: number | null };

export type OfferInfo = {
    amountInr: number;
    status: "pending" | "accepted" | "rejected" | null;
    side: Side;
    /** The listing's current ask on the same side. Null when the listing has none. */
    askInr: number | null;
    /** Offer minus ask. Negative is below asking. */
    gapInr: number | null;
    /** Offer as a share of the ask; 1 is at asking. */
    ratio: number | null;
};

export type VisitInfo = {
    at: Date;
    endsAt: Date;
    status: string | null;
    /** Booked and still ahead. */
    upcoming: boolean;
    /** Booked and happening now. */
    running: boolean;
    /** Booked, it has ended, and nobody marked how it went. Same as Visits → Needs update. */
    needsUpdate: boolean;
};

export type ClientRow = {
    id: string;
    clientId: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    stage: LeadStageKey;
    status: DealStatus;
    group: ClientGroup;
    side: Side;
    offer: OfferInfo | null;
    closedInr: number | null;
    visits: number;
    visit: VisitInfo | null;
    addedAt: Date | null;
    updatedAt: Date | null;
    /** Whole days since the last update. Active clients only. */
    idleDays: number | null;
    note: string | null;
};

export type AttentionKind = "offer" | "visit_soon" | "visit_update" | "not_contacted" | "quiet";

export type AttentionItem = { kind: AttentionKind; client: ClientRow };

export type FunnelStep = {
    key: "added" | "visited" | "offered" | "won";
    count: number;
    /** Share of all clients, 0–1. */
    share: number;
};

export type PropertyReport = {
    /** "Sold", "Rented", or "Closed" when the listing is for both. */
    closedWord: string;
    ask: ListingAsk;
    listedAt: Date | null;
    soldAt: Date | null;
    /** Days from listing to sold, or to today while it is still on the market. */
    daysListed: number | null;
    lastUpdateAt: Date | null;
    counts: { total: number; active: number; won: number; lost: number };
    visits: {
        /** Booked visits; cancelled ones are left out. */
        total: number;
        clientsVisited: number;
        upcoming: number;
        needsUpdate: number;
        nextAt: Date | null;
        lastAt: Date | null;
    };
    offers: {
        rows: ClientRow[];
        pending: number;
        accepted: number;
        rejected: number;
        best: ClientRow | null;
    };
    closedInr: number | null;
    /** Commission locked when the deal closed. Null when nothing closed or it was unvalued. */
    closedCommissionInr: number | null;
    funnel: FunnelStep[];
    statusCounts: Record<DealStatus, number>;
    attention: AttentionItem[];
    clients: ClientRow[];
};

function amount(value: string | null | undefined): number | null {
    const parsed = parseMoney(value);
    return parsed != null && parsed > 0 ? parsed : null;
}

function date(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function wholeDays(from: Date, to: Date): number {
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));
}

export function listingAsk(property: PropertyAnalytics["property"]): ListingAsk {
    const sale = amount(property.salePrice);
    const rent = amount(property.monthlyRent);
    if (property.transactionType === "sale") return { saleInr: sale, rentInr: null };
    if (property.transactionType === "rent") return { saleInr: null, rentInr: rent };
    return { saleInr: sale, rentInr: rent };
}

export function closedWordFor(ask: ListingAsk): string {
    if (ask.saleInr != null && ask.rentInr != null) return "Closed";
    return ask.rentInr != null ? "Rented" : "Sold";
}

/**
 * Whether a client is buying or renting. Single-mode listings say so; on a
 * listing for both, the amount on the deal sits much nearer one ask than the
 * other (a rent is a few hundredths of a sale price).
 */
export function leadSide(lead: PropertyAnalyticsLead, ask: ListingAsk): Side {
    if (ask.rentInr == null) return "sale";
    if (ask.saleInr == null) return "rent";
    const value = amount(lead.closedAmount) ?? amount(lead.offerAmount) ?? amount(lead.listPrice);
    if (value == null) return "sale";
    const toRent = Math.abs(Math.log(value / ask.rentInr));
    const toSale = Math.abs(Math.log(value / ask.saleInr));
    return toRent < toSale ? "rent" : "sale";
}

function groupOf(stage: LeadStageKey): ClientGroup {
    if (stage === "closed_won") return "won";
    if (stage === "closed_lost") return "lost";
    return "active";
}

function toClientRow(lead: PropertyAnalyticsLead, ask: ListingAsk, now: Date): ClientRow {
    const stage: LeadStageKey = lead.stage in STAGE_TO_STATUS ? lead.stage : "new";
    const group = groupOf(stage);
    const side = leadSide(lead, ask);
    const sideAsk = side === "rent" ? ask.rentInr : ask.saleInr;
    const sideAskInr = sideAsk ?? amount(lead.listPrice);

    const offerInr = amount(lead.offerAmount);
    const offer: OfferInfo | null =
        offerInr == null
            ? null
            : {
                  amountInr: offerInr,
                  status: lead.offerStatus,
                  side,
                  askInr: sideAskInr,
                  gapInr: sideAskInr == null ? null : offerInr - sideAskInr,
                  ratio: sideAskInr == null ? null : offerInr / sideAskInr,
              };

    const visitAt = date(lead.latestShowing?.scheduledDate);
    const visitStatus = lead.latestShowing?.status ?? null;
    const live = visitStatus == null || LIVE_VISIT_STATUSES.has(visitStatus);
    let visit: VisitInfo | null = null;
    if (visitAt) {
        const endsAt =
            date(lead.latestShowing?.endAt) ?? new Date(visitAt.getTime() + DEFAULT_VISIT_MS);
        const t = now.getTime();
        visit = {
            at: visitAt,
            endsAt,
            status: visitStatus,
            upcoming: live && visitAt.getTime() > t,
            running: live && visitAt.getTime() <= t && endsAt.getTime() > t,
            needsUpdate: live && endsAt.getTime() <= t,
        };
    }

    const updatedAt = date(lead.updatedAt);

    return {
        id: lead.id,
        clientId: lead.clientId,
        name: lead.buyerName?.trim() || "Unnamed client",
        phone: lead.buyerPhone?.replace(/[^\d+]/g, "") || null,
        email: lead.buyerEmail?.trim() || null,
        stage,
        status: STAGE_TO_STATUS[stage],
        group,
        side,
        offer,
        closedInr: amount(lead.closedAmount),
        visits: Math.max(0, lead.showings ?? 0),
        visit,
        addedAt: date(lead.createdAt),
        updatedAt,
        idleDays: group === "active" && updatedAt ? wholeDays(updatedAt, now) : null,
        note: lead.notes?.trim() || null,
    };
}

const ATTENTION_ORDER: AttentionKind[] = [
    "offer",
    "visit_soon",
    "visit_update",
    "not_contacted",
    "quiet",
];

function attentionKind(client: ClientRow): AttentionKind | null {
    if (client.group !== "active") {
        return client.visit?.upcoming ? "visit_soon" : null;
    }
    if (client.offer?.status === "pending") return "offer";
    if (client.visit?.upcoming) return "visit_soon";
    if (client.visit?.needsUpdate) return "visit_update";
    if (client.stage === "new") return "not_contacted";
    if (client.idleDays != null && client.idleDays >= QUIET_AFTER_DAYS) return "quiet";
    return null;
}

/** One item per client, the most pressing first. Visits soonest first; the rest oldest first. */
export function buildAttention(clients: ClientRow[]): AttentionItem[] {
    const items = clients.flatMap((client) => {
        const kind = attentionKind(client);
        return kind ? [{ kind, client }] : [];
    });
    const time = (value: Date | null | undefined) => value?.getTime() ?? 0;
    return items.sort((a, b) => {
        const byKind = ATTENTION_ORDER.indexOf(a.kind) - ATTENTION_ORDER.indexOf(b.kind);
        if (byKind !== 0) return byKind;
        if (a.kind === "visit_soon") return time(a.client.visit?.at) - time(b.client.visit?.at);
        return time(a.client.updatedAt) - time(b.client.updatedAt);
    });
}

/**
 * How far clients got, not where they sit now: a client who visited and was
 * then lost still counts as having visited. Each step is a subset of the last.
 */
export function buildFunnel(clients: ClientRow[]): FunnelStep[] {
    let visited = 0;
    let offered = 0;
    let won = 0;
    for (const client of clients) {
        const rank = STAGE_RANK[client.stage];
        const didOffer = rank >= STAGE_RANK.offer_made || client.offer != null;
        const didVisit = didOffer || rank >= STAGE_RANK.site_visit || client.visits > 0;
        if (didVisit) visited += 1;
        if (didOffer) offered += 1;
        if (client.group === "won") won += 1;
    }
    const total = clients.length;
    const share = (count: number) => (total > 0 ? count / total : 0);
    return [
        { key: "added", count: total, share: share(total) },
        { key: "visited", count: visited, share: share(visited) },
        { key: "offered", count: offered, share: share(offered) },
        { key: "won", count: won, share: share(won) },
    ];
}

function offerOrder(a: ClientRow, b: ClientRow): number {
    const ar = a.offer?.ratio;
    const br = b.offer?.ratio;
    if (ar != null && br != null && ar !== br) return br - ar;
    if (ar != null && br == null) return -1;
    if (ar == null && br != null) return 1;
    return (b.offer?.amountInr ?? 0) - (a.offer?.amountInr ?? 0);
}

export function buildPropertyReport(data: PropertyAnalytics, now: Date): PropertyReport {
    const ask = listingAsk(data.property);
    const clients = data.leads.map((lead) => toClientRow(lead, ask, now));

    const statusCounts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
        DealStatus,
        number
    >;
    for (const client of clients) statusCounts[client.status] += 1;

    const counts = {
        total: clients.length,
        active: clients.filter((c) => c.group === "active").length,
        won: clients.filter((c) => c.group === "won").length,
        lost: clients.filter((c) => c.group === "lost").length,
    };

    const upcoming = clients
        .flatMap((c) => (c.visit?.upcoming ? [c.visit.at] : []))
        .sort((a, b) => a.getTime() - b.getTime());
    const past = clients
        .flatMap((c) => (c.visit && !c.visit.upcoming ? [c.visit.at] : []))
        .sort((a, b) => b.getTime() - a.getTime());

    const offerRows = clients.filter((c) => c.offer != null).sort(offerOrder);
    const standing = offerRows.filter((c) => c.offer?.status !== "rejected");

    const won = clients.filter((c) => c.group === "won");
    const closedFromRows = won.reduce((sum, c) => sum + (c.closedInr ?? 0), 0);
    const closedInr = amount(data.summary.closedWonAmount) ?? (closedFromRows || null);
    const lockedFromRows = won.reduce(
        (sum, c) =>
            sum + (amount(data.leads.find((l) => l.id === c.id)?.commissionInrAtClose) ?? 0),
        0,
    );
    const closedCommissionInr =
        amount(data.summary.closedCommissionInr) ?? (lockedFromRows || null);
    // The API counts every visit by state; older payloads only carry each client's latest.
    const apiVisits = data.summary.visits;

    const listedAt = date(data.property.createdAt);
    const soldAt = date(data.property.soldAt);
    const updates = clients.flatMap((c) => (c.updatedAt ? [c.updatedAt.getTime()] : []));

    return {
        closedWord: closedWordFor(ask),
        ask,
        listedAt,
        soldAt,
        daysListed: listedAt ? wholeDays(listedAt, soldAt ?? now) : null,
        lastUpdateAt: updates.length > 0 ? new Date(Math.max(...updates)) : null,
        counts,
        visits: {
            total: clients.reduce((sum, c) => sum + c.visits, 0),
            clientsVisited:
                data.summary.clientsVisited ?? clients.filter((c) => c.visits > 0).length,
            upcoming: apiVisits?.upcoming ?? upcoming.length,
            needsUpdate:
                apiVisits?.needs_update ?? clients.filter((c) => c.visit?.needsUpdate).length,
            nextAt: upcoming[0] ?? null,
            lastAt: past[0] ?? null,
        },
        offers: {
            rows: offerRows,
            pending: offerRows.filter((c) => c.offer?.status === "pending").length,
            accepted: offerRows.filter((c) => c.offer?.status === "accepted").length,
            rejected: offerRows.filter((c) => c.offer?.status === "rejected").length,
            best: standing[0] ?? offerRows[0] ?? null,
        },
        closedInr,
        closedCommissionInr,
        funnel: buildFunnel(clients),
        statusCounts,
        attention: buildAttention(clients),
        clients,
    };
}
