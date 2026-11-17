import type { ReactNode } from "react";

import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { type AppIcon, Award, CircleCheck, Hourglass, LostIcon } from "@/components/shared/icons";

import { CountDelta } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { VIZ, VIZ_CLASS } from "@/features/earnings/earnings-viz";

/** Win rate as a small ring. Decorative: the number beside it carries the value. */
function WinRing({ percent }: { percent: number }) {
    const r = 15;
    const c = 2 * Math.PI * r;
    return (
        <svg
            aria-hidden
            viewBox="0 0 40 40"
            className="ms-auto shrink-0 -rotate-90 block-10 inline-10"
        >
            <circle
                cx="20"
                cy="20"
                r={r}
                fill="none"
                strokeWidth="5"
                stroke={VIZ.pipeline}
                strokeOpacity={0.14}
            />
            <circle
                cx="20"
                cy="20"
                r={r}
                fill="none"
                strokeWidth="5"
                stroke={VIZ.pipeline}
                strokeLinecap="round"
                strokeDasharray={`${(percent / 100) * c} ${c}`}
            />
        </svg>
    );
}

function Stat({
    icon: Icon,
    iconClass,
    label,
    value,
    valueClass,
    aside,
    detail,
}: {
    icon: AppIcon;
    iconClass: string;
    label: string;
    value: ReactNode;
    valueClass?: string;
    aside?: ReactNode;
    detail: ReactNode;
}) {
    return (
        <li
            className="
              flex flex-col gap-3 p-4 min-inline-0
              odd:border-e odd:border-border-warm
              nth-[n+3]:border-bs nth-[n+3]:border-border-warm
              sm:p-5
              lg:border-e lg:last:border-e-0 lg:nth-[n+3]:border-bs-0
            "
        >
            <p className="body-sm flex items-center gap-2 font-medium text-ink-muted">
                <span
                    aria-hidden
                    className={cn(
                        "flex shrink-0 items-center justify-center rounded-inner block-7 inline-7",
                        iconClass,
                    )}
                >
                    <Icon className="block-4 inline-4" />
                </span>
                {label}
            </p>
            <div className="flex items-center gap-2.5">
                <p className={cn("h3 tabular-nums", valueClass ?? "text-ink")}>{value}</p>
                {aside}
            </div>
            <div className="body-xs flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
                {detail}
            </div>
        </li>
    );
}

/** Four deal outcomes for the period, in one strip like the dashboard's. */
export function EarningsStatStrip({ report }: { report: EarningsReport }) {
    const resolved = report.closedCount + report.lostCount;

    return (
        <section aria-labelledby="earnings-stats-heading">
            <h2 id="earnings-stats-heading" className="sr-only">
                Deals in this period
            </h2>
            <ul className="grid grid-cols-2 overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-border-warm/50 lg:grid-cols-4">
                <Stat
                    icon={CircleCheck}
                    iconClass={VIZ_CLASS.sold.soft}
                    label="Sold"
                    value={report.closedCount > 0 ? report.closedCount : "None"}
                    valueClass={report.closedCount > 0 ? "text-chart-4" : "text-ink-muted"}
                    aside={
                        <CountDelta
                            current={report.closedCount}
                            previous={report.previousClosedCount}
                        />
                    }
                    detail={
                        report.closedCount > 0
                            ? `${plural(report.saleClosedCount, "sale")} · ${plural(report.rentClosedCount, "rental")}`
                            : "None in this period"
                    }
                />
                <Stat
                    icon={LostIcon}
                    iconClass={VIZ_CLASS.lost.soft}
                    label="Lost"
                    value={report.lostCount > 0 ? report.lostCount : "None"}
                    valueClass={report.lostCount > 0 ? "text-ink" : "text-ink-muted"}
                    aside={
                        <CountDelta
                            invert
                            current={report.lostCount}
                            previous={report.previousLostCount}
                        />
                    }
                    detail={
                        report.lostCount > 0
                            ? "Clients who did not go ahead"
                            : "None in this period"
                    }
                />
                <Stat
                    icon={Award}
                    iconClass={VIZ_CLASS.pipeline.soft}
                    label="Win rate"
                    value={report.winRate == null ? "Not yet" : `${report.winRate}%`}
                    valueClass={report.winRate == null ? "text-ink-muted" : "text-chart-2"}
                    aside={report.winRate == null ? null : <WinRing percent={report.winRate} />}
                    detail={
                        resolved > 0
                            ? `${report.closedCount} of ${plural(resolved, "finished deal")} sold`
                            : "Shows once a deal is sold or lost"
                    }
                />
                <Stat
                    icon={Hourglass}
                    iconClass="bg-surface-muted text-ink-muted"
                    label="Time to sell"
                    value={
                        report.avgDaysToClose == null
                            ? "Not yet"
                            : plural(report.avgDaysToClose, "day")
                    }
                    valueClass={report.avgDaysToClose == null ? "text-ink-muted" : "text-ink"}
                    detail={
                        report.avgDaysToClose == null
                            ? "Shows once a deal is sold"
                            : "Average, from new client to sold"
                    }
                />
            </ul>
        </section>
    );
}
