"use client";

import { useState } from "react";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import { type CommissionPeriodMonths, getCommissionWindow } from "@/lib/commission-period";
import {
    formatCommission,
    formatCommissionMonth,
    formatCommissionPeriod,
} from "@/lib/format/commission";

import { ChevronLeft, ChevronRight } from "@/components/shared/icons";
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

import { MOCK_COMMISSION } from "./mock-commission";

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

export function CommissionEarned() {
    const [months, setMonths] = useState<CommissionPeriodMonths>(6);
    const [page, setPage] = useState(0);
    const window = getCommissionWindow(MOCK_COMMISSION, months, page);
    const selectedMonths = window.data;
    const latest = selectedMonths[selectedMonths.length - 1];
    const total = selectedMonths.reduce((sum, month) => sum + month.total, 0);
    const period = formatCommissionPeriod(selectedMonths[0].monthKey, latest.monthKey);
    const monthLabel = `${formatCommissionMonth(latest.monthKey)}${latest.isToDate ? " to date" : ""}`;

    return (
        <section aria-labelledby="commission-earned-heading" className={styles.section}>
            <div className={styles.summary}>
                <div>
                    <h2 id="commission-earned-heading" className="h6">
                        Commission earned
                    </h2>
                    <div aria-live="polite" aria-atomic="true">
                        <p className={`h1 ${styles.total}`}>{formatCommission(total)}</p>
                    </div>
                    <nav className={styles.navigation} aria-label="Commission periods">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Previous ${months} months`}
                            disabled={!window.hasPrevious}
                            onClick={() => setPage(window.pageIndex + 1)}
                        >
                            <ChevronLeft aria-hidden />
                        </Button>
                        <p
                            className={styles.period}
                            aria-live="polite"
                            aria-atomic="true"
                            aria-label={period}
                        >
                            {formatCommissionPeriod(
                                selectedMonths[0].monthKey,
                                latest.monthKey,
                                "short",
                            )}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Next ${months} months`}
                            disabled={!window.hasNext}
                            onClick={() => setPage(window.pageIndex - 1)}
                        >
                            <ChevronRight aria-hidden />
                        </Button>
                    </nav>
                </div>
                <div className={styles.monthSnapshot}>
                    <div className={styles.snapshotHeader}>
                        <p>{monthLabel}</p>
                        <p className={styles.deals}>
                            <strong>{latest.deals}</strong>{" "}
                            {latest.deals === 1 ? "deal closed" : "deals closed"}
                        </p>
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
                    <h3 className="h6">Earnings by month</h3>
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
                </header>
                <div className={styles.chartViewport}>
                    <ChartContainer
                        key={`${months}-${page}`}
                        config={CHART_CONFIG}
                        className={`${styles.chart} ${months === 12 ? styles.yearChart : ""}`}
                        aria-label={`Monthly sale and rent commission, ${period}`}
                    >
                        <BarChart
                            accessibilityLayer
                            aria-label={`Sale and rent commission by month, ${period}`}
                            data={selectedMonths}
                            margin={{ top: 24 }}
                        >
                            <CartesianGrid vertical={false} />
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
                <footer className={styles.footer}>
                    <span>Illustrative analytics</span>
                    {latest.isToDate ? <span>* {monthLabel}</span> : null}
                </footer>
                <table className="sr-only">
                    <caption>Illustrative commission earned, {period}, in Indian rupees</caption>
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
        </section>
    );
}
