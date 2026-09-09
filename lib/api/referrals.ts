import {
    MOCK_CREDIT_LEDGER,
    MOCK_REFERRAL_CODE,
    MOCK_REFERRALS,
} from "@/features/referrals/mock-referrals";
import { isStaleReferral } from "@/features/referrals/referral-meta";
import {
    type CreditEntry,
    isNudgeable,
    isPendingReferral,
    type ReferralChannel,
    type ReferralEarningsPoint,
    type ReferralInviteDraft,
    type ReferralItem,
    type ReferralsFilters,
    type ReferralsResult,
    type ReferralsSummary,
} from "@/features/referrals/types";

/**
 * Mock referrals API.
 *
 * Same shape as the real endpoint will have, so swapping in `apiClient` later
 * is a change to this file and nothing above it. State is module-level and
 * mutable so an invite sent or a nudge fired survives within a session — a
 * fixture that resets on every refetch makes the optimistic paths untestable.
 *
 * Qualification is not modelled here as something the client can trigger. A
 * referral becomes `qualified` when an owner accepts a request or an owner
 * lists a property — both happen on the other person's account, so the server
 * is the only thing that can move that state. The client only ever reads it.
 */

let referrals: ReferralItem[] = MOCK_REFERRALS.map((referral) => ({ ...referral }));
const ledger: CreditEntry[] = MOCK_CREDIT_LEDGER.map((entry) => ({ ...entry }));

function delay(ms = 220): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso(): string {
    return new Date().toISOString();
}

function matchesQuery(referral: ReferralItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [
        referral.person.name,
        referral.person.phoneDigits,
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

function summarize(all: ReferralItem[], now: Date): ReferralsSummary {
    const invitedCount = all.length;
    const pendingCount = all.filter((item) => isPendingReferral(item.status)).length;
    const joinedCount = all.filter((item) => item.joinedAt !== null).length;
    const qualifiedCount = all.filter((item) => item.status === "qualified").length;
    const emailPendingCount = all.filter((item) => item.status === "joined").length;
    const awaitingApprovalCount = all.filter((item) => item.status === "awaiting_approval").length;
    const expiredCount = all.filter((item) => item.status === "expired").length;
    const needsNudgeCount = all.filter((item) => isStaleReferral(item, now)).length;

    const creditBalance = ledger.reduce((total, entry) => total + entry.amount, 0);
    const creditsEarnedTotal = ledger
        .filter((entry) => entry.amount > 0)
        .reduce((total, entry) => total + entry.amount, 0);
    const creditsSpentTotal = ledger
        .filter((entry) => entry.amount < 0)
        .reduce((total, entry) => total - entry.amount, 0);

    return {
        invitedCount,
        pendingCount,
        joinedCount,
        qualifiedCount,
        emailPendingCount,
        awaitingApprovalCount,
        expiredCount,
        needsNudgeCount,
        creditBalance,
        creditsEarnedTotal,
        creditsSpentTotal,
        // No invites means no rate. Reporting 0% for someone who has never
        // invited anyone reads as a failure they did not earn.
        conversionPct:
            invitedCount === 0 ? null : Math.round((qualifiedCount / invitedCount) * 100),
    };
}

/**
 * Anything the inviter can act on first, then everything else newest-first.
 *
 * The list answers "who do I chase", so a chaseable invite buried under last
 * month's successes cannot be chased. `awaiting_approval` ranks below the
 * nudgeable ones deliberately — it looks urgent and is not actionable.
 */
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

/** Months the chart always shows, however quiet they were. */
const EARNINGS_MONTHS = 6;

/**
 * Credits earned per month over the last six months, oldest first.
 *
 * Empty months are filled in rather than skipped: a chart that omits a month
 * with no earnings silently rescales the gap between the ones either side of
 * it, which makes a quiet spell look like it never happened.
 *
 * Spending is excluded on purpose — this answers "what has referring earned
 * me", and netting a published listing against it would answer neither that
 * nor "what did I spend".
 */
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

export type SendInviteInput = ReferralInviteDraft & { channel: ReferralChannel };

export const referralsApi = {
    async list(filters: ReferralsFilters): Promise<ReferralsResult> {
        await delay();
        const now = new Date();

        const filtered = referrals.filter(
            (referral) =>
                matchesQuery(referral, filters.q) && matchesStatus(referral, filters.status),
        );

        return {
            items: sortReferrals(filtered, now),
            // Ledger is never narrowed by the list filters — it is an account
            // statement, and a statement that hides lines is not one.
            ledger: [...ledger].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
            // Built from every referral, never the filtered list — a chart
            // that moved when a search box was typed into would be lying.
            earnings: buildEarnings(ledger, referrals),
            summary: summarize(referrals, now),
            referralCode: MOCK_REFERRAL_CODE,
        };
    },

    /**
     * Create an invite.
     *
     * Rejects a number already invited rather than silently creating a second
     * row. Two live invites to one person means two nudges landing on the same
     * phone, which is how a referral programme becomes spam.
     */
    async invite(input: SendInviteInput): Promise<ReferralItem> {
        await delay(320);

        const duplicate = referrals.find(
            (referral) =>
                referral.person.phoneDigits === input.phoneDigits && referral.status !== "expired",
        );
        if (duplicate) {
            throw new Error(`You have already invited ${duplicate.person.name}.`);
        }

        const at = nowIso();
        const created: ReferralItem = {
            id: `rf_${Math.random().toString(36).slice(2, 8)}`,
            status: "sent",
            // Unknown until they sign up — one link serves both sides.
            role: null,
            person: {
                id: `rp_${Math.random().toString(36).slice(2, 8)}`,
                name: input.name.trim(),
                phoneDigits: input.phoneDigits,
            },
            channel: input.channel,
            invitedAt: at,
            openedAt: null,
            joinedAt: null,
            verifiedAt: null,
            qualifiedAt: null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
            creditsEarned: 0,
            reminderCount: 0,
            lastRemindedAt: null,
            history: [{ id: `re_${at}`, at, label: "You sent the invite", kind: "sent" }],
        };

        referrals = [created, ...referrals];
        return created;
    },

    /** Nudge one invite. The cooldown and the ceiling are enforced server-side too. */
    async remind(referralId: string): Promise<void> {
        await delay(260);

        const at = nowIso();
        referrals = referrals.map((referral) =>
            referral.id === referralId
                ? {
                      ...referral,
                      reminderCount: referral.reminderCount + 1,
                      lastRemindedAt: at,
                      history: [
                          ...referral.history,
                          {
                              id: `re_${at}`,
                              at,
                              label: `You nudged ${referral.person.name.split(" ")[0]}`,
                              kind: "reminded" as const,
                          },
                      ],
                  }
                : referral,
        );
    },

    /**
     * Withdraw an invite that has not been taken up. Only the invite goes —
     * a person who already joined is not the inviter's to remove.
     */
    async cancel(referralId: string): Promise<void> {
        await delay(260);

        const target = referrals.find((referral) => referral.id === referralId);
        if (target && target.joinedAt !== null) {
            throw new Error("They have already signed up, so this invite cannot be withdrawn.");
        }

        referrals = referrals.filter((referral) => referral.id !== referralId);
    },
};
