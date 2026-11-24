"use client";
import { useState } from "react";
import Link from "next/link";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
    formatCommission,
    formatCommissionMonth,
    formatCommissionPeriod,
} from "@/lib/format/commission";
import { BROKER_EARNINGS_HREF } from "@/lib/routes/broker";

import { EmptyState, LoadingState } from "@/components/empty-state";
import { IconButton } from "@/components/shared/icon-button";
import { ChartBar, ChevronLeft, ChevronRight, HandCoins } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { CardError } from "./card-states";
import {
    closedDealsLabel,
    type CommissionMonths,
    commissionMonths,
    DASHBOARD_DEFAULT_MONTHS,
    maxCommissionPage,
} from "./commission-window";
import { CommissionSkeleton } from "./dashboard-skeleton";
import { useDashboardEarnings } from "./use-dashboard-earnings";

import styles from "./commission-earned.module.css";

const CHART_CONFIG = {
    sale: { label: "Sale commission", color: "var(--color-brand-text)" },
    rent: { label: "Rent commission", color: "var(--color-success-mid)" },
} satisfies ChartConfig;

const PERIOD_OPTIONS = [
    { value: 3, label: "3 Months" },
    { value: 6, label: "6 Months" },
    { value: 12, label: "1 Year" },
];

function CommissionShell({ children }: { children: React.ReactNode }) {
    return (
        <section
            aria-labelledby="commission-earned-heading"
            className={`${styles.section} ${styles.stateSection}`}
        >
            <div className={styles.summary}>
                <h2 id="commission-earned-heading" className="h6">
                    Commission earned
                </h2>
                {children}
            </div>
        </section>
    );
}

export function CommissionEarned({ now }: { now: Date }) {
    const [months, setMonths] = useState<CommissionMonths>(DASHBOARD_DEFAULT_MONTHS);
    const [page, setPage] = useState(0);
    const report = useDashboardEarnings(months, page, now);
    const lastPage = maxCommissionPage(months);

    if (report.isPending) {
        return (
            <LoadingState label="Loading your commission">
                <CommissionSkeleton />
            </LoadingState>
        );
    }
    if (report.isError && !report.data) {
        return (
            <CommissionShell>
                <CardError
                    what="your commission"
                    retrying={report.isFetching}
                    onRetry={() => void report.refetch()}
                />
            </CommissionShell>
        );
    }
    if (!report.data.hasResolvedDeals) {
        return (
            <section
                className={`${styles.section} ${styles.stateSection}`}
                aria-labelledby="commission-earned-heading"
            >
                <EmptyState
                    size="card"
                    icon={HandCoins}
                    headingId="commission-earned-heading"
                    heading="No commission earned yet"
                    description="Commission from closed deals will appear here, month by month."
                    action={{ label: "Open pipeline", icon: ChartBar, href: "/broker/pipeline" }}
                />
            </section>
        );
    }

    const selectedMonths = commissionMonths(report.data.buckets);
    if (!selectedMonths.length) return null;
    const latest = selectedMonths[selectedMonths.length - 1]!;
    const window = { hasPrevious: page < lastPage, hasNext: page > 0 };
    const total = selectedMonths.reduce((sum, month) => sum + month.total, 0);
    const period = formatCommissionPeriod(selectedMonths[0]!.monthKey, latest.monthKey);
    const monthLabel = `${formatCommissionMonth(latest.monthKey)}${latest.isToDate ? " to date" : ""}`;

    return (
        <section
            aria-labelledby="commission-earned-heading"
            aria-busy={report.isPlaceholderData}
            className={styles.section}
        >
            <div className={styles.summary}>
                <div>
                    <h2 id="commission-earned-heading" className="h6">
                        Commission earned
                    </h2>
                    <div aria-live="polite" aria-atomic="true">
                        <p className={`h1 ${styles.total}`}>{formatCommission(total)}</p>
                    </div>
                    <nav className={styles.navigation} aria-label="Commission periods">
                        <IconButton
                            appearance="ghost"
                            size="sm"
                            aria-label={`Previous ${months} months`}
                            disabled={!window.hasPrevious}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronLeft aria-hidden />
                        </IconButton>
                        <p
                            className={styles.period}
                            aria-live="polite"
                            aria-atomic="true"
                            aria-label={period}
                        >
                            {formatCommissionPeriod(
                                selectedMonths[0]!.monthKey,
                                latest.monthKey,
                                "short",
                            )}
                        </p>
                        <IconButton
                            appearance="ghost"
                            size="sm"
                            aria-label={`Next ${months} months`}
                            disabled={!window.hasNext}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronRight aria-hidden />
                        </IconButton>
                    </nav>
                </div>
                <div className={styles.monthSnapshot}>
                    <div className={styles.snapshotHeader}>
                        <p>{monthLabel}</p>
                        <p className={styles.deals}>{closedDealsLabel(latest.deals)}</p>
                    </div>
                    <p className={`h4 ${styles.monthAmount}`}>{formatCommission(latest.total)}</p>
                    <dl className={styles.breakdown}>
                        <div>
                            <dt>
                                <span className={styles.saleSwatch} aria-hidden />
                                Sale commission
                            </dt>
                            <dd>{formatCommission(latest.sale)}</dd>
                        </div>
                        <div>
                            <dt>
                                <span className={styles.rentSwatch} aria-hidden />
                                Rent commission
                            </dt>
                            <dd>{formatCommission(latest.rent)}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className={styles.detail}>
                <header className={styles.chartHeader}>
                    <div className={styles.rangeControl}>
                        <Select
                            items={PERIOD_OPTIONS}
                            value={months}
                            onValueChange={(value) => {
                                if (value === 3 || value === 6 || value === 12) {
                                    setMonths(value);
                                    setPage(0);
                                }
                            }}
                        >
                            <SelectTrigger
                                size="xs"
                                aria-label="Commission period length"
                                className={styles.range}
                                wrapperClassName={styles.rangeWrapper}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIOD_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={BROKER_EARNINGS_HREF} />}
                    >
                        Open earnings
                    </Button>
                </header>
                <div
                    className={styles.chartViewport}
                    role="region"
                    aria-label="Monthly commission chart"
                    tabIndex={0}
                >
                    <ChartContainer
                        key={`${months}-${page}`}
                        config={CHART_CONFIG}
                        data-months={months}
                        className={`${styles.chart} ${months === 12 ? styles.yearChart : ""} ${report.isPlaceholderData ? "opacity-60" : ""}`}
                        aria-label={`Monthly sale and rent commission, ${period}`}
                    >
                        <BarChart
                            accessibilityLayer
                            aria-label={`Sale and rent commission by month, ${period}`}
                            data={selectedMonths}
                            margin={{ top: 24 }}
                        >
                            <CartesianGrid vertical={false} />
                            {/* Keep labels inside the plot and its full-height hover highlight. */}
                            <YAxis
                                hide
                                domain={[0, (dataMax: number) => Math.max(1, dataMax * 1.2)]}
                            />
                            <XAxis
                                dataKey="monthKey"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                interval={0}
                                tick={{ fontSize: 12, fill: "var(--color-ink-muted)" }}
                                tickFormatter={(monthKey: string) =>
                                    `${formatCommissionMonth(monthKey, "short").split(" ")[0]}${selectedMonths.find((month) => month.monthKey === monthKey)?.isToDate ? "*" : ""}`
                                }
                            />
                            <ChartTooltip
                                cursor={{ fill: "var(--color-brand-soft)", radius: 8 }}
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        className={styles.tooltip}
                                        formatter={(value, name) => (
                                            <div className={styles.tooltipRow}>
                                                <span className={styles.tooltipLabel}>
                                                    <span
                                                        aria-hidden
                                                        className={styles.tooltipSwatch}
                                                        style={{
                                                            backgroundColor:
                                                                name === "sale"
                                                                    ? "var(--color-sale)"
                                                                    : "var(--color-rent)",
                                                        }}
                                                    />
                                                    {name === "sale"
                                                        ? "Sale commission"
                                                        : "Rent commission"}
                                                </span>
                                                <strong>{formatCommission(Number(value))}</strong>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <ChartLegend
                                content={<ChartLegendContent className={styles.legend} />}
                            />
                            <Bar
                                dataKey="sale"
                                stackId="commission"
                                fill="var(--color-sale)"
                                radius={[0, 0, 8, 8]}
                                isAnimationActive={false}
                            />
                            <Bar
                                dataKey="rent"
                                stackId="commission"
                                fill="var(--color-rent)"
                                radius={[8, 8, 0, 0]}
                                isAnimationActive={false}
                            >
                                <LabelList
                                    dataKey="total"
                                    position="top"
                                    offset={12}
                                    className={styles.barLabel}
                                    fontSize={12}
                                    formatter={(value) => formatCommission(Number(value), true)}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>
                {report.isError ? (
                    <p role="alert" className="body-sm text-ink-muted">
                        Couldn&apos;t refresh this period.{" "}
                        <button
                            type="button"
                            className="font-semibold text-brand underline-offset-4 hover:underline"
                            onClick={() => void report.refetch()}
                        >
                            Try again
                        </button>
                    </p>
                ) : null}
                {latest.isToDate ? (
                    <footer className={styles.footer}>
                        <span />
                        <span>* {monthLabel}</span>
                    </footer>
                ) : null}
                <div className="sr-only">
                    <table>
                        <caption>Commission earned, {period}, in Indian rupees</caption>
                        <thead>
                            <tr>
                                <th scope="col">Month</th>
                                <th scope="col">Sale commission</th>
                                <th scope="col">Rent commission</th>
                                <th scope="col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedMonths.map((month) => (
                                <tr key={month.monthKey}>
                                    <th scope="row">
                                        {formatCommissionMonth(month.monthKey)}
                                        {month.isToDate ? " (to date)" : ""}
                                    </th>
                                    <td>{formatCommission(month.sale)}</td>
                                    <td>{formatCommission(month.rent)}</td>
                                    <td>{formatCommission(month.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
