import { cn } from "@/lib/utils";

import { Info } from "@/components/shared/icons";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";

import { EarningsAreas } from "@/features/earnings/earnings-areas";
import { EarningsOpenDeals, EarningsRecentSold } from "@/features/earnings/earnings-deal-lists";
import { EarningsHero } from "@/features/earnings/earnings-hero";
import { EarningsLosses } from "@/features/earnings/earnings-losses";
import {
    earningsHeadlineLines,
    type EarningsReport,
    type EarningsSelection,
    formatWindow,
} from "@/features/earnings/earnings-math";
import { EarningsPipeline } from "@/features/earnings/earnings-pipeline";
import { EarningsRangePicker } from "@/features/earnings/earnings-range-picker";
import { EarningsStatStrip } from "@/features/earnings/earnings-stat-strip";
import { EarningsTrendChart } from "@/features/earnings/earnings-trend-chart";

/**
 * The loaded earnings page. Pure view over a report, so it renders the same
 * from the API, mock mode, or a test.
 *
 * Mobile order is priority order: headline, outcomes, the money, then what is
 * still to win, then what already happened.
 */
export function EarningsReportView({
    report,
    selection,
    onSelectionChange,
    refreshing = false,
}: {
    report: EarningsReport;
    selection: EarningsSelection;
    onSelectionChange: (next: EarningsSelection) => void;
    /** A new period is loading: the previous numbers stay, dimmed. */
    refreshing?: boolean;
}) {
    const headlineLines = earningsHeadlineLines(report);
    // Remount the loop when the period (or its numbers) change so it does not
    // keep showing a stale line from the previous filter.
    const headlineKey = `${selection.preset}:${formatWindow(report.window)}:${headlineLines.join("|")}`;

    return (
        <div className="flex flex-col gap-card-grid min-inline-0">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                <div className="flex flex-col gap-2 min-inline-0">
                    <h1 className="h3 flex flex-col gap-x-1.5 gap-y-1 text-ink sm:flex-row sm:items-baseline">
                        <span className="shrink-0">Earnings.</span>
                        <span className="flex-1 min-inline-0">
                            <RotatingHeaderSummary
                                key={headlineKey}
                                lines={headlineLines}
                                loadingPlaceholder="Your commissions, summarised."
                            />
                        </span>
                    </h1>
                    <p className="body-sm flex items-start gap-1.5 text-ink-muted">
                        <Info aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                        Estimated from the commission each owner set
                    </p>
                </div>
                <EarningsRangePicker value={selection} onChange={onSelectionChange} />
            </header>

            <div
                aria-busy={refreshing || undefined}
                className={cn(
                    "flex flex-col gap-card-grid transition-opacity duration-160",
                    refreshing && "opacity-60",
                )}
            >
                <EarningsStatStrip report={report} />

                <div className="grid grid-cols-1 gap-card-grid md:grid-cols-2 lg:grid-cols-12">
                    <EarningsHero report={report} className="lg:col-span-4" />
                    <EarningsTrendChart report={report} className="lg:col-span-8" />
                    {/* Row 2: what is still to win, and where the money has come from. */}
                    <EarningsOpenDeals report={report} className="lg:col-span-5" />
                    <EarningsAreas report={report} className="lg:col-span-3" />
                    <EarningsPipeline report={report} className="lg:col-span-4" />
                    {/* Phone keeps priority order (sold before losses); md+ puts losses on the left. */}
                    <EarningsRecentSold
                        report={report}
                        className="md:order-last md:col-span-2 lg:col-span-5"
                    />
                    <EarningsLosses report={report} className="lg:col-span-7" />
                </div>
            </div>
        </div>
    );
}
