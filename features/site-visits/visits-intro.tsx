import type { VisitsSummary, VisitViewer } from "@/features/site-visits/types";

type VisitsIntroProps = {
    summary: VisitsSummary | null;
    viewer: VisitViewer;
    isLoading: boolean;
};

/** `1 visit` / `3 visits`. */
function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : pluralWord}`;
}

/**
 * The two-tone headline every top-level screen opens with (docs/DESIGN.md
 * §2.3).
 *
 * The second clause is chosen by urgency rather than by a fixed metric: what
 * the user needs to know first is different on a day with three confirmed
 * visits than on a day when two owners are waiting on a reply. That makes the
 * headline the whole attention layer — the "Needs you" filter chip below is
 * where the user acts on it, so no separate callout card is needed.
 */
function headlineClauses(
    summary: VisitsSummary,
    viewer: VisitViewer,
): { fact: string; meaning: string } {
    if (summary.todayCount > 0) {
        return {
            fact: `${plural(summary.todayCount, "visit")} today.`,
            meaning:
                summary.needsActionCount > 0
                    ? `${summary.needsActionCount} waiting on you.`
                    : `${plural(summary.upcomingCount, "visit")} booked ahead.`,
        };
    }

    if (summary.needsActionCount > 0) {
        return {
            fact: `${plural(summary.needsActionCount, "visit")} waiting on you.`,
            meaning:
                viewer === "owner"
                    ? "Brokers want to bring buyers round."
                    : "Owners have replied and need an answer.",
        };
    }

    if (summary.upcomingCount > 0) {
        return {
            fact: `${plural(summary.upcomingCount, "visit")} coming up.`,
            meaning: "Nothing needs your attention right now.",
        };
    }

    return {
        fact: "No visits booked.",
        meaning:
            viewer === "broker"
                ? "Pick a property and propose a time."
                : "Brokers will ask when they have a buyer.",
    };
}

export function VisitsIntro({ summary, viewer, isLoading }: VisitsIntroProps) {
    if (!summary) {
        return (
            <div className="flex flex-col gap-2" aria-hidden={isLoading}>
                <span className="animate-pulse rounded-sm bg-surface-muted block-8 inline-72" />
                <span className="animate-pulse rounded-sm bg-surface-muted block-5 inline-56" />
            </div>
        );
    }

    const { fact, meaning } = headlineClauses(summary, viewer);

    return (
        <h1 className="h1">
            <span className="text-ink">{fact}</span>{" "}
            <span className="text-ink-muted">{meaning}</span>
        </h1>
    );
}
