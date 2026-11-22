"use client";

import { type ReactNode, type UIEventHandler, useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import { measuredPxToRem } from "@/lib/styles/rem";

export function VirtualListBox<T>({
    items,
    getKey,
    renderItem,
    estimateItemHeight,
    gap = 8,
    virtualizeAfter = 40,
    ariaLabel,
    className = "max-block-[min(60dvh,32rem)]",
    onScroll,
}: {
    items: T[];
    getKey: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => ReactNode;
    estimateItemHeight: number;
    gap?: number;
    virtualizeAfter?: number;
    ariaLabel: string;
    className?: string;
    onScroll?: UIEventHandler<HTMLDivElement>;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const shouldVirtualize = items.length > virtualizeAfter;
    // TanStack Virtual owns mutable measurement functions; React Compiler must
    // leave this hook instance alone so scroll measurements stay current.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: shouldVirtualize ? items.length : 0,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => estimateItemHeight + gap,
        overscan: 5,
        getItemKey: (index) => getKey(items[index]!, index),
    });

    if (!shouldVirtualize) {
        return (
            <div
                role="list"
                aria-label={ariaLabel}
                onScroll={onScroll}
                className={`flex flex-col overflow-y-auto overscroll-contain ${className}`}
                style={{ gap: measuredPxToRem(gap) }}
            >
                {items.map((item, index) => (
                    <div key={getKey(item, index)} role="listitem">
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            role="list"
            aria-label={ariaLabel}
            onScroll={onScroll}
            className={`overflow-y-auto overscroll-contain ${className}`}
        >
            <div
                className="relative inline-full"
                style={{ height: measuredPxToRem(virtualizer.getTotalSize()) }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const item = items[virtualItem.index]!;
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            role="listitem"
                            className="absolute inset-s-0 inset-bs-0 inline-full"
                            style={{
                                transform: `translateY(${measuredPxToRem(virtualItem.start)})`,
                                paddingBlockEnd: measuredPxToRem(gap),
                            }}
                        >
                            {renderItem(item, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
