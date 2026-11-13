"use client";

import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import styles from "./sliding-tabs.module.css";

export function SlidingTabs<Value extends string | number>({
    value,
    options,
    onValueChange,
    label,
    panelId,
    className,
    tabClassName,
}: {
    value: Value;
    options: readonly { value: Value; label: ReactNode; ariaLabel?: string }[];
    onValueChange: (value: Value) => void;
    label: string;
    panelId: string;
    className?: string;
    tabClassName?: string;
}) {
    const bar = useRef<HTMLDivElement>(null);
    const pill = useRef<HTMLSpanElement>(null);
    const painted = useRef(false);
    const optionKeys = JSON.stringify(options.map((option) => option.value));
    const position = useCallback((animate: boolean) => {
        const indicator = pill.current;
        const active = bar.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!indicator || !active) return;
        const previousTransition = indicator.style.transition;
        if (!animate) indicator.style.transition = "none";
        indicator.style.transform = `translateX(${active.offsetLeft}px)`;
        indicator.style.width = `${active.offsetWidth}px`;
        if (!animate) {
            void indicator.offsetWidth;
            indicator.style.transition = previousTransition;
        }
    }, []);

    useLayoutEffect(() => {
        position(painted.current);
        painted.current = true;
    }, [value, options, position]);

    useLayoutEffect(() => {
        if (!bar.current) return;
        const observer = new ResizeObserver(() => position(false));
        observer.observe(bar.current);
        bar.current
            .querySelectorAll<HTMLElement>('[role="tab"]')
            .forEach((tab) => observer.observe(tab));
        return () => observer.disconnect();
    }, [optionKeys, position]);

    return (
        <div
            ref={bar}
            role="tablist"
            aria-label={label}
            className={cn("t-tabs t-tabs-surface t-tabs-compact", styles.tabs, className)}
        >
            <span ref={pill} className="t-tabs-pill" aria-hidden />
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-label={option.ariaLabel}
                    aria-selected={value === option.value}
                    aria-controls={panelId}
                    tabIndex={value === option.value ? 0 : -1}
                    className={cn("t-tab", styles.tab, tabClassName)}
                    onClick={() => onValueChange(option.value)}
                    onKeyDown={(event) => {
                        let next: number;
                        if (event.key === "ArrowRight") next = (index + 1) % options.length;
                        else if (event.key === "ArrowLeft")
                            next = (index - 1 + options.length) % options.length;
                        else if (event.key === "Home") next = 0;
                        else if (event.key === "End") next = options.length - 1;
                        else return;
                        event.preventDefault();
                        onValueChange(options[next].value);
                        bar.current
                            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                            [next]?.focus();
                    }}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
