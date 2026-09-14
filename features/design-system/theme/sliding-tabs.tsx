"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SlidingTabOption<T extends string = string> = {
    value: T;
    label: ReactNode;
};

function movePill(
    pill: HTMLElement,
    tab: HTMLElement,
    animate: boolean,
    orientation: "horizontal" | "vertical",
) {
    const nextTransform =
        orientation === "vertical"
            ? `translateY(${tab.offsetTop}px)`
            : `translateX(${tab.offsetLeft}px)`;
    const nextSize =
        orientation === "vertical" ? `${tab.offsetHeight}px` : `${tab.offsetWidth}px`;
    const sizeProp = orientation === "vertical" ? "height" : "width";

    if (!animate) {
        const previous = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = nextTransform;
        pill.style[sizeProp] = nextSize;
        void pill.offsetWidth;
        pill.style.transition = previous;
        return;
    }

    pill.style.transform = nextTransform;
    pill.style[sizeProp] = nextSize;
}

export function SlidingTabs<T extends string>({
    value,
    onValueChange,
    options,
    ariaLabel,
    className,
    stretch = false,
    orientation = "horizontal",
}: {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly SlidingTabOption<T>[];
    ariaLabel: string;
    className?: string;
    stretch?: boolean;
    orientation?: "horizontal" | "vertical";
}) {
    const barRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLSpanElement>(null);
    const hasPainted = useRef(false);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) {
            return;
        }

        const selected = bar.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!selected) {
            return;
        }

        movePill(pill, selected, hasPainted.current, orientation);
        hasPainted.current = true;
    }, [value, options, orientation, stretch]);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) {
            return;
        }

        function sync(animate: boolean) {
            const currentBar = barRef.current;
            const currentPill = pillRef.current;
            if (!currentBar || !currentPill) {
                return;
            }
            const selected = currentBar.querySelector<HTMLElement>('[aria-selected="true"]');
            if (selected) {
                movePill(currentPill, selected, animate, orientation);
            }
        }

        function onResize() {
            sync(false);
        }

        const observer = new ResizeObserver(() => onResize());
        observer.observe(bar);
        window.addEventListener("resize", onResize);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [orientation]);

    return (
        <div
            ref={barRef}
            role="tablist"
            aria-label={ariaLabel}
            aria-orientation={orientation}
            className={cn(
                "t-tabs t-tabs-surface",
                stretch && "t-tabs-stretch",
                orientation === "vertical" && "t-tabs-vertical",
                className,
            )}
        >
            <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className="t-tab"
                        onClick={() => {
                            const bar = barRef.current;
                            const pill = pillRef.current;
                            if (bar && pill) {
                                const next = bar.querySelector<HTMLElement>(
                                    `[data-tab-value="${CSS.escape(option.value)}"]`,
                                );
                                if (next) {
                                    movePill(pill, next, hasPainted.current, orientation);
                                }
                            }
                            onValueChange(option.value);
                        }}
                        data-tab-value={option.value}
                    >
                        {option.label}
                    </button>
                );
            })}
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
