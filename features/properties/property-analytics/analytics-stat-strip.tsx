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

import styles from "./analytics.module.css";

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
        value: "—",
        hasValue: false,
        detail: "No offers yet",
    };
}

/** Four headline numbers for this listing. Words carry each figure, not colour. */
export function AnalyticsStatStrip({
    report,
    now,
    clientDetail,
}: {
    report: PropertyReport;
    now: Date;
    clientDetail: string;
}) {
    const { counts, visits, offers } = report;

    const stats: Stat[] = [
        {
            key: "clients",
            icon: Users,
            label: "Clients",
            value: counts.total,
            hasValue: counts.total > 0,
            detail: clientDetail || "No clients yet",
        },
        {
            key: "visits",
            icon: CalendarCheck,
            label: "Site visits",
            value: visits.total,
            hasValue: visits.total > 0,
            detail: visits.nextAt
                ? `Next: ${formatShowingWhen(visits.nextAt, now)}`
                : visits.clientsVisited > 0
                  ? `${visits.clientsVisited} of ${plural(counts.total, "client")} booked`
                  : "No visits booked",
        },
        {
            key: "offers",
            icon: HandCoins,
            label: "Offers",
            value: offers.rows.length,
            hasValue: offers.rows.length > 0,
            detail:
                joinParts([
                    [offers.pending, "waiting"],
                    [offers.accepted, "accepted"],
                    [offers.rejected, "declined"],
                ]) ?? "No offers yet",
        },
        outcomeStat(report),
    ];

    return (
        <section aria-labelledby="analytics-stats-heading">
            <h2 id="analytics-stats-heading" className="sr-only">
                This listing in numbers
            </h2>
            <ul className={styles.stats}>
                {stats.map((stat) => (
                    <li key={stat.key} className={styles.stat}>
                        <span className="body-sm font-semibold text-ink">{stat.label}</span>
                        <stat.icon
                            aria-hidden
                            className={cn(styles.statIcon, "block-5 inline-5")}
                            strokeWidth={1.75}
                        />
                        <span
                            className={cn(
                                styles.statValue,
                                "h3 tabular-nums",
                                stat.hasValue ? "text-ink" : "text-ink-muted",
                            )}
                        >
                            {stat.value}
                        </span>
                        <span className={cn(styles.statDetail, "body-sm text-ink-muted")}>
                            {stat.detail}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
