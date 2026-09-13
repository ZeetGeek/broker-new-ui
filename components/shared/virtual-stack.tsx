"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualStack<T>({ items, estimateSize, renderItem, getKey }: { items: T[]; estimateSize: number; renderItem: (item: T, index: number) => ReactNode; getKey: (item: T) => string }) {
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({ count: items.length, getScrollElement: () => parentRef.current, estimateSize: () => estimateSize, getItemKey: (index) => getKey(items[index]), overscan: 5 });
    return <div ref={parentRef} className="
      overflow-y-auto pe-1 max-block-[calc(100dvh-10rem)] min-block-[520px]
    " style={{ contain: "strict" }}><div className="relative inline-full" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((row) => <div key={row.key} ref={virtualizer.measureElement} data-index={row.index} className="
      absolute inset-s-0 inset-bs-0 pbe-4 inline-full
    " style={{ transform: `translateY(${row.start}px)` }}>{renderItem(items[row.index], row.index)}</div>)}</div></div>;
}

