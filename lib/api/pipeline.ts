import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { appendDealListingQuery, dealListingApiQuery } from "@/lib/properties/deal-listing-query";
import {
    matchesPropertyCriteria,
    normalizePropertyCriteria,
    type PropertyFilterRecord,
} from "@/lib/properties/list-criteria";
import { collectPeopleFilterOptions, matchesPeopleFilters } from "@/lib/properties/people-filters";

import type { ClosedAs } from "@/features/pipeline/closed-as";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import {
    DEAL_STAGE_ORDER,
    type DealDetail,
    type DealHistoryEntry,
    type DealItem,
    type DealLostReason,
    type DealsFilters,
    type DealsResult,
    type DealsSummary,
    type DealStage,
    type DealStatus,
    isLiveStage,
    type StageCounts,
    STALLED_AFTER_DAYS,
} from "@/features/pipeline/types";

type ApiLead = {
    id: string;
    propertyId: string;
    clientId?: string | null;
    stage?: string | null;
    listPrice?: string | null;
    offerAmount?: string | null;
    offerStatus?: string | null;
    closedAmount?: string | null;
    lostReason?: string | null;
    notes?: string | null;
    stageHistory?: Array<{
        status?: string;
        at?: string;
        note?: string;
        by?: string;
    }> | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    nextVisitAt?: string | null;
    property?:
        | ({
              id: string;
              title?: string | null;
              city?: string | null;
              address?: string | null;
              salePrice?: string | null;
              monthlyRent?: string | null;
              transactionType?: string | null;
              propertyType?: string | null;
              subtype?: string | null;
              bhkConfig?: string | null;
              bedrooms?: number | null;
              areaSqft?: number | null;
              photos?: string[] | null;
              commissionPercent?: string | number | null;
              commissionAmount?: string | number | null;
              exclusiveOwnerId?: string | null;
              isBrokerInventory?: boolean;
              isExclusiveProperty?: boolean;
              /** `available` | `sold` | `unavailable`. */
              status?: string | null;
              /** `published` | `draft`. */
              publishStatus?: string | null;
              ownerType?: string | null;
              ownedByBrokerId?: string | null;
          } & Omit<
              PropertyFilterRecord,
              "commissionPercent" | "commissionAmount" | "salePrice" | "monthlyRent"
          >)
        | null;
    owner?: {
        id: string;
        fullName?: string | null;
        phone?: string | null;
        email?: string | null;
        avatarUrl?: string | null;
        isRepresentationActive?: boolean;
        representationId?: string | null;
        origin?: "platform" | "exclusive";
    } | null;
    exclusiveOwner?: {
        id: string;
        fullName?: string | null;
        phone?: string | null;
        email?: string | null;
        ownerType?: string | null;
        society?: string | null;
        area?: string | null;
        city?: string | null;
        origin?: "exclusive";
    } | null;
    client?: {
        id: string;
        name: string;
        phone?: string;
        email?: string | null;
        budgetMax?: string | null;
        rentBudgetMax?: string | null;
    } | null;
};

type LeadsListResponse = {
    items: ApiLead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

const BHK_CONFIG_TO_NUMBER: Record<string, number> = {
    one_rk: 0,
    one_bhk: 1,
    two_bhk: 2,
    three_bhk: 3,
    four_bhk: 4,
    five_plus_bhk: 5,
};

const DAY_MS = 86_400_000;

/** Shown when a lead has no owner name. Never matched by search. */
const OWNER_PLACEHOLDER = "Owner";

export function daysSince(iso: string | null): number | null {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export function isStalled(deal: DealItem): boolean {
    if (!isLiveStage(deal.status)) return false;
    const since = daysSince(deal.lastContactedAt ?? deal.stageEnteredAt);
    return since != null && since >= STALLED_AFTER_DAYS;
}

export function hasUpcomingVisit(deal: DealItem): boolean {
    if (!deal.nextVisitAt) return false;
    return new Date(deal.nextVisitAt).getTime() >= Date.now();
}

export function isOverBudget(deal: DealItem): boolean {
    if (deal.buyer.budgetMaxInr == null) return false;
    return deal.property.amountInr > deal.buyer.budgetMaxInr;
}

function toNumber(value: string | number | null | undefined): number {
    if (value == null || value === "") return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function titleCase(value: string): string {
    return value
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

/** UI board stage ↔ API lead stage. */
export function toApiStage(status: DealStatus): string {
    switch (status) {
        case "visit":
            return "site_visit";
        case "closed":
            return "closed_won";
        case "lost":
            return "closed_lost";
        default:
            return status;
    }
}

export function fromApiStage(stage: string | null | undefined): DealStatus {
    switch (stage) {
        case "site_visit":
            return "visit";
        case "offer_made":
            return "negotiation";
        case "closed_won":
            return "closed";
        case "closed_lost":
            return "lost";
        case "new":
        case "contacted":
        case "negotiation":
            return stage;
        default:
            return "new";
    }
}

/** History note the API stores when the broker taps "Log call". */
export const CALL_LOGGED_NOTE = "Call logged";

/** API stages a lead can sit in. Any other history status is an event on the current stage. */
const API_STAGES = new Set([
    "new",
    "contacted",
    "site_visit",
    "negotiation",
    "offer_made",
    "closed_won",
    "closed_lost",
]);

/**
 * When the lead entered its current stage, and the last call logged since.
 * Same-stage entries (a logged call, a saved note) and an owner rejecting an
 * offer do not move the lead, so they must not restart the clock.
 */
function stageTimes(lead: ApiLead): { enteredAt: string; lastCallAt: string | null } {
    const history = Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
    let stage: string | null = null;
    let enteredAt: string | null = null;
    let lastCallAt: string | null = null;

    for (const entry of history) {
        const status = entry.status?.trim() ?? "";
        if (API_STAGES.has(status) && status !== stage) {
            stage = status;
            enteredAt = entry.at ?? enteredAt;
            lastCallAt = null;
        } else if (entry.note?.trim() === CALL_LOGGED_NOTE && entry.at) {
            lastCallAt = entry.at;
        }
    }

    return {
        enteredAt: enteredAt ?? lead.updatedAt ?? lead.createdAt ?? "",
        lastCallAt,
    };
}

/** The last live stage recorded before the lead was marked lost. */
function lostFromStage(lead: ApiLead): DealStage | null {
    const history = Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
    let last: DealStage | null = null;
    for (const entry of history) {
        const status = entry.status?.trim() ?? "";
        if (!API_STAGES.has(status)) continue;
        const ui = fromApiStage(status);
        if (ui === "lost") return last;
        if (isLiveStage(ui)) last = ui as DealStage;
    }
    return last;
}

function mapHistory(lead: ApiLead): DealHistoryEntry[] {
    const history = Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
    return history.map((entry) => ({
        status: entry.status?.trim() || "unknown",
        at: entry.at ?? null,
        note: entry.note?.trim() || null,
        by: entry.by?.trim() || null,
    }));
}

function mapLeadToDeal(lead: ApiLead): DealItem | null {
    const property = lead.property;
    const client = lead.client;
    if (!property?.id || !client?.id) return null;

    const rent = toNumber(property.monthlyRent);
    const sale = toNumber(property.salePrice ?? lead.listPrice);
    const isRent =
        property.transactionType === "rent" ||
        (property.transactionType !== "sale" && rent > 0 && sale <= 0);
    const amountInr = isRent ? rent : sale;
    const bhk = property.bhkConfig
        ? (BHK_CONFIG_TO_NUMBER[property.bhkConfig] ?? property.bedrooms ?? 0)
        : (property.bedrooms ?? 0);
    const locality = titleCase(property.address?.trim() || property.city?.trim() || "");
    const city = titleCase(property.city?.trim() || "");
    const typeLabel = titleCase(
        (property.subtype ?? property.propertyType ?? "property").replace(/_/g, " "),
    );
    const configLabel = bhk > 0 ? `${bhk} BHK` : typeLabel;
    const title =
        property.title?.trim() ||
        [configLabel, locality || city].filter(Boolean).join(" · ") ||
        "Property";
    const phoneDigits = digitsOnly(client.phone);
    const normalizedPhone = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;
    const ownerPhone = digitsOnly(lead.owner?.phone ?? lead.exclusiveOwner?.phone);
    const isExclusiveProperty = Boolean(lead.property?.isExclusiveProperty);
    const ownerOrigin: "platform" | "exclusive" =
        lead.owner?.origin === "exclusive" || (!lead.owner && Boolean(lead.exclusiveOwner))
            ? "exclusive"
            : "platform";
    const ownerName =
        lead.owner?.fullName?.trim() || lead.exclusiveOwner?.fullName?.trim() || OWNER_PLACEHOLDER;
    const status = fromApiStage(lead.stage);
    const times = stageTimes(lead);
    // Later note edits must not change the displayed completion/loss date.
    const resolved =
        status === "closed" || status === "lost"
            ? ([...(lead.stageHistory ?? [])]
                  .reverse()
                  .find((entry) => fromApiStage(entry.status) === status && entry.at)?.at ?? null)
            : null;

    return {
        id: lead.id,
        status,
        buyer: {
            id: client.id,
            name: client.name,
            phoneDigits: normalizedPhone,
            budgetMaxInr: (() => {
                const cap = isRent ? client.rentBudgetMax : client.budgetMax;
                return cap != null ? toNumber(cap) : null;
            })(),
        },
        property: {
            filterFacts: {
                ...property,
                bhk,
                amountInr,
                isRent,
                commissionPercent:
                    property.commissionPercent == null
                        ? null
                        : toNumber(property.commissionPercent),
                commissionAmount:
                    property.commissionAmount == null ? null : toNumber(property.commissionAmount),
            },
            id: property.id,
            title,
            configLabel,
            propertyTypeLabel: typeLabel,
            locality: locality || city,
            city,
            areaSqft: property.areaSqft ?? 0,
            bhk,
            amountInr,
            isRent,
            commissionPercent: toNumber(property.commissionPercent),
            commissionAmountInr: toNumber(property.commissionAmount),
            // Empty, never a stock photo. A listing with no photos is a real
            // state the card renders deliberately (docs/DESIGN.md §4.5);
            // substituting someone else's building here would be a lie.
            imageSrc: property.photos?.find(Boolean) ?? "",
            imageSrcs: property.photos?.filter(Boolean) ?? [],
            photoCount: property.photos?.filter(Boolean).length ?? 0,
            isExclusiveProperty,
            isSold: property.status === "sold",
            isDraft: property.publishStatus === "draft",
            // Same test as the API's: a broker-owned listing.
            isBrokerListing:
                (property.ownerType === "broker" && Boolean(property.ownedByBrokerId)) ||
                Boolean(property.isBrokerInventory),
            // The API asks which way a Sale & Rent listing closed.
            ...(property.transactionType === "both"
                ? { saleAndRent: { salePriceInr: sale, monthlyRentInr: rent } }
                : {}),
        },
        owner: {
            id: lead.owner?.id ?? lead.exclusiveOwner?.id ?? property.exclusiveOwnerId ?? undefined,
            name: ownerName,
            avatarUrl: lead.owner?.avatarUrl ?? undefined,
            phoneDigits:
                (lead.owner?.isRepresentationActive || ownerOrigin === "exclusive") && ownerPhone
                    ? ownerPhone.length > 10
                        ? ownerPhone.slice(-10)
                        : ownerPhone
                    : undefined,
            isRepresentationActive:
                ownerOrigin === "exclusive" ? true : Boolean(lead.owner?.isRepresentationActive),
            origin: ownerOrigin,
            representationId:
                ownerOrigin === "platform" ? (lead.owner?.representationId ?? null) : null,
        },
        stageEnteredAt: times.enteredAt,
        lastContactedAt: times.lastCallAt,
        nextVisitAt: lead.nextVisitAt ?? null,
        note: lead.notes?.trim() || "",
        resolvedAt: resolved,
        closedAmountInr:
            status === "closed" && lead.closedAmount != null ? toNumber(lead.closedAmount) : null,
        lostReason: status === "lost" ? lead.lostReason?.trim() || undefined : undefined,
        lostFromStage: status === "lost" ? lostFromStage(lead) : undefined,
        offerAmountInr: lead.offerAmount != null ? toNumber(lead.offerAmount) : null,
        offerStatus:
            lead.offerStatus === "pending" ||
            lead.offerStatus === "accepted" ||
            lead.offerStatus === "rejected"
                ? lead.offerStatus
                : null,
        createdAt: lead.createdAt ?? null,
    };
}

function mapLeadToDetail(lead: ApiLead): DealDetail | null {
    const deal = mapLeadToDeal(lead);
    if (!deal) return null;

    const listFromLead = lead.listPrice != null ? toNumber(lead.listPrice) : 0;
    const listPriceInr = listFromLead > 0 ? listFromLead : deal.property.amountInr || null;

    return {
        ...deal,
        apiStage: lead.stage ?? null,
        listPriceInr,
        createdAt: lead.createdAt ?? null,
        updatedAt: lead.updatedAt ?? null,
        buyerEmail: lead.client?.email?.trim() || null,
        history: mapHistory(lead),
    };
}

/**
 * Search box: client, owner and area (plus property title and client phone).
 * Every word must match some field, so "ravi andheri" narrows to Ravi's deal
 * in Andheri. A phone typed with spaces ("98765 43210") matches on digits.
 */
function matchesQuery(deal: DealItem, q: string): boolean {
    const words = searchWords(q);
    if (words.length === 0) return true;

    // A whole phone number, however it was typed ("+91 98765-43210").
    const phone = deal.buyer.phoneDigits;
    if (phone && /^[\d\s()+-]+$/.test(q.trim())) {
        const digits = digitsOnly(q);
        const local = digits.length > 10 ? digits.slice(-10) : digits;
        if (local.length >= 3 && phone.includes(local)) return true;
    }

    // Punctuation is ignored on both sides, so "Andheri West, Mumbai",
    // "sector 62" and "Sector-62" all find a deal in Sector-62.
    const text = ` ${searchWords(
        [
            deal.buyer.name,
            deal.property.title,
            deal.property.locality,
            deal.property.city,
            deal.owner.name === OWNER_PLACEHOLDER ? "" : deal.owner.name,
        ].join(" "),
    ).join(" ")} ${phone}`;
    return words.every((word) => text.includes(word));
}

/** Lowercase words with punctuation dropped. */
function searchWords(value: string): string[] {
    return value
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);
}

function sortDeals(items: DealItem[], sort: DealsFilters["sort"]): DealItem[] {
    const sorted = [...items];

    switch (sort) {
        case "stalled":
            return sorted.sort(
                (a, b) =>
                    new Date(a.lastContactedAt ?? a.stageEnteredAt).getTime() -
                    new Date(b.lastContactedAt ?? b.stageEnteredAt).getTime(),
            );
        case "price_desc":
            return sorted.sort((a, b) => b.property.amountInr - a.property.amountInr);
        case "price_asc":
            return sorted.sort((a, b) => a.property.amountInr - b.property.amountInr);
        case "visit_soon":
            return sorted.sort((a, b) => {
                const aAt = a.nextVisitAt ? new Date(a.nextVisitAt).getTime() : Infinity;
                const bAt = b.nextVisitAt ? new Date(b.nextVisitAt).getTime() : Infinity;
                if (aAt !== bAt) return aAt - bAt;
                return new Date(b.stageEnteredAt).getTime() - new Date(a.stageEnteredAt).getTime();
            });
        default:
            return sorted.sort(
                (a, b) =>
                    new Date(b.stageEnteredAt).getTime() - new Date(a.stageEnteredAt).getTime(),
            );
    }
}

function buildSummary(all: DealItem[]): DealsSummary {
    const counts = Object.fromEntries(
        DEAL_STAGE_ORDER.map((stage) => [
            stage,
            all.filter((deal) => deal.status === stage).length,
        ]),
    ) as StageCounts;

    const live = all.filter((deal) => isLiveStage(deal.status));
    const closedCount = all.filter((deal) => deal.status === "closed").length;
    const lostCount = all.filter((deal) => deal.status === "lost").length;
    const resolved = closedCount + lostCount;

    return {
        counts,
        liveTotal: live.length,
        stalledCount: live.filter(isStalled).length,
        upcomingVisitCount: live.filter(hasUpcomingVisit).length,
        liveValueInr: live.reduce((sum, deal) => sum + deal.property.amountInr, 0),
        closedCount,
        lostCount,
        winRate: resolved === 0 ? 0 : Math.round((closedCount / resolved) * 100),
    };
}

/** Filter sheet → query params. The API narrows leads by the property on each one. */
function leadFilterParams(filters: DealsFilters): URLSearchParams {
    const params = new URLSearchParams();
    const criteria = normalizePropertyCriteria({
        ...filters.propertyFilters,
        type: filters.dealType || filters.propertyFilters?.type || "",
        where: filters.propertyFilters?.where || filters.locality,
    });
    if (criteria.where) params.set("where", criteria.where);
    appendDealListingQuery(
        params,
        dealListingApiQuery({ type: criteria.type, propertyFilters: criteria }),
    );
    return params;
}

/**
 * Every lead matching the filter sheet. The search box is applied afterwards
 * by `matchesQuery`: the API's `search` skips area and phone, so sending it
 * would drop those matches before the client ever sees them.
 */
async function fetchAllLeads(
    filterParams?: URLSearchParams,
    signal?: AbortSignal,
): Promise<ApiLead[]> {
    const items: ApiLead[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const qs = new URLSearchParams(filterParams);
        qs.set("page", String(page));
        qs.set("limit", "100");
        const response = await apiFetch<LeadsListResponse>(`/clients/leads?${qs}`, { signal });
        items.push(...(response.items ?? []));
        totalPages = Math.max(1, response.totalPages ?? 1);
        page += 1;
    }

    return items;
}

export type SetStageOptions = {
    note?: string;
    lostReason?: DealLostReason;
    closedAmountInr?: number;
    /** How a Sale & Rent listing closed. Required by the API for those listings. */
    closedAs?: ClosedAs;
};

/* ------------------------------------------------------------------------ */
/* Mock mode (NEXT_PUBLIC_USE_MOCK_DATA=true)                                */
/* In-memory copy of MOCK_DEALS so board actions stick until a reload.       */
/* ------------------------------------------------------------------------ */

type MockStore = { deals: DealItem[]; history: Map<string, DealHistoryEntry[]> };

let mockStore: MockStore | null = null;

function getMockStore(): MockStore {
    if (!mockStore) {
        const deals = structuredClone(MOCK_DEALS).map((deal) => ({
            ...deal,
            property: {
                ...deal.property,
                filterFacts: deal.property.filterFacts ?? {
                    locality: deal.property.locality,
                    city: deal.property.city,
                    propertyTypeLabel: deal.property.propertyTypeLabel,
                    areaSqft: deal.property.areaSqft,
                    bhk: deal.property.bhk,
                    amountInr: deal.property.amountInr,
                    isRent: deal.property.isRent,
                    transactionType: deal.property.isRent ? "rent" : "sale",
                    commissionPercent: deal.property.commissionPercent ?? null,
                    commissionAmount: deal.property.commissionAmountInr ?? null,
                },
            },
        }));
        const history = new Map<string, DealHistoryEntry[]>(
            deals.map((deal) => [
                deal.id,
                [
                    {
                        status: toApiStage(deal.status),
                        at: deal.resolvedAt ?? deal.stageEnteredAt,
                        note: deal.note || null,
                        by: null,
                    },
                ],
            ]),
        );
        mockStore = { deals, history };
    }
    return mockStore;
}

function mockFind(dealId: string): DealItem {
    const deal = getMockStore().deals.find((item) => item.id === dealId);
    if (!deal) throw new Error("Deal not found.");
    return deal;
}

function mockPushHistory(dealId: string, entry: Omit<DealHistoryEntry, "at" | "by">) {
    const store = getMockStore();
    const list = store.history.get(dealId) ?? [];
    list.push({ ...entry, at: new Date().toISOString(), by: null });
    store.history.set(dealId, list);
}

function mockList(filters: DealsFilters): DealsResult {
    const criteria = normalizePropertyCriteria({
        ...filters.propertyFilters,
        type: filters.dealType || filters.propertyFilters?.type || "",
        where: filters.propertyFilters?.where || filters.locality,
    });
    const all = getMockStore()
        .deals.filter(
            (deal) =>
                matchesPeopleFilters(deal.owner.id, [deal.buyer], filters) &&
                matchesQuery(deal, filters.q) &&
                (!filters.dealType || (filters.dealType === "rent") === deal.property.isRent) &&
                matchesPropertyCriteria(deal.property.filterFacts ?? {}, criteria),
        )
        .map((deal) => structuredClone(deal));
    const items = filters.stage ? all.filter((deal) => deal.status === filters.stage) : all;
    return { items: sortDeals(items, filters.sort), summary: buildSummary(all) };
}

function mockDetail(dealId: string): DealDetail {
    const deal = structuredClone(mockFind(dealId));
    return {
        ...deal,
        apiStage: toApiStage(deal.status),
        listPriceInr: deal.property.amountInr || null,
        createdAt: deal.createdAt ?? deal.stageEnteredAt,
        updatedAt: new Date().toISOString(),
        buyerEmail: null,
        history: structuredClone(getMockStore().history.get(dealId) ?? []),
    };
}

function mockSetStage(dealId: string, status: DealStatus, options: SetStageOptions = {}) {
    const deal = mockFind(dealId);
    const now = new Date().toISOString();
    // Mock parity: putting the sold deal back on the board makes the property available.
    if (deal.status === "closed" && isLiveStage(status) && deal.property.isSold) {
        for (const other of getMockStore().deals) {
            if (other.property.id === deal.property.id) other.property.isSold = false;
        }
    }
    if (status === "lost" && isLiveStage(deal.status)) deal.lostFromStage = deal.status;
    deal.status = status;
    deal.stageEnteredAt = now;
    deal.lastContactedAt = null;
    deal.resolvedAt = status === "closed" || status === "lost" ? now : null;
    deal.closedAmountInr =
        status === "closed" ? (options.closedAmountInr ?? deal.property.amountInr) : null;
    deal.lostReason = status === "lost" ? options.lostReason : undefined;
    if (status !== "lost") deal.lostFromStage = undefined;
    if (options.note?.trim()) deal.note = options.note.trim();
    mockPushHistory(dealId, { status: toApiStage(status), note: options.note?.trim() || null });
    if (status === "closed") mockCloseProperty(deal);
}

/** Mock parity with the API: a sale closes the property for every other client. */
function mockCloseProperty(sold: DealItem) {
    const now = new Date().toISOString();
    for (const other of getMockStore().deals) {
        if (other.property.id !== sold.property.id) continue;
        other.property.isSold = true;
        if (other.id === sold.id || !isLiveStage(other.status)) continue;
        other.lostFromStage = other.status;
        other.status = "lost";
        other.stageEnteredAt = now;
        other.resolvedAt = now;
        other.closedAmountInr = null;
        // Same as the API: shown as "Bought somewhere else".
        other.lostReason = "bought_elsewhere";
        if (other.offerStatus === "pending") other.offerStatus = "rejected";
        mockPushHistory(other.id, { status: "closed_lost", note: "Sold to another client" });
    }
}

export const pipelineApi = {
    async peopleOptions(signal?: AbortSignal) {
        const deals = isMockMode()
            ? getMockStore().deals
            : (await fetchAllLeads(undefined, signal))
                  .map(mapLeadToDeal)
                  .filter((deal): deal is DealItem => deal != null);
        return collectPeopleFilterOptions(
            deals.map((deal) => ({
                owner: deal.owner.id ? { id: deal.owner.id, name: deal.owner.name } : null,
                clients: [deal.buyer],
            })),
        );
    },
    async list(filters: DealsFilters, signal?: AbortSignal): Promise<DealsResult> {
        if (isMockMode()) return mockList(filters);
        const leads = await fetchAllLeads(leadFilterParams(filters), signal);
        // Stage counts follow the search, as they did when the API filtered it.
        const all = leads
            .map(mapLeadToDeal)
            .filter(
                (deal): deal is DealItem =>
                    deal != null &&
                    matchesQuery(deal, filters.q) &&
                    matchesPeopleFilters(deal.owner.id, [deal.buyer], filters),
            );

        const items = filters.stage ? all.filter((deal) => deal.status === filters.stage) : all;

        return { items: sortDeals(items, filters.sort), summary: buildSummary(all) };
    },

    async get(dealId: string): Promise<DealDetail> {
        if (isMockMode()) return mockDetail(dealId);
        const lead = await apiFetch<ApiLead>(`/clients/leads/${dealId}`);
        const detail = mapLeadToDetail(lead);
        if (!detail) {
            throw new Error("Lead is missing property or client details.");
        }
        return detail;
    },

    async setStage(
        dealId: string,
        status: DealItem["status"],
        options: SetStageOptions = {},
    ): Promise<void> {
        if (isMockMode()) return mockSetStage(dealId, status, options);
        const closedAmount =
            status === "closed" && options.closedAmountInr != null && options.closedAmountInr > 0
                ? Math.round(options.closedAmountInr)
                : null;
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: toApiStage(status),
                ...(options.note?.trim() ? { note: options.note.trim() } : {}),
                ...(closedAmount != null ? { closedAmount } : {}),
                ...(status === "closed" && options.closedAs ? { closedAs: options.closedAs } : {}),
                ...(status === "lost" && options.lostReason
                    ? { lostReason: options.lostReason }
                    : {}),
            }),
        });
    },

    /** Submit or revise an offer — moves the lead to offer_made (negotiation column). */
    async makeOffer(dealId: string, offerAmount: number, notes?: string): Promise<void> {
        if (isMockMode()) {
            const deal = mockFind(dealId);
            if (deal.status !== "negotiation") mockSetStage(dealId, "negotiation", { note: notes });
            deal.offerAmountInr = offerAmount;
            deal.offerStatus = "pending";
            mockPushHistory(dealId, { status: "offer_made", note: notes?.trim() || null });
            return;
        }
        await apiFetch(`/clients/leads/${dealId}/offer`, {
            method: "POST",
            body: JSON.stringify({
                offerAmount,
                ...(notes?.trim() ? { notes: notes.trim() } : {}),
            }),
        });
    },

    /** Same-stage update used to log a call without moving the card. */
    async logContact(dealId: string, _currentStatus: DealStatus, note?: string): Promise<void> {
        if (isMockMode()) {
            const deal = mockFind(dealId);
            deal.lastContactedAt = new Date().toISOString();
            mockPushHistory(dealId, {
                status: toApiStage(deal.status),
                note: note?.trim() || CALL_LOGGED_NOTE,
            });
            return;
        }
        const lead = await apiFetch<ApiLead>(`/clients/leads/${dealId}`);
        if (!lead.stage?.trim())
            throw new Error("Could not verify the current lead stage. Refresh and try again.");
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: lead.stage,
                note: note?.trim() || CALL_LOGGED_NOTE,
            }),
        });
    },

    async setVisit(_dealId: string, _visitAtIso: string | null): Promise<void> {
        // Visits are booked through the slots/showings flow — not editable here yet.
    },

    async setNote(dealId: string, _currentStatus: DealStatus, note: string): Promise<void> {
        if (isMockMode()) {
            const deal = mockFind(dealId);
            deal.note = note.trim();
            mockPushHistory(dealId, { status: toApiStage(deal.status), note: note.trim() });
            return;
        }
        const lead = await apiFetch<ApiLead>(`/clients/leads/${dealId}`);
        if (!lead.stage?.trim())
            throw new Error("Could not verify the current lead stage. Refresh and try again.");
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: lead.stage,
                note: note.trim(),
            }),
        });
    },

    async reopen(dealId: string, stage: DealStage, note?: string): Promise<void> {
        await this.setStage(dealId, stage, { note });
    },
};
