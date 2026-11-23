import type { ReactNode } from "react";

import { formatShowingWhen } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import {
    type AppIcon,
    Award,
    CalendarCheck,
    CircleCheck,
    HandCoins,
    Users,
} from "@/components/shared/icons";

import {
    formatSideAmount,
    offerGapLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import type { PropertyReport } from "@/features/properties/property-analytics/analytics-math";

type Stat = {
    key: string;
    icon: AppIcon;
    label: string;
    value: ReactNode;
    /** True when the value is a real figure, not "None". */
    hasValue: boolean;
    detail: string;
};

function joinParts(parts: [number, string][]): string | null {
    const shown = parts.filter(([count]) => count > 0).map(([count, word]) => `${count} ${word}`);
    return shown.length > 0 ? shown.join(" · ") : null;
}

function outcomeStat(report: PropertyReport): Stat {
    const { counts, closedInr, closedWord, offers, ask } = report;

    if (counts.won > 0) {
        const won = report.clients.find((c) => c.group === "won");
        const side = won?.side ?? "sale";
        const sideAsk = side === "rent" ? ask.rentInr : ask.saleInr;
        const gap =
            closedInr != null && sideAsk != null && counts.won === 1
                ? offerGapLabel({
                      amountInr: closedInr,
                      status: null,
                      side,
                      askInr: sideAsk,
                      gapInr: closedInr - sideAsk,
                      ratio: closedInr / sideAsk,
                  })
                : null;
        return {
            key: "outcome",
            icon: CircleCheck,
            label: `${closedWord} for`,
            value: closedInr != null ? formatSideAmount(closedInr, side) : closedWord,
            hasValue: true,
            detail: gap ?? (won ? `To ${won.name}` : plural(counts.won, "client")),
        };
    }

    const best = offers.best;
    if (best?.offer) {
        return {
            key: "outcome",
            icon: Award,
            label: "Best offer",
            value: formatSideAmount(best.offer.amountInr, best.offer.side),
            hasValue: true,
            detail: offerGapLabel(best.offer) ?? `From ${best.name}`,
        };
    }

    return {
        key: "outcome",
        icon: Award,
        label: "Best offer",
        value: "None",
        hasValue: false,
        detail: "Shows once a client makes an offer",
    };
}

/** Four headline numbers for this listing. Words carry each figure, not colour. */
export function AnalyticsStatStrip({ report, now }: { report: PropertyReport; now: Date }) {
    const { counts, visits, offers, closedWord } = report;

    const stats: Stat[] = [
        {
            key: "clients",
            icon: Users,
            label: "Clients",
            value: counts.total > 0 ? counts.total : "None",
            hasValue: counts.total > 0,
            detail:
                joinParts([
                    [counts.active, "active"],
                    [counts.won, closedWord.toLowerCase()],
                    [counts.lost, "lost"],
                ]) ?? "None added yet",
        },
        {
            key: "visits",
            icon: CalendarCheck,
            label: "Site visits",
            value: visits.total > 0 ? visits.total : "None",
            hasValue: visits.total > 0,
            detail: visits.nextAt
                ? `Next: ${formatShowingWhen(visits.nextAt, now)}`
                : visits.clientsVisited > 0
                  ? `${visits.clientsVisited} of ${plural(counts.total, "client")} booked`
                  : "None booked yet",
        },
        {
            key: "offers",
            icon: HandCoins,
            label: "Offers",
            value: offers.rows.length > 0 ? offers.rows.length : "None",
            hasValue: offers.rows.length > 0,
            detail:
                joinParts([
                    [offers.pending, "waiting"],
                    [offers.accepted, "accepted"],
                    [offers.rejected, "declined"],
                ]) ?? "None yet",
        },
        outcomeStat(report),
    ];

    return (
        <section aria-labelledby="analytics-stats-heading">
            <h2 id="analytics-stats-heading" className="sr-only">
                This listing in numbers
            </h2>
            <ul className="grid grid-cols-2 overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-border-warm/50 lg:grid-cols-4">
                {stats.map((stat) => (
                    <li
                        key={stat.key}
                        className="relative p-2 after:absolute after:inset-y-4 after:inset-e-0 after:bg-border-warm after:inline-px even:after:hidden lg:last:after:hidden lg:even:after:block"
                    >
                        <div className="flex items-center gap-3 rounded-control px-3 py-2.5 block-full min-block-11 min-inline-0">
                            <stat.icon
                                aria-hidden
                                className={cn(
                                    "hidden shrink-0 block-6 inline-6 sm:block",
                                    stat.hasValue ? "text-brand" : "text-ink-muted",
                                )}
                                strokeWidth={1.75}
                            />
                            <div className="flex flex-col gap-1 min-inline-0">
                                <span className="body-sm font-semibold text-ink">{stat.label}</span>
                                <span className="body-sm text-ink-muted">{stat.detail}</span>
                            </div>
                            <span
                                className={cn(
                                    "h3 ms-auto shrink-0 tabular-nums",
                                    stat.hasValue ? "text-ink" : "text-ink-muted",
                                )}
                            >
                                {stat.value}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
