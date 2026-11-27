"use client";

import { type CSSProperties, type ReactNode, useCallback, useLayoutEffect, useRef } from "react";

import { measuredPxToRem, pxToRem } from "@/lib/styles/rem";
import { cn } from "@/lib/utils";

import styles from "./sliding-tabs.module.css";

export type SlidingTabOption<Value extends string | number = string> = {
    value: Value;
    label: ReactNode;
    ariaLabel?: string;
    id?: string;
    count?: number | null;
};

export type SlidingTabsProps<Value extends string | number> = {
    value: Value;
    options: readonly SlidingTabOption<Value>[];
    onValueChange: (value: Value) => void;
    label: string;
    panelId?: string;
    className?: string;
    tabClassName?: string;
    /** Keep the selected tab visible inside a horizontally scrolling strip. */
    revealActiveTab?: boolean;
    /** Whole horizontal bar height, including padding (or each vertical row). Numbers are design pixels. */
    height?: number | string;
    stretch?: boolean;
    orientation?: "horizontal" | "vertical";
};

/** Surface-pill tabs with a caller-selected height across input modes. */
export function SlidingTabs<Value extends string | number>({
    value,
    options,
    onValueChange,
    label,
    panelId,
    className,
    tabClassName,
    revealActiveTab = false,
    height = 36,
    stretch = false,
    orientation = "horizontal",
}: SlidingTabsProps<Value>) {
    const bar = useRef<HTMLDivElement>(null);
    const pill = useRef<HTMLSpanElement>(null);
    const painted = useRef(false);
    const placed = useRef<string | null>(null);
    const optionKeys = JSON.stringify(options.map((option) => option.value));
    const position = useCallback(
        (animate: boolean) => {
            const indicator = pill.current;
            const active = bar.current?.querySelector<HTMLElement>('[aria-selected="true"]');
            if (!indicator) return;
            indicator.hidden = !active;
            if (!active) {
                placed.current = null;
                return;
            }
            const vertical = orientation === "vertical";
            const offset = vertical ? active.offsetTop : active.offsetLeft;
            const size = vertical ? active.offsetHeight : active.offsetWidth;
            const geometry = `${orientation}:${offset}:${size}`;
            // A repeated ResizeObserver delivery must not cancel an in-flight slide.
            if (placed.current === geometry) return;
            placed.current = geometry;
            const previousTransition = indicator.style.transition;
            if (!animate) indicator.style.transition = "none";
            indicator.style.transform = `${vertical ? "translateY" : "translateX"}(${measuredPxToRem(offset)})`;
            indicator.style[vertical ? "width" : "height"] = "";
            indicator.style[vertical ? "height" : "width"] = measuredPxToRem(size);
            if (!animate) {
                void indicator.offsetWidth;
                indicator.style.transition = previousTransition;
            }
        },
        [orientation],
    );

    useLayoutEffect(() => {
        position(painted.current);
        painted.current = true;
    }, [value, options, height, stretch, position]);

    const reveal = useCallback(() => {
        if (!revealActiveTab || orientation !== "horizontal") return;
        const viewport = bar.current;
        const active = viewport?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!viewport || !active) return;
        const padding = 4;
        const start = active.offsetLeft - padding;
        const end = active.offsetLeft + active.offsetWidth + padding;
        if (start < viewport.scrollLeft) viewport.scrollLeft = Math.max(0, start);
        else if (end > viewport.scrollLeft + viewport.clientWidth)
            viewport.scrollLeft = end - viewport.clientWidth;
    }, [orientation, revealActiveTab]);

    useLayoutEffect(() => {
        reveal();
    }, [value, optionKeys, reveal]);

    useLayoutEffect(() => {
        if (!bar.current) return;
        const observer = new ResizeObserver(() => {
            position(false);
            reveal();
        });
        observer.observe(bar.current);
        bar.current
            .querySelectorAll<HTMLElement>('[role="tab"]')
            .forEach((tab) => observer.observe(tab));
        return () => observer.disconnect();
    }, [optionKeys, position, reveal]);

    return (
        <div
            ref={bar}
            role="tablist"
            aria-label={label}
            aria-orientation={orientation}
            style={
                {
                    "--tabs-height": typeof height === "number" ? pxToRem(height) : height,
                } as CSSProperties
            }
            className={cn(
                "t-tabs t-tabs-surface t-tabs-compact",
                stretch && "t-tabs-stretch",
                orientation === "vertical" && "t-tabs-vertical",
                styles.tabs,
                className,
            )}
        >
            <span ref={pill} className="t-tabs-pill" aria-hidden />
            {options.map((option, index) => (
                // Div, not button: tab labels may include nested controls (e.g. manage menus).
                <div
                    key={option.value}
                    id={option.id}
                    role="tab"
                    aria-label={option.ariaLabel}
                    aria-selected={value === option.value}
                    aria-controls={panelId}
                    tabIndex={value === option.value ? 0 : -1}
                    className={cn("t-tab", styles.tab, tabClassName)}
                    onClick={(event) => {
                        if (
                            event.target instanceof Element &&
                            event.target.closest("[data-sliding-tab-action]")
                        ) {
                            return;
                        }
                        onValueChange(option.value);
                    }}
                    onKeyDown={(event) => {
                        // Keep arrow navigation inside dropdowns from reaching their menu.
                        if (
                            event.target instanceof Element &&
                            event.target.closest("[data-sliding-tab-action]")
                        ) {
                            return;
                        }
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            onValueChange(option.value);
                            return;
                        }
                        let next: number;
                        if (event.key === (orientation === "vertical" ? "ArrowDown" : "ArrowRight"))
                            next = (index + 1) % options.length;
                        else if (
                            event.key === (orientation === "vertical" ? "ArrowUp" : "ArrowLeft")
                        )
                            next = (index - 1 + options.length) % options.length;
                        else if (event.key === "Home") next = 0;
                        else if (event.key === "End") next = options.length - 1;
                        else return;
                        event.preventDefault();
                        event.stopPropagation();
                        onValueChange(options[next].value);
                        bar.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
                    }}
                >
                    {option.label}
                    {option.count != null && option.count > 0 && (
                        <span data-slot="tab-count" className={styles.count}>
                            {option.count > 99 ? "99+" : option.count}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

export function TabsPanel({
    panelKey,
    className,
    children,
}: {
    panelKey: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div key={panelKey} className={cn("t-tabs-panel", className)}>
            {children}
        </div>
    );
}
