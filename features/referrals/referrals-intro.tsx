import type { ReferralsSummary } from "@/features/referrals/types";

type ReferralsIntroProps = {
    summary: ReferralsSummary | null;
    isLoading: boolean;
};

/** `1 invite` / `3 invites`. */
function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : pluralWord}`;
}

/**
 * The two-tone headline (docs/DESIGN.md §2.3), picked by what most deserves
 * the broker's attention rather than by a fixed metric.
 *
 * Order of precedence is the order of usefulness: an invite gone quiet is
 * something to do now; an owner deciding is worth knowing about but is nobody's
 * to chase; qualified people are the proof the programme pays. Never a
 * standalone zero (docs/EMPTY_STATES.md) — the no-invites case says what this
 * page is for instead of counting nothing.
 */
function headlineClauses(summary: ReferralsSummary): { fact: string; meaning: string } {
    if (summary.invitedCount === 0) {
        return {
            fact: "No one invited yet.",
            meaning: "Share your code and earn credits when they start using the platform.",
        };
    }

    if (summary.needsNudgeCount > 0) {
        return {
            fact: `${plural(summary.needsNudgeCount, "invite")} gone quiet.`,
            meaning: "A nudge takes a second and usually does the job.",
        };
    }

    if (summary.awaitingApprovalCount > 0) {
        return {
            fact: `${plural(summary.awaitingApprovalCount, "invite")} with an owner.`,
            meaning: "Your credits land as soon as the owner accepts.",
        };
    }

    if (summary.qualifiedCount > 0) {
        return {
            fact: `${plural(summary.qualifiedCount, "person", "people")} qualified.`,
            meaning:
                summary.pendingCount > 0
                    ? `${plural(summary.pendingCount, "invite")} still in flight.`
                    : `${summary.creditBalance} credits to spend.`,
        };
    }

    if (summary.pendingCount > 0) {
        return {
            fact: `${plural(summary.pendingCount, "invite")} in flight.`,
            meaning: "Credits land when one of them finishes signing up.",
        };
    }

    return {
        fact: "No invites live right now.",
        meaning: "Every one you sent has run its course. Send a fresh one.",
    };
}

export function ReferralsIntro({ summary, isLoading }: ReferralsIntroProps) {
    if (!summary) {
        return (
            <div className="flex flex-col gap-2" aria-hidden={isLoading}>
                <span className="animate-pulse rounded-full bg-surface-muted block-8 inline-72" />
                <span className="animate-pulse rounded-full bg-surface-muted block-5 inline-56" />
            </div>
        );
    }

    const { fact, meaning } = headlineClauses(summary);

    return (
        <h1 className="h1">
            <span className="text-ink">{fact}</span>{" "}
            <span className="text-ink-muted">{meaning}</span>
        </h1>
    );
}
