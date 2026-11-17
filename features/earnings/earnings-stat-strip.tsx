import type { ReactNode } from "react";

import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { type AppIcon, Award, CircleCheck, Hourglass, LostIcon } from "@/components/shared/icons";

import { CountDelta } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";

type StatItem = {
    key: string;
    icon: AppIcon;
    label: string;
    value: ReactNode;
    valueClass: string;
    iconClass: string;
    detail: ReactNode;
};

/**
 * Four deal outcomes for the period — same strip anatomy as the broker
 * dashboard work overview: icon + label/detail on the left, figure on the right.
 */
export function EarningsStatStrip({ report }: { report: EarningsReport }) {
    const resolved = report.closedCount + report.lostCount;

    const stats: StatItem[] = [
        {
            key: "sold",
            icon: CircleCheck,
            label: "Sold",
            value: report.closedCount > 0 ? report.closedCount : "None",
            valueClass: report.closedCount > 0 ? "text-brand" : "text-ink-muted",
            iconClass: report.closedCount > 0 ? "text-brand" : "text-ink-muted",
            detail: (
                <>
                    <span>
                        {report.closedCount > 0
                            ? `${plural(report.saleClosedCount, "sale")} · ${plural(report.rentClosedCount, "rental")}`
                            : "None in this period"}
                    </span>
                    <CountDelta
                        current={report.closedCount}
                        previous={report.previousClosedCount}
                    />
                </>
            ),
        },
        {
            key: "lost",
            icon: LostIcon,
            label: "Lost",
            value: report.lostCount > 0 ? report.lostCount : "None",
            valueClass: report.lostCount > 0 ? "text-ink" : "text-ink-muted",
            iconClass: "text-ink-muted",
            detail: (
                <>
                    <span>
                        {report.lostCount > 0
                            ? "Clients who did not go ahead"
                            : "None in this period"}
                    </span>
                    <CountDelta
                        invert
                        current={report.lostCount}
                        previous={report.previousLostCount}
                    />
                </>
            ),
        },
        {
            key: "win-rate",
            icon: Award,
            label: "Win rate",
            value: report.winRate == null ? "Not yet" : `${report.winRate}%`,
            valueClass: report.winRate == null ? "text-ink-muted" : "text-brand",
            iconClass: report.winRate == null ? "text-ink-muted" : "text-brand",
            detail:
                resolved > 0
                    ? `${report.closedCount} of ${plural(resolved, "finished deal")} sold`
                    : "Shows once a deal is sold or lost",
        },
        {
            key: "time-to-sell",
            icon: Hourglass,
            label: "Time to sell",
            value: report.avgDaysToClose == null ? "Not yet" : plural(report.avgDaysToClose, "day"),
            valueClass: report.avgDaysToClose == null ? "text-ink-muted" : "text-ink",
            iconClass: "text-ink-muted",
            detail:
                report.avgDaysToClose == null
                    ? "Shows once a deal is sold"
                    : "Average, from new client to sold",
        },
    ];

    return (
        <section aria-labelledby="earnings-stats-heading">
            <h2 id="earnings-stats-heading" className="sr-only">
                Deals in this period
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
                                className={cn("shrink-0 block-6 inline-6", stat.iconClass)}
                                strokeWidth={1.75}
                            />
                            <div className="flex flex-col gap-1 min-inline-0">
                                <span className="body-sm font-semibold text-ink">{stat.label}</span>
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink-muted">
                                    {stat.detail}
                                </span>
                            </div>
                            <span
                                className={cn("h3 ms-auto shrink-0 tabular-nums", stat.valueClass)}
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
