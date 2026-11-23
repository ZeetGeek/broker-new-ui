import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { cn } from "@/lib/utils";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { AreaEarningsRow, EarningsReport } from "@/features/earnings/earnings-math";
import { AREA_COLOR_CLASS } from "@/features/earnings/earnings-viz";

/** Rows shown before the rest fold into one "more areas" line. */
const TOP_AREAS = 5;

function AreaRow({
    row,
    maxInr,
    colorClass,
}: {
    row: AreaEarningsRow;
    maxInr: number;
    colorClass: (typeof AREA_COLOR_CLASS)[number];
}) {
    // Bar is relative to the best area, so the leader always reads as full.
    const share = maxInr > 0 ? Math.round((row.earnedInr / maxInr) * 100) : 0;
    const hasMoney = row.earnedInr > 0;

    return (
        <li className="flex flex-col gap-2 py-3.5 first:pbs-0 last:pbe-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="body-sm flex items-center gap-2 min-inline-0">
                    <span
                        aria-hidden
                        className={cn("shrink-0 rounded-full block-2 inline-2", colorClass.dot)}
                    />
                    <span className="truncate">
                        <span className="font-semibold text-ink">{row.locality}</span>
                        {row.city ? <span className="text-ink-muted">, {row.city}</span> : null}
                    </span>
                </p>
                <p className="body-sm font-semibold wrap-anywhere text-ink tabular-nums min-inline-0">
                    {hasMoney ? formatCommission(row.earnedInr, true) : "No commission set"}
                </p>
            </div>
            <span
                aria-hidden
                className="block overflow-hidden rounded-full bg-surface-muted block-3"
            >
                <span
                    className={cn("block rounded-full block-full", colorClass.bar)}
                    style={{ inlineSize: `${hasMoney ? Math.max(share, 3) : 0}%` }}
                />
            </span>
            <p className="body-xs text-ink-muted">{plural(row.closedCount, "deal")} sold</p>
        </li>
    );
}

/** Where the commission came from, by locality. Sold deals in the selected period. */
export function EarningsAreas({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { areas } = report;
    const top = areas.slice(0, TOP_AREAS);
    const rest = areas.slice(TOP_AREAS);
    const restInr = rest.reduce((sum, row) => sum + row.earnedInr, 0);
    const maxInr = top[0]?.earnedInr ?? 0;

    return (
        <EarningsCard
            title="Earnings by area"
            titleId="earnings-areas-heading"
            className={className}
        >
            {areas.length === 0 ? (
                <p className="body-sm text-ink-muted">No deals sold in this period.</p>
            ) : (
                <>
                    <ul className="flex flex-col divide-y divide-border-warm">
                        {top.map((row, index) => (
                            <AreaRow
                                key={row.key}
                                row={row}
                                maxInr={maxInr}
                                colorClass={AREA_COLOR_CLASS[index % AREA_COLOR_CLASS.length]}
                            />
                        ))}
                    </ul>
                    {rest.length > 0 ? (
                        <p className="body-xs border-bs border-border-warm pbs-3 text-ink-muted">
                            {plural(rest.length, "more area")}
                            {restInr > 0 ? ` · ${formatCommission(restInr, true)}` : null}
                        </p>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
