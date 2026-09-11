import { apiFetch } from "@/lib/api/client";
import type { InfinitePage } from "@/lib/pagination/infinite-page";

import { isStaleReferral } from "@/features/referrals/referral-meta";
import {
    type CreditEntry,
    type CreditEntryKind,
    isNudgeable,
    isPendingReferral,
    type ReferralCode,
    type ReferralEarningsPoint,
    type ReferralItem,
    type ReferralRole,
    type ReferralsFilters,
    type ReferralsResult,
    type ReferralsSummary,
    type ReferralStatus,
} from "@/features/referrals/types";

/** Backend shapes — read-only. No DB/schema changes from the client. */

export type ReferralOverviewResponse = {
    balance: number;
    listingCost: number;
    referralCode: string;
    inviteUrl: string;
    share?: { whatsappUrl?: string; copyText?: string };
    earnRules?: Array<{ key: string; label: string; credits: number }>;
    history?: ReferralTxnDto[];
};

type ReferralTxnDto = {
    id: string;
    type: string;
    reason?: string | null;
    description?: string | null;
    label?: string | null;
    amount: number;
    date?: string | null;
    createdAt?: string | Date | null;
};

type BackendInviteStatus = "credited" | "awaiting_property" | "awaiting_request" | "email_pending";

export type ReferralInviteDto = {
    id: string;
    referredUserId: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    milestones?: {
        emailVerified: boolean;
        firstProperty: boolean;
        firstRepresentationRequest: boolean;
    };
    status: BackendInviteStatus;
    statusLabel: string;
    nextStep?: string | null;
    creditsEarned: number;
    creditsPending: number;
    joinedAt: string | Date;
    creditedAt: string | Date | null;
};

export type ReferralInvitesResponse = {
    page: number;
    limit: number;
    total: number;
    summary: {
        totalInvites: number;
        credited: number;
        pendingVerification: number;
        awaitingAction?: number;
    };
    items: ReferralInviteDto[];
};

export type ReferralHistoryResponse = {
    page: number;
    limit: number;
    total: number;
    items: ReferralTxnDto[];
};

function toIso(value: string | Date | null | undefined): string | null {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toIsoRequired(value: string | Date | null | undefined, fallback = new Date()): string {
    return toIso(value) ?? fallback.toISOString();
}

/**
 * Map API invite statuses onto the UI state machine.
 *
 * Backend only tracks people who already registered with the code — there is
 * no pre-signup `sent`/`opened` row. Broker reward unlocks on first
 * representation *request*, not owner acceptance.
 */
function mapInviteStatus(invite: ReferralInviteDto): ReferralStatus {
    switch (invite.status) {
        case "credited":
            return "qualified";
        case "email_pending":
            return "joined";
        case "awaiting_property":
        case "awaiting_request":
            return "verified";
        default:
            return "joined";
    }
}

function mapRole(role: string): ReferralRole | null {
    if (role === "broker" || role === "owner") return role;
    return null;
}

function mapTxnKind(reason: string | null | undefined, amount: number): CreditEntryKind {
    if (reason === "listing" || amount < 0) return "listing_published";
    if (reason === "refer_broker" || reason === "refer_owner") return "referral_qualified";
    return "bonus";
}

function mapTxn(txn: ReferralTxnDto): CreditEntry {
    return {
        id: txn.id,
        kind: mapTxnKind(txn.reason, txn.amount),
        amount: txn.amount,
        label: txn.description || txn.label || txn.reason || txn.type,
        at: toIsoRequired(txn.createdAt),
        referralId: null,
    };
}

function buildHistory(invite: ReferralInviteDto): ReferralItem["history"] {
    const events: ReferralItem["history"] = [];
    const joinedAt = toIsoRequired(invite.joinedAt);

    events.push({
        id: `${invite.id}-joined`,
        at: joinedAt,
        label: "Signed up with your code",
        kind: "joined",
    });

    if (invite.emailVerified || invite.milestones?.emailVerified) {
        events.push({
            id: `${invite.id}-verified`,
            at: joinedAt,
            label: "Confirmed their email",
            kind: "verified",
        });
    }

    if (invite.milestones?.firstProperty) {
        events.push({
            id: `${invite.id}-property`,
            at: joinedAt,
            label: "Listed their first property",
            kind: "verified",
        });
    }

    if (invite.milestones?.firstRepresentationRequest) {
        events.push({
            id: `${invite.id}-request`,
            at: joinedAt,
            label: "Requested an owner property",
            kind: "verified",
        });
    }

    if (invite.creditedAt) {
        events.push({
            id: `${invite.id}-credited`,
            at: toIsoRequired(invite.creditedAt),
            label: "Qualified — credits paid",
            kind: "qualified",
        });
    }

    return events;
}

export function mapInviteToReferralItem(invite: ReferralInviteDto): ReferralItem {
    const joinedAt = toIsoRequired(invite.joinedAt);
    const status = mapInviteStatus(invite);
    const role = mapRole(invite.role);

    return {
        id: invite.id,
        status,
        role,
        person: {
            id: invite.referredUserId,
            name: invite.fullName,
            // Phone is not returned by the invites API — show email instead in the row.
            phoneDigits: "",
            email: invite.email,
            avatarUrl: invite.avatarUrl ?? undefined,
        },
        channel: "link",
        invitedAt: joinedAt,
        openedAt: joinedAt,
        joinedAt,
        verifiedAt: invite.emailVerified || invite.milestones?.emailVerified ? joinedAt : null,
        qualifiedAt: invite.creditedAt ? toIsoRequired(invite.creditedAt) : null,
        // Registered invites do not expire on the server.
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60_000).toISOString(),
        creditsEarned: invite.creditsEarned,
        reminderCount: 0,
        lastRemindedAt: null,
        history: buildHistory(invite),
    };
}

function summarizeFromApi(
    invitesSummary: ReferralInvitesResponse["summary"],
    items: ReferralItem[],
    ledger: CreditEntry[],
    balance: number,
    now: Date,
): ReferralsSummary {
    const invitedCount = invitesSummary.totalInvites;
    const qualifiedCount = invitesSummary.credited;
    const emailPendingCount = invitesSummary.pendingVerification;
    const awaitingAction = invitesSummary.awaitingAction ?? 0;
    const pendingCount = emailPendingCount + awaitingAction;

    const creditsEarnedTotal = ledger
        .filter((entry) => entry.amount > 0)
        .reduce((total, entry) => total + entry.amount, 0);
    const creditsSpentTotal = ledger
        .filter((entry) => entry.amount < 0)
        .reduce((total, entry) => total - entry.amount, 0);

    return {
        invitedCount,
        pendingCount,
        joinedCount: invitedCount,
        qualifiedCount,
        emailPendingCount,
        awaitingApprovalCount: 0,
        expiredCount: 0,
        needsNudgeCount: items.filter((item) => isStaleReferral(item, now)).length,
        creditBalance: balance,
        creditsEarnedTotal,
        creditsSpentTotal,
        conversionPct:
            invitedCount === 0 ? null : Math.round((qualifiedCount / invitedCount) * 100),
    };
}

const EARNINGS_MONTHS = 6;

function buildEarnings(entries: CreditEntry[], qualified: ReferralItem[]): ReferralEarningsPoint[] {
    const now = new Date();
    const points: ReferralEarningsPoint[] = [];

    for (let offset = EARNINGS_MONTHS - 1; offset >= 0; offset -= 1) {
        const cursor = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

        const credits = entries
            .filter((entry) => entry.amount > 0 && entry.at.startsWith(month))
            .reduce((total, entry) => total + entry.amount, 0);

        const qualifiedCount = qualified.filter(
            (item) => item.qualifiedAt?.startsWith(month) ?? false,
        ).length;

        points.push({
            month,
            label: cursor.toLocaleDateString("en-IN", { month: "short" }),
            credits,
            qualifiedCount,
        });
    }

    return points;
}

function matchesQuery(referral: ReferralItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [
        referral.person.name,
        referral.person.email ?? "",
        referral.person.agencyName ?? "",
        referral.person.city ?? "",
    ].some((field) => field.toLowerCase().includes(needle));
}

function matchesStatus(referral: ReferralItem, filter: ReferralsFilters["status"]): boolean {
    if (filter === "all") return true;
    if (filter === "pending") return isPendingReferral(referral.status);
    return referral.status === filter;
}

function sortReferrals(items: ReferralItem[], now: Date): ReferralItem[] {
    const rank = (item: ReferralItem): number => {
        if (isStaleReferral(item, now)) return 0;
        if (isNudgeable(item.status)) return 1;
        if (item.status === "awaiting_approval") return 2;
        if (item.status === "qualified") return 3;
        return 4;
    };

    return [...items].sort((a, b) => {
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
    });
}

export function filterAndSortReferrals(
    items: ReferralItem[],
    filters: ReferralsFilters,
    now: Date,
): ReferralItem[] {
    return sortReferrals(
        items.filter(
            (referral) =>
                matchesQuery(referral, filters.q) && matchesStatus(referral, filters.status),
        ),
        now,
    );
}

export type ReferralItemsPage = InfinitePage<ReferralItem> & {
    summary: ReferralInvitesResponse["summary"];
};

export function buildReferralPresentation(
    overview: ReferralOverviewResponse,
    invitesSummary: ReferralInvitesResponse["summary"],
    items: ReferralItem[],
    ledger: CreditEntry[],
    now: Date,
) {
    return {
        referralCode: {
            code: overview.referralCode,
            shareUrl: overview.inviteUrl,
        } satisfies ReferralCode,
        earnings: buildEarnings(ledger, items),
        summary: summarizeFromApi(invitesSummary, items, ledger, overview.balance, now),
    };
}

export const referralsApi = {
    overview(signal?: AbortSignal) {
        return apiFetch<ReferralOverviewResponse>("/referrals", { signal });
    },

    invites(page = 1, limit = 50, signal?: AbortSignal) {
        return apiFetch<ReferralInvitesResponse>(`/referrals/invites?page=${page}&limit=${limit}`, {
            signal,
        });
    },

    history(page = 1, limit = 50, signal?: AbortSignal) {
        return apiFetch<ReferralHistoryResponse>(`/referrals/history?page=${page}&limit=${limit}`, {
            signal,
        });
    },

    async listInvitesPage(cursor: string | null, signal?: AbortSignal): Promise<ReferralItemsPage> {
        const page = cursor ? Number(cursor) || 1 : 1;
        const limit = 50;
        const response = await this.invites(page, limit, signal);

        return {
            items: response.items.map(mapInviteToReferralItem),
            total: response.total,
            nextCursor: page * response.limit < response.total ? String(page + 1) : null,
            summary: response.summary,
        };
    },

    async listHistoryPage(
        cursor: string | null,
        signal?: AbortSignal,
    ): Promise<InfinitePage<CreditEntry>> {
        const page = cursor ? Number(cursor) || 1 : 1;
        const limit = 50;
        const response = await this.history(page, limit, signal);

        return {
            items: response.items
                .map(mapTxn)
                .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
            total: response.total,
            nextCursor: page * response.limit < response.total ? String(page + 1) : null,
        };
    },

    /**
     * Load overview + invites + ledger, then shape them for the referrals page.
     * Filters are applied client-side — the backend list endpoints are paginated
     * only and do not accept search/status query params.
     */
    async list(filters: ReferralsFilters): Promise<ReferralsResult> {
        const [overview, invites, history] = await Promise.all([
            this.overview(),
            this.invites(1, 100),
            this.history(1, 100),
        ]);

        const now = new Date();
        const allItems = invites.items.map(mapInviteToReferralItem);
        const ledger = history.items
            .map(mapTxn)
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        const filtered = filterAndSortReferrals(allItems, filters, now);

        const referralCode: ReferralCode = {
            code: overview.referralCode,
            shareUrl: overview.inviteUrl,
        };

        return {
            items: filtered,
            ledger,
            earnings: buildEarnings(ledger, allItems),
            summary: summarizeFromApi(invites.summary, allItems, ledger, overview.balance, now),
            referralCode,
        };
    },
};
