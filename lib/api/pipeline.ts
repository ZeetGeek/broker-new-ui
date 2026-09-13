import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

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
    property?: {
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
    } | null;
    owner?: {
        id: string;
        fullName?: string | null;
        phone?: string | null;
        avatarUrl?: string | null;
        isRepresentationActive?: boolean;
    } | null;
    client?: {
        id: string;
        name: string;
        phone?: string;
        email?: string | null;
        budgetMax?: string | null;
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

let mockDeals: DealItem[] = MOCK_DEALS.map((deal) => ({
    ...deal,
    buyer: { ...deal.buyer },
    property: { ...deal.property },
    owner: { ...deal.owner },
}));

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

function stageEnteredAt(lead: ApiLead): string {
    const history = Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
    const last = [...history].reverse().find((entry) => entry.at);
    return last?.at ?? lead.updatedAt ?? lead.createdAt ?? new Date().toISOString();
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
    const city = titleCase(property.city?.trim() || "City");
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
    const ownerPhone = digitsOnly(lead.owner?.phone);
    const status = fromApiStage(lead.stage);
    const resolved =
        status === "closed" || status === "lost"
            ? (lead.updatedAt ?? lead.createdAt ?? null)
            : null;

    return {
        id: lead.id,
        status,
        buyer: {
            id: client.id,
            name: client.name,
            phoneDigits: normalizedPhone,
            budgetMaxInr: client.budgetMax != null ? toNumber(client.budgetMax) : null,
        },
        property: {
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
            imageSrc: property.photos?.find(Boolean) || "/properties/1.jpg",
        },
        owner: {
            name: lead.owner?.fullName?.trim() || "Owner",
            avatarUrl: lead.owner?.avatarUrl ?? undefined,
            phoneDigits:
                lead.owner?.isRepresentationActive && ownerPhone
                    ? ownerPhone.length > 10
                        ? ownerPhone.slice(-10)
                        : ownerPhone
                    : undefined,
            isRepresentationActive: Boolean(lead.owner?.isRepresentationActive),
        },
        stageEnteredAt: stageEnteredAt(lead),
        lastContactedAt: lead.updatedAt ?? null,
        nextVisitAt: lead.nextVisitAt ?? null,
        note: lead.notes?.trim() || "",
        resolvedAt: resolved,
        closedAmountInr:
            status === "closed"
                ? toNumber(lead.closedAmount ?? lead.offerAmount) || amountInr
                : null,
        lostReason: status === "lost" ? undefined : undefined,
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

function matchesQuery(deal: DealItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [
        deal.buyer.name,
        deal.buyer.phoneDigits,
        deal.property.title,
        deal.property.locality,
        deal.property.city,
        deal.owner.name,
    ].some((field) => field.toLowerCase().includes(needle));
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

async function fetchAllLeads(search?: string): Promise<ApiLead[]> {
    const items: ApiLead[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const qs = new URLSearchParams({
            page: String(page),
            limit: "100",
        });
        if (search?.trim()) qs.set("search", search.trim());
        const response = await apiFetch<LeadsListResponse>(`/clients/leads?${qs}`);
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
};

export const pipelineApi = {
    async list(filters: DealsFilters): Promise<DealsResult> {
        if (isMockMode()) {
            const all = mockDeals;
            let items = filters.q.trim() ? all.filter((deal) => matchesQuery(deal, filters.q)) : all;
            if (filters.stage) {
                items = items.filter((deal) => deal.status === filters.stage);
            }
            return { items: sortDeals(items, filters.sort), summary: buildSummary(all) };
        }
        const leads = await fetchAllLeads(filters.q || undefined);
        const all = leads.map(mapLeadToDeal).filter((deal): deal is DealItem => deal != null);

        let items = filters.q.trim() ? all.filter((deal) => matchesQuery(deal, filters.q)) : all;
        if (filters.stage) {
            items = items.filter((deal) => deal.status === filters.stage);
        }

        return { items: sortDeals(items, filters.sort), summary: buildSummary(all) };
    },

    async get(dealId: string): Promise<DealDetail> {
        if (isMockMode()) {
            const deal = mockDeals.find((item) => item.id === dealId);
            if (!deal) {
                throw new Error("Lead is missing property or buyer details.");
            }
            return {
                ...deal,
                apiStage: deal.status,
                listPriceInr: deal.property.amountInr,
                createdAt: deal.stageEnteredAt,
                updatedAt: deal.lastContactedAt,
                buyerEmail: null,
                history: [
                    {
                        status: deal.status,
                        at: deal.stageEnteredAt,
                        note: deal.note || null,
                        by: null,
                    },
                ],
            };
        }
        const lead = await apiFetch<ApiLead>(`/clients/leads/${dealId}`);
        const detail = mapLeadToDetail(lead);
        if (!detail) {
            throw new Error("Lead is missing property or buyer details.");
        }
        return detail;
    },

    async setStage(
        dealId: string,
        status: DealItem["status"],
        options: SetStageOptions = {},
    ): Promise<void> {
        if (isMockMode()) {
            mockDeals = mockDeals.map((deal) =>
                deal.id === dealId
                    ? {
                          ...deal,
                          status,
                          stageEnteredAt: new Date().toISOString(),
                          note: options.note?.trim() || deal.note,
                          lostReason: options.lostReason ?? deal.lostReason,
                          closedAmountInr: options.closedAmountInr ?? deal.closedAmountInr,
                          resolvedAt:
                              status === "closed" || status === "lost"
                                  ? new Date().toISOString()
                                  : deal.resolvedAt,
                      }
                    : deal,
            );
            return;
        }
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: toApiStage(status),
                ...(options.note?.trim() ? { note: options.note.trim() } : {}),
            }),
        });
    },

    /** Submit or revise an offer — moves the lead to offer_made (negotiation column). */
    async makeOffer(dealId: string, offerAmount: number, notes?: string): Promise<void> {
        if (isMockMode()) {
            mockDeals = mockDeals.map((deal) =>
                deal.id === dealId
                    ? {
                          ...deal,
                          status: "negotiation",
                          offerAmountInr: offerAmount,
                          offerStatus: "pending",
                          note: notes?.trim() || deal.note,
                          stageEnteredAt: new Date().toISOString(),
                      }
                    : deal,
            );
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
    async logContact(dealId: string, currentStatus: DealStatus, note?: string): Promise<void> {
        if (isMockMode()) {
            mockDeals = mockDeals.map((deal) =>
                deal.id === dealId
                    ? {
                          ...deal,
                          lastContactedAt: new Date().toISOString(),
                          note: note?.trim() || deal.note,
                      }
                    : deal,
            );
            return;
        }
        const status = isLiveStage(currentStatus) ? currentStatus : "contacted";
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: toApiStage(status),
                note: note?.trim() || "Call logged",
            }),
        });
    },

    async setVisit(_dealId: string, _visitAtIso: string | null): Promise<void> {
        // Visits are booked through the slots/showings flow — not editable here yet.
    },

    async setNote(dealId: string, currentStatus: DealStatus, note: string): Promise<void> {
        if (isMockMode()) {
            mockDeals = mockDeals.map((deal) =>
                deal.id === dealId ? { ...deal, note: note.trim() } : deal,
            );
            return;
        }
        const status = isLiveStage(currentStatus) ? currentStatus : "contacted";
        await apiFetch(`/clients/leads/${dealId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status: toApiStage(status),
                note: note.trim(),
            }),
        });
    },

    async reopen(dealId: string, stage: DealStage, note?: string): Promise<void> {
        await this.setStage(dealId, stage, { note });
    },
};
