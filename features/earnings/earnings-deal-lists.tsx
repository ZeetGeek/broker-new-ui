"use client";

import { useEffect, useRef, useState } from "react";

import { formatCommission } from "@/lib/format/commission";
import { formatDateIso, formatDateTile } from "@/lib/format/date";
import { plural } from "@/lib/format/plural";
import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { CardLink } from "@/components/shared/card-link";
import { ContactName } from "@/components/shared/contact-name";
import { Award } from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";

import { DealKind, EarningsCard, EarningsDealLink } from "@/features/earnings/earnings-card";
import { type EarningsReport, type ValuedDeal } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealStage, isLiveStage } from "@/features/pipeline/types";

import styles from "./earnings.module.css";

/**
 * Soft same-hue fade per stage: full colour where the title sits, ~85% at the
 * bar's end. Same hue keeps colour = stage; written out so Tailwind sees them.
 */
const STAGE_BAR_CLASS: Record<DealStage, string> = {
    new: "bg-linear-to-r from-stage-1 to-stage-1/85",
    contacted: "bg-linear-to-r from-stage-2 to-stage-2/85",
    visit: "bg-linear-to-r from-stage-3 to-stage-3/85",
    negotiation: "bg-linear-to-r from-stage-4 to-stage-4/85",
};

/**
 * Biggest open deals as a horizontal bar chart. Bar length is the deal's
 * commission against the biggest; bar colour is its pipeline stage (legend in
 * the header), so no stage chip is needed. Title sits above each bar; the
 * commission and property price sit just past the bar's end, in ink.
 */
export function EarningsOpenDeals({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const { live } = report;
    const deals = live.topDeals;
    const max = Math.max(1, ...deals.map((d) => d.commissionInr ?? 0));
    const listRef = useRef<HTMLDivElement>(null);
    const [scrolled, setScrolled] = useState(false);
    // More rows below the fold → footer casts an upward shadow; gone at the end.
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const measure = () => {
            setScrolled(list.scrollTop > 1);
            setHasMore(list.scrollHeight - list.clientHeight - list.scrollTop > 1);
        };
        measure();
        list.addEventListener("scroll", measure, { passive: true });
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => {
            list.removeEventListener("scroll", measure);
            observer.disconnect();
        };
    }, [listRef, deals.length]);
    const topTotal = deals.reduce((sum, d) => sum + (d.commissionInr ?? 0), 0);
    const topShare =
        live.potentialInr > 0 ? Math.round((topTotal / live.potentialInr) * 100) : null;

    return (
        <EarningsCard
            title="Biggest open deals"
            titleId="earnings-top-heading"
            action={
                deals.length > 0 ? (
                    <ul
                        aria-label="Bar colours"
                        className="flex flex-wrap items-center gap-x-3 gap-y-1"
                    >
                        {DEAL_STAGE_ORDER.map((stage) => (
                            <li
                                key={stage}
                                className="body-xs flex items-center gap-1.5 font-medium text-ink-muted"
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "shrink-0 rounded-xs block-2 inline-2",
                                        DEAL_STAGE_META[stage].dotClass,
                                    )}
                                />
                                {DEAL_STAGE_META[stage].label}
                            </li>
                        ))}
                    </ul>
                ) : null
            }
            // Phone/tablet: fixed height, list scrolls. lg+: follows the pipeline
            // card beside it (block-0 + min-block-full), so more deals never stretch the row.
            className={cn(deals.length > 0 && "block-120 lg:block-0 lg:min-block-full", className)}
        >
            {deals.length === 0 ? (
                <p className="body-sm text-ink-muted">
                    None of your open deals has a commission set yet.
                </p>
            ) : (
                <>
                    {/* Full-bleed divider under the header, shown once the list is scrolled
                        (same as the dashboard visits card). Kept outside the masked list
                        so the top fade cannot hide it. */}
                    <div
                        data-scrolled={scrolled}
                        className="-mx-4 flex flex-1 flex-col border-bs border-transparent px-4 transition-colors duration-160 min-block-0 data-[scrolled=true]:border-border-warm sm:-mx-5 sm:px-5"
                    >
                        <div
                            ref={listRef}
                            role="region"
                            aria-label="Biggest open deals list"
                            tabIndex={0}
                            className="-mx-1 no-scrollbar flex-1 overflow-y-auto overscroll-contain px-1 min-block-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <ol className="flex flex-col gap-3 pbs-1 pbe-4">
                                {deals.map(({ deal, commissionInr }) => {
                                    const stage = isLiveStage(deal.status)
                                        ? DEAL_STAGE_META[deal.status]
                                        : null;
                                    const pct = ((commissionInr ?? 0) / max) * 100;
                                    return (
                                        <li
                                            key={deal.id}
                                            data-linked-card=""
                                            className="flex flex-col gap-1.5"
                                        >
                                            <CardLink
                                                href={`/broker/pipeline/${encodeURIComponent(deal.id)}`}
                                                label={`Open ${deal.property.title}`}
                                            />
                                            {/* Title above, so long titles never truncate inside a
                                                short bar. */}
                                            <div className="flex min-inline-0">
                                                <EarningsDealLink
                                                    dealId={deal.id}
                                                    className="body-sm truncate font-semibold text-ink min-inline-0"
                                                >
                                                    {deal.property.title}
                                                    {stage ? (
                                                        <span className="sr-only">
                                                            , {stage.label}
                                                        </span>
                                                    ) : null}
                                                </EarningsDealLink>
                                            </div>
                                            {/* On narrow cards, values sit below the full-width
                                                track. Every bar shares the same scale. */}
                                            <div className={styles.openDealAmounts}>
                                                <span aria-hidden className={styles.openDealBar}>
                                                    <span
                                                        className={cn(
                                                            "block rounded-control block-8 min-inline-2",
                                                            isLiveStage(deal.status)
                                                                ? STAGE_BAR_CLASS[deal.status]
                                                                : "bg-chart-2",
                                                        )}
                                                        style={{ inlineSize: `${pct}%` }}
                                                    />
                                                </span>
                                                <span className={styles.openDealValues}>
                                                    <span className="body-sm font-semibold text-ink tabular-nums">
                                                        {formatCommission(commissionInr ?? 0, true)}
                                                    </span>
                                                    <span
                                                        aria-hidden
                                                        className="body-sm text-ink-subtle"
                                                    >
                                                        /
                                                    </span>
                                                    <PriceWithCommission
                                                        size="xs"
                                                        audience="broker"
                                                        amountInr={deal.property.amountInr}
                                                        isRent={deal.property.isRent}
                                                        commissionPercent={
                                                            deal.property.commissionPercent
                                                        }
                                                        commissionAmountInr={
                                                            deal.property.commissionAmountInr
                                                        }
                                                        className="text-ink-muted"
                                                    />
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </div>

                    {topShare != null ? (
                        // Full-bleed footer like the dashboard visits card: divider on top,
                        // upward shadow only while the list still has rows below.
                        <footer
                            data-scroll-shadow={hasMore}
                            className="relative z-1 -mx-4 -mbs-4 -mbe-4 rounded-b-card border-bs border-border-warm bg-surface p-4 data-[scroll-shadow=true]:shadow-scroll-edge sm:-mx-5 sm:-mbe-5 sm:px-5"
                        >
                            <p className="body-sm text-ink-muted">
                                Your top {deals.length} deals hold{" "}
                                <strong className="font-semibold text-ink">{topShare}%</strong> of
                                the {formatCommission(live.potentialInr, true)} commission in your
                                pipeline.
                            </p>
                        </footer>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}

/**
 * Latest sold deals as a month-grouped list. The period's best deal is
 * badged in its own row instead of being repeated in a banner; the banner
 * only appears when the best deal is older than the rows shown.
 */
export function EarningsRecentSold({
    report,
    className,
}: {
    report: EarningsReport;
    className?: string;
}) {
    const rows = report.recentClosed;
    const best = report.bestDeal;
    const showBest = best != null && best.commissionInr != null && report.closedCount > 1;
    const bestId = showBest ? best.deal.id : null;
    const bestInList = bestId != null && rows.some((r) => r.deal.id === bestId);
    const hiddenCount = report.closedCount - rows.length;

    return (
        <EarningsCard
            title="Recently sold"
            titleId="earnings-recent-heading"
            className={cn("@container block-full min-block-full", className)}
        >
            {showBest && !bestInList ? (
                <div
                    data-linked-card=""
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-inner bg-chart-4/10 p-3 @sm:flex"
                >
                    <CardLink
                        href={`/broker/pipeline/${encodeURIComponent(best.deal.id)}`}
                        label={`Open ${best.deal.property.title}`}
                    />
                    <span
                        aria-hidden
                        className="flex shrink-0 items-center justify-center rounded-inner bg-surface text-chart-4 block-9 inline-9"
                    >
                        <Award className="block-4.5 inline-4.5" />
                    </span>
                    <div className="flex flex-col gap-0.5 min-inline-0">
                        <p className="body-xs font-semibold text-brand-text">
                            Best deal this period
                        </p>
                        <EarningsDealLink
                            dealId={best.deal.id}
                            className="body-sm font-medium wrap-anywhere text-ink"
                        >
                            {best.deal.property.title}
                        </EarningsDealLink>
                    </div>
                    <span className="h6 col-start-2 wrap-anywhere text-ink tabular-nums @sm:ms-auto @sm:shrink-0">
                        {formatCommission(best.commissionInr ?? 0)}
                    </span>
                </div>
            ) : null}

            {rows.length === 0 ? (
                <p className="body-sm text-ink-muted">
                    No deals sold in this period. Try a longer period.
                </p>
            ) : (
                <ol className="flex flex-col gap-3">
                    {rows.map((row) => (
                        <RecentSoldRow
                            key={row.deal.id}
                            row={row}
                            isBest={bestInList && row.deal.id === bestId}
                        />
                    ))}
                </ol>
            )}

            {hiddenCount > 0 ? (
                // Full-bleed footer, same as "Biggest open deals": divider on top,
                // pinned to the card bottom when the card is taller than its list.
                <footer className="-mx-4 mbs-auto -mbe-4 rounded-b-card border-bs border-border-warm p-4 sm:-mx-5 sm:-mbe-5 sm:px-5">
                    <p className="body-sm text-ink-muted">
                        Showing your latest{" "}
                        <strong className="font-semibold text-ink">{rows.length}</strong> of{" "}
                        <strong className="font-semibold text-ink">{report.closedCount}</strong>{" "}
                        sold deals.
                    </p>
                </footer>
            ) : null}
        </EarningsCard>
    );
}

function RecentSoldRow({ row, isBest }: { row: ValuedDeal; isBest: boolean }) {
    const { deal, commissionInr } = row;
    const soldAt = deal.resolvedAt ? new Date(deal.resolvedAt) : null;
    const dayParts = soldAt ? formatDateTile(soldAt) : null;
    // The amount the sale was valued on, locked when it was marked sold.
    const baseInr = deal.property.amountInr;
    const { daysToClose } = deal;

    return (
        // Each sale is its own bordered box, same as the dashboard visit rows.
        // Whole box is the tap target (title link is stretched over it), so a
        // thumb never has to hit the 20px title.
        <li
            data-linked-card=""
            className="relative flex items-start gap-3 rounded-inner border border-border-warm bg-surface p-3 transition-colors duration-160 has-[a:hover]:bg-surface-muted/40 @sm:items-center @sm:p-3.5"
        >
            <CardLink
                href={`/broker/pipeline/${encodeURIComponent(deal.id)}`}
                label={`Open ${deal.property.title}`}
            />
            {soldAt && dayParts ? (
                <time
                    dateTime={formatDateIso(soldAt)}
                    className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-inner bg-surface leading-none shadow-xs ring-1 ring-border-warm block-14 inline-14"
                >
                    <span className="h6 text-ink tabular-nums">{dayParts.day}</span>
                    <span className="body-xs text-ink-muted">{dayParts.month}</span>
                </time>
            ) : (
                <span aria-hidden className="shrink-0 inline-14" />
            )}

            <div className="flex flex-1 flex-col min-inline-0">
                <div className="flex flex-col items-start gap-3 @sm:flex-row @sm:items-center @sm:gap-4">
                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <EarningsDealLink
                                dealId={deal.id}
                                className="body-sm font-semibold wrap-anywhere text-ink"
                            >
                                {deal.property.title}
                            </EarningsDealLink>
                            {isBest ? (
                                <span className="body-xs inline-flex items-center rounded-full bg-chart-4/12 px-2 py-0.5 font-semibold text-brand-text">
                                    Best deal
                                </span>
                            ) : null}
                        </div>
                        <p className="body-xs flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink-muted">
                            <ContactName
                                name={deal.buyer.name}
                                contactId={deal.buyer.id}
                                contactType="buyer"
                            />
                            <span aria-hidden>·</span>
                            <DealKind isRent={deal.property.isRent} />
                        </p>
                    </div>
                    {/* Wide cards only (container ≥ 28rem): how long the deal took,
                            filling the gap between title and amount with real info. Fixed
                            width + divider keep the columns straight down the card. */}
                    <p className="hidden shrink-0 flex-col gap-1 self-stretch border-s border-border-warm ps-4 whitespace-nowrap inline-40 @md:flex @md:justify-center">
                        <span className="body-sm font-semibold text-ink tabular-nums">
                            {daysToClose == null
                                ? "—"
                                : daysToClose === 0
                                  ? "Same day"
                                  : plural(daysToClose, "day")}
                        </span>
                        <span className="body-xs font-semibold text-ink-muted">to close</span>
                    </p>
                    {/* Earned amount on the title line, deal amount on the meta line.
                            Left-aligned behind a divider, like the days column. */}
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-border-warm tabular-nums min-inline-0 @sm:shrink-0 @sm:flex-col @sm:justify-center @sm:self-stretch @sm:border-s @sm:ps-4 @sm:whitespace-nowrap @md:inline-36">
                        {commissionInr != null ? (
                            <span className="body-sm font-semibold wrap-anywhere text-ink tabular-nums">
                                {formatCommission(commissionInr)}
                            </span>
                        ) : (
                            <span className="body-sm font-semibold text-ink-muted">
                                No commission
                            </span>
                        )}
                        <span className="body-xs font-semibold wrap-anywhere text-ink-muted tabular-nums">
                            on {deal.property.isRent ? formatRent(baseInr) : formatPrice(baseInr)}
                        </span>
                    </p>
                </div>
            </div>
        </li>
    );
}
