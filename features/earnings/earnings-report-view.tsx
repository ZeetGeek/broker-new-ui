import { Info } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";

import { EarningsOpenDeals, EarningsRecentSold } from "@/features/earnings/earnings-deal-lists";
import { EarningsHero } from "@/features/earnings/earnings-hero";
import { EarningsLosses } from "@/features/earnings/earnings-losses";
import {
    earningsHeadline,
    type EarningsReport,
    type EarningsSelection,
} from "@/features/earnings/earnings-math";
import { EarningsPipeline } from "@/features/earnings/earnings-pipeline";
import { EarningsRangePicker } from "@/features/earnings/earnings-range-picker";
import { EarningsStatStrip } from "@/features/earnings/earnings-stat-strip";
import { EarningsTrendChart } from "@/features/earnings/earnings-trend-chart";

/**
 * The loaded earnings page. Pure view over a built report, so it renders the
 * same from live deals, the sample set, or a test.
 *
 * Mobile order is priority order: headline, outcomes, the money, then what is
 * still to win, then what already happened.
 */
export function EarningsReportView({
    report,
    selection,
    onSelectionChange,
    isSample = false,
}: {
    report: EarningsReport;
    selection: EarningsSelection;
    onSelectionChange: (next: EarningsSelection) => void;
    isSample?: boolean;
}) {
    return (
        <div className="flex flex-col gap-5 pbe-6 sm:gap-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                <div className="flex flex-col gap-2 min-inline-0">
                    <h1 className="h3">
                        <span className="text-ink">Earnings.</span>{" "}
                        <span className="text-ink-muted">{earningsHeadline(report)}</span>
                    </h1>
                    <p className="body-sm flex items-center gap-1.5 text-ink-muted">
                        <Info aria-hidden className="shrink-0 block-4 inline-4" />
                        Estimated from the commission each owner set
                    </p>
                </div>
                <EarningsRangePicker value={selection} onChange={onSelectionChange} />
            </header>

            {isSample ? (
                <div
                    role="note"
                    className="body-sm flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-surface px-4 py-3 text-ink-muted ring-1 ring-border-warm/50"
                >
                    <Badge color="yellow">Sample data</Badge>
                    <span>
                        These numbers are made up to show the page. Your real earnings replace them
                        once you mark a deal as sold.
                    </span>
                </div>
            ) : null}

            <EarningsStatStrip report={report} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
                <EarningsHero report={report} className="lg:col-span-4" />
                <EarningsTrendChart report={report} className="lg:col-span-8" />
                <EarningsPipeline report={report} className="lg:col-span-4" />
                <EarningsOpenDeals report={report} className="lg:col-span-8" />
                <EarningsRecentSold report={report} className="lg:col-span-8" />
                <EarningsLosses report={report} className="lg:col-span-4" />
            </div>

            <p className="body-xs flex items-start gap-2 text-ink-muted">
                <Info aria-hidden className="mbs-px shrink-0 block-4 inline-4" />
                <span>
                    All amounts are estimates. Sale commission uses the final price when you saved
                    one, otherwise the accepted offer or asking price. Rent commission is the
                    one-time brokerage the owner set, not monthly rent.
                </span>
            </p>
        </div>
    );
}
