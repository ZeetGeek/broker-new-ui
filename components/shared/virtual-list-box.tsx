"use client";

import { type ReactNode, useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualListBox<T>({
    items,
    getKey,
    renderItem,
    estimateItemHeight,
    gap = 8,
    virtualizeAfter = 40,
    ariaLabel,
    className = "max-block-[min(60dvh,32rem)]",
}: {
    items: T[];
    getKey: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => ReactNode;
    estimateItemHeight: number;
    gap?: number;
    virtualizeAfter?: number;
    ariaLabel: string;
    className?: string;
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
                className={`flex flex-col overflow-y-auto overscroll-contain ${className}`}
                style={{ gap }}
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
            className={`overflow-y-auto overscroll-contain ${className}`}
        >
            <div className="relative inline-full" style={{ height: virtualizer.getTotalSize() }}>
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
                                transform: `translateY(${virtualItem.start}px)`,
                                paddingBlockEnd: gap,
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
