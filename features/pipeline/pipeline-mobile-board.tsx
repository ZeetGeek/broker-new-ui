"use client";

import { type ReactNode, useId, useLayoutEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { columnValue } from "@/features/pipeline/deal-attention";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealItem, type DealStage } from "@/features/pipeline/types";

import styles from "./pipeline-mobile-board.module.css";

/** Column offsets are relative to the positioned rail, not its parent's page inset. */
function stageOffset(rail: HTMLElement, lane: HTMLElement) {
    return lane.offsetLeft - Number.parseFloat(getComputedStyle(rail).paddingInlineStart || "0");
}

/** Swipe between stages; the page handles vertical scrolling at the cards' natural height. */
export function PipelineMobileBoard({
    active,
    onChange,
    dealsByStage,
    stageLimits,
    onLoadMore,
    renderCard,
    stageFilter = "",
}: {
    active: DealStage;
    onChange: (stage: DealStage) => void;
    dealsByStage: Record<DealStage, DealItem[]>;
    stageLimits: Record<DealStage, number>;
    onLoadMore: (stage: DealStage) => void;
    renderCard: (deal: DealItem) => ReactNode;
    stageFilter?: DealStage | "";
}) {
    const id = useId();
    const railRef = useRef<HTMLDivElement>(null);
    const syncedStage = useRef<DealStage | null>(null);
    const activeRef = useRef(active);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stages = stageFilter ? [stageFilter] : DEAL_STAGE_ORDER;
    const index = Math.max(0, stages.indexOf(active));

    useLayoutEffect(() => {
        activeRef.current = active;
    }, [active]);

    useLayoutEffect(() => {
        const rail = railRef.current;
        if (!rail) return;
        const alignStage = () => {
            const lane = rail.querySelector<HTMLElement>(`[data-stage="${activeRef.current}"]`);
            if (lane) rail.scrollLeft = stageOffset(rail, lane);
        };
        window.addEventListener("resize", alignStage);
        return () => {
            window.removeEventListener("resize", alignStage);
            if (scrollTimer.current) clearTimeout(scrollTimer.current);
        };
    }, []);

    useLayoutEffect(() => {
        const rail = railRef.current;
        if (syncedStage.current === active && !stageFilter) return;
        syncedStage.current = active;
        const lane = rail?.querySelector<HTMLElement>(`[data-stage="${active}"]`);
        if (rail && lane) rail.scrollLeft = stageOffset(rail, lane);
    }, [active, stageFilter]);

    function navigate(nextIndex: number) {
        const stage = stages[nextIndex];
        const rail = railRef.current;
        const lane = rail?.querySelector<HTMLElement>(`[data-stage="${stage}"]`);
        if (!stage || !rail || !lane) return;
        rail.scrollTo({
            left: stageOffset(rail, lane),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
        });
    }

    return (
        <div className={styles.board}>
            <p id={`${id}-hint`} className="sr-only">
                Swipe left or right to browse stages, or focus the board and use the left and right
                arrow keys. Scroll down the page to see more deals. Open a deal for its full
                details.
            </p>
            <div
                ref={railRef}
                className={styles.rail}
                role="region"
                aria-label="Pipeline stages"
                aria-describedby={`${id}-hint`}
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "ArrowRight" && index < stages.length - 1) {
                        event.preventDefault();
                        navigate(index + 1);
                    } else if (event.key === "ArrowLeft" && index > 0) {
                        event.preventDefault();
                        navigate(index - 1);
                    }
                }}
                onScroll={() => {
                    if (scrollTimer.current) clearTimeout(scrollTimer.current);
                    scrollTimer.current = setTimeout(() => {
                        const rail = railRef.current;
                        if (!rail) return;
                        const lanes = Array.from(
                            rail.querySelectorAll<HTMLElement>("[data-stage]"),
                        );
                        const nearest = lanes.reduce<HTMLElement | null>(
                            (best, lane) =>
                                !best ||
                                Math.abs(stageOffset(rail, lane) - rail.scrollLeft) <
                                    Math.abs(stageOffset(rail, best) - rail.scrollLeft)
                                    ? lane
                                    : best,
                            null,
                        );
                        const stage = nearest?.dataset.stage as DealStage | undefined;
                        if (stage && stage !== activeRef.current) {
                            syncedStage.current = stage;
                            onChange(stage);
                        }
                    }, 120);
                }}
            >
                {stages.map((stage) => {
                    const deals = dealsByStage[stage];
                    const meta = DEAL_STAGE_META[stage];
                    const totals = columnValue(deals);
                    const remaining = deals.length - stageLimits[stage];
                    return (
                        <section
                            key={stage}
                            data-stage={stage}
                            className={styles.column}
                            aria-labelledby={`${id}-${stage}`}
                        >
                            <header className={styles.columnHeader}>
                                <div className={styles.columnTitle}>
                                    <span
                                        aria-hidden
                                        className={`shrink-0 rounded-full block-2 inline-2 ${meta.dotClass}`}
                                    />
                                    <h2 id={`${id}-${stage}`}>{meta.label}</h2>
                                    <span className={styles.count}>{deals.length}</span>
                                </div>
                                <p className={styles.value}>
                                    {totals.sale ? <span>Sale {totals.sale}</span> : null}
                                    {totals.rent ? <span>Rent {totals.rent}</span> : null}
                                    {!totals.sale && !totals.rent ? "No deals yet" : null}
                                </p>
                            </header>
                            <div
                                className={styles.deals}
                                role="region"
                                aria-label={`${meta.label} deals`}
                            >
                                {deals.length ? (
                                    <>
                                        {deals.slice(0, stageLimits[stage]).map((deal) => (
                                            <div key={deal.id}>{renderCard(deal)}</div>
                                        ))}
                                        {remaining > 0 ? (
                                            <Button
                                                variant="outline"
                                                className={styles.loadMore}
                                                onClick={() => onLoadMore(stage)}
                                            >
                                                Load more{" "}
                                                <span className="tabular">({remaining})</span>
                                            </Button>
                                        ) : null}
                                    </>
                                ) : (
                                    <div className={styles.empty}>
                                        <meta.icon aria-hidden size={22} strokeWidth={1.5} />
                                        <h3>No deals here yet</h3>
                                        <p>{meta.emptyHint}.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
