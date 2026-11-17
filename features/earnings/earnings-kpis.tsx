import type { ReactNode } from "react";

import { formatCommission } from "@/lib/format/commission";
import { cn } from "@/lib/utils";

import { type AppIcon, Award, CircleCheck, LostIcon, Wallet } from "@/components/shared/icons";

import { DeltaPill } from "@/features/earnings/earnings-card";
import { type EarningsReport, percentChange } from "@/features/earnings/earnings-math";

function Kpi({
    icon: Icon,
    iconClass,
    label,
    value,
    detail,
    footer,
    emphasis = false,
}: {
    icon: AppIcon;
    iconClass: string;
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    footer?: ReactNode;
    emphasis?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-card border p-5 shadow-sm min-inline-0",
                emphasis ? "border-brand/25 bg-brand-soft/60" : "border-border-warm bg-surface",
            )}
        >
            <dt className="body-sm flex items-center gap-2 font-medium text-ink-muted">
                <span
                    aria-hidden
                    className={cn(
                        "flex shrink-0 items-center justify-center rounded-full block-8 inline-8",
                        iconClass,
                    )}
                >
                    <Icon className="block-4 inline-4" />
                </span>
                {label}
            </dt>
            <dd className="flex flex-col gap-1.5">
                <span className={cn("h3 tabular-nums", emphasis ? "text-brand-text" : "text-ink")}>
                    {value}
                </span>
                {detail ? <span className="body-sm text-ink-muted">{detail}</span> : null}
                {footer}
            </dd>
        </div>
    );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function EarningsKpis({ report }: { report: EarningsReport }) {
    const resolved = report.closedCount + report.lostCount;

    return (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
                emphasis
                icon={Wallet}
                iconClass="bg-brand text-surface"
                label="Estimated earnings"
                value={report.earnedInr > 0 ? formatCommission(report.earnedInr) : "Nothing yet"}
                detail={
                    report.unvaluedClosedCount > 0
                        ? `${plural(report.unvaluedClosedCount, "sold deal")} had no commission set and ${report.unvaluedClosedCount === 1 ? "is" : "are"} not counted`
                        : "Commission on deals you sold in this period"
                }
                footer={
                    <DeltaPill
                        percent={percentChange(report.earnedInr, report.previousEarnedInr)}
                    />
                }
            />
            <Kpi
                icon={CircleCheck}
                iconClass="bg-success-soft text-success"
                label="Deals sold"
                value={report.closedCount > 0 ? report.closedCount : "None yet"}
                detail={
                    report.closedCount > 0
                        ? `${plural(report.saleClosedCount, "sale")} · ${plural(report.rentClosedCount, "rental")}`
                        : "Deals you mark as sold show here"
                }
                footer={
                    <DeltaPill
                        percent={percentChange(report.closedCount, report.previousClosedCount)}
                    />
                }
            />
            <Kpi
                icon={LostIcon}
                iconClass="bg-danger-soft text-danger"
                label="Deals lost"
                value={report.lostCount > 0 ? report.lostCount : "None"}
                detail={
                    report.lostCount > 0
                        ? "Clients who did not go ahead"
                        : "No deals lost in this period"
                }
                footer={
                    <DeltaPill
                        invert
                        percent={percentChange(report.lostCount, report.previousLostCount)}
                    />
                }
            />
            <Kpi
                icon={Award}
                iconClass="bg-stage-3-soft text-stage-3"
                label="Win rate"
                value={report.winRate == null ? "—" : `${report.winRate}%`}
                detail={
                    resolved > 0
                        ? `${report.closedCount} of ${plural(resolved, "finished deal")} sold`
                        : "Shows once a deal is sold or lost"
                }
                footer={
                    report.avgDaysToClose != null ? (
                        <span className="text-xs text-ink-muted">
                            Takes about{" "}
                            <strong className="font-semibold text-ink tabular-nums">
                                {plural(report.avgDaysToClose, "day")}
                            </strong>{" "}
                            to sell
                        </span>
                    ) : null
                }
            />
        </dl>
    );
}
