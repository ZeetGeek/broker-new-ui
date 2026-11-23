"use client";

import { type ReactNode, useId, useLayoutEffect, useRef } from "react";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";

import { columnValue } from "@/features/pipeline/deal-attention";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { StageTabs } from "@/features/pipeline/stage-tabs";
import { DEAL_STAGE_ORDER, type DealItem, type DealStage } from "@/features/pipeline/types";

import styles from "./pipeline-mobile-board.module.css";

export function PipelineMobileBoard({
    active,
    onChange,
    dealsByStage,
    stageLimits,
    onLoadMore,
    renderCard,
}: {
    active: DealStage;
    onChange: (stage: DealStage) => void;
    dealsByStage: Record<DealStage, DealItem[]>;
    stageLimits: Record<DealStage, number>;
    onLoadMore: (stage: DealStage) => void;
    renderCard: (deal: DealItem) => ReactNode;
}) {
    const id = useId();
    const navRef = useRef<HTMLDivElement>(null);
    const positions = useRef<Partial<Record<DealStage, number>>>({});
    const previousStage = useRef(active);
    const deals = dealsByStage[active];
    const totals = columnValue(deals);
    const remaining = deals.length - stageLimits[active];
    const counts = Object.fromEntries(
        DEAL_STAGE_ORDER.map((stage) => [stage, dealsByStage[stage].length]),
    ) as Record<DealStage, number>;

    useLayoutEffect(() => {
        const nav = navRef.current;
        const header = document.querySelector<HTMLElement>("[data-portal-shell] > header");
        if (!nav || !header) return;
        const measure = () => {
            nav.style.setProperty(
                "--pipeline-header-offset",
                `${header.getBoundingClientRect().height}px`,
            );
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(header);
        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (previousStage.current === active) return;
        previousStage.current = active;
        const nav = navRef.current;
        if (!nav || nav.getClientRects().length === 0) return;
        const saved = positions.current[active];
        const offset = Number.parseFloat(getComputedStyle(nav).top) || 0;
        const navTop = (nav.parentElement?.getBoundingClientRect().top ?? 0) + window.scrollY;
        // On a first visit, start at the cards only if already scrolled down.
        window.scrollTo({
            top: saved ?? Math.min(window.scrollY, navTop - offset),
            behavior: "instant",
        });
    }, [active]);

    return (
        <div className={styles.board}>
            <div ref={navRef} className={styles.navigation}>
                <StageTabs
                    active={active}
                    counts={counts}
                    onChange={(stage) => {
                        positions.current[active] = window.scrollY;
                        onChange(stage);
                    }}
                    panelId={`${id}-panel`}
                    idPrefix={id}
                    className="mx-0 px-0 pbe-0"
                />
                <p className={styles.summary}>
                    <span>
                        {deals.length} {deals.length === 1 ? "deal" : "deals"}
                    </span>
                    {totals.sale ? <span>Sale {totals.sale}</span> : null}
                    {totals.rent ? <span>Rent {totals.rent}</span> : null}
                </p>
            </div>

            <div
                id={`${id}-panel`}
                role="tabpanel"
                aria-labelledby={`${id}-${active}`}
                tabIndex={0}
                className={styles.panel}
            >
                {deals.length > 0 ? (
                    <>
                        <WindowVirtualGrid
                            key={active}
                            items={deals.slice(0, stageLimits[active])}
                            getKey={(deal) => deal.id}
                            estimateRowHeight={390}
                            gap={12}
                            ariaLabel={`${DEAL_STAGE_META[active].label} deals`}
                            renderItem={renderCard}
                        />
                        {remaining > 0 ? (
                            <Button
                                variant="outline"
                                size="lg"
                                className="inline-full"
                                onClick={() => onLoadMore(active)}
                            >
                                Load more deals <span className="tabular">({remaining})</span>
                            </Button>
                        ) : null}
                    </>
                ) : (
                    <div className={styles.empty}>
                        <p className="body-sm font-semibold text-ink">
                            No deals in {DEAL_STAGE_META[active].label.toLowerCase()}
                        </p>
                        <p className="body-sm text-ink-muted">
                            {DEAL_STAGE_META[active].emptyHint}. Choose another stage above to see
                            its deals.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
