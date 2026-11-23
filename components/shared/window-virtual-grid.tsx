"use client";

import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { measuredPxToRem } from "@/lib/styles/rem";

type ColumnBreakpoint = {
    minWidth: number;
    columns: number;
};

const NO_BREAKPOINTS: ColumnBreakpoint[] = [];

function columnCountAt(width: number, breakpoints: ColumnBreakpoint[]): number {
    let count = 1;
    for (const breakpoint of breakpoints) {
        if (width >= breakpoint.minWidth) count = breakpoint.columns;
    }
    return count;
}

export function WindowVirtualGrid<T>({
    items,
    getKey,
    renderItem,
    estimateRowHeight,
    gap = "card-grid",
    singleColumnGap,
    breakpoints = NO_BREAKPOINTS,
    overscan = 3,
    virtualizeAfter = 40,
    ariaLabel,
    gridClassName,
}: {
    items: T[];
    getKey: (item: T) => string;
    renderItem: (item: T, index: number) => ReactNode;
    estimateRowHeight: number;
    /** Numeric rendered pixels, or the shared responsive card-grid spacing token. */
    gap?: number | "card-grid";
    /** Tighter spacing for narrow, single-column lists, including virtual rows. */
    singleColumnGap?: number;
    breakpoints?: ColumnBreakpoint[];
    overscan?: number;
    virtualizeAfter?: number;
    ariaLabel?: string;
    /** CSS grid columns for the first paint, before JavaScript measures the viewport. */
    gridClassName?: string;
}) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(1);
    const useCardGridGap = gap === "card-grid";
    const [tokenGap, setTokenGap] = useState(0);
    const effectiveGap = useCardGridGap
        ? tokenGap
        : columnCount === 1
          ? (singleColumnGap ?? gap)
          : gap;
    const [scrollMargin, setScrollMargin] = useState(0);
    const measuredRowHeight = useRef(estimateRowHeight);

    useLayoutEffect(() => {
        const measure = () => {
            setColumnCount(columnCountAt(window.innerWidth, breakpoints));
            const node = parentRef.current;
            if (node) {
                setScrollMargin(node.getBoundingClientRect().top + window.scrollY);
                if (useCardGridGap) {
                    const renderedGap = Number.parseFloat(window.getComputedStyle(node).rowGap);
                    if (Number.isFinite(renderedGap)) setTokenGap(renderedGap);
                }
            }
        };

        measure();
        window.addEventListener("resize", measure);
        const observer = new ResizeObserver(measure);
        if (parentRef.current) observer.observe(parentRef.current);

        return () => {
            window.removeEventListener("resize", measure);
            observer.disconnect();
        };
    }, [breakpoints, useCardGridGap]);

    const rows = useMemo(() => {
        const next: Array<Array<{ item: T; index: number }>> = [];
        for (let index = 0; index < items.length; index += columnCount) {
            next.push(
                items.slice(index, index + columnCount).map((item, offset) => ({
                    item,
                    index: index + offset,
                })),
            );
        }
        return next;
    }, [columnCount, items]);
    const shouldVirtualize = items.length > virtualizeAfter;

    useLayoutEffect(() => {
        if (!gridClassName || shouldVirtualize) return;
        const children = parentRef.current?.children;
        if (!children?.length) return;
        // Reuse the real first row when pagination crosses the virtualization threshold.
        const height = Math.max(
            ...Array.from(children)
                .slice(0, columnCount)
                .map((child) => child.getBoundingClientRect().height),
        );
        if (height > 0) measuredRowHeight.current = height;
    }, [columnCount, gridClassName, items, shouldVirtualize]);

    const virtualizer = useWindowVirtualizer({
        count: shouldVirtualize ? rows.length : 0,
        estimateSize: () =>
            (gridClassName ? measuredRowHeight.current : estimateRowHeight) + effectiveGap,
        overscan,
        scrollMargin,
    });

    useLayoutEffect(() => {
        if (shouldVirtualize) virtualizer.measure();
    }, [columnCount, effectiveGap, shouldVirtualize, virtualizer]);

    if (!shouldVirtualize) {
        return (
            <div
                ref={parentRef}
                role="list"
                aria-label={ariaLabel}
                className={gridClassName ?? "grid inline-full"}
                style={{
                    gridTemplateColumns: gridClassName
                        ? undefined
                        : `repeat(${columnCount}, minmax(0, 1fr))`,
                    gap: useCardGridGap ? "var(--card-grid-gap)" : measuredPxToRem(effectiveGap),
                }}
            >
                {items.map((item, index) => (
                    <div key={getKey(item)} role="listitem" className="flex flex-col min-inline-0">
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            role="list"
            aria-label={ariaLabel}
            className="relative inline-full"
            style={{
                rowGap: useCardGridGap ? "var(--card-grid-gap)" : undefined,
                height: measuredPxToRem(Math.max(0, virtualizer.getTotalSize() - effectiveGap)),
            }}
        >
            {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index] ?? [];
                return (
                    <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="absolute inset-s-0 inset-bs-0 inline-full"
                        style={{
                            transform: `translateY(${measuredPxToRem(virtualRow.start - scrollMargin)})`,
                            paddingBlockEnd: measuredPxToRem(effectiveGap),
                        }}
                    >
                        <div
                            className="grid"
                            style={{
                                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                                columnGap: measuredPxToRem(effectiveGap),
                            }}
                        >
                            {row.map(({ item, index }) => (
                                <div
                                    key={getKey(item)}
                                    role="listitem"
                                    className="flex flex-col min-inline-0"
                                >
                                    {renderItem(item, index)}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
