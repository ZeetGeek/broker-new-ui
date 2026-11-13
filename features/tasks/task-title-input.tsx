"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";

import styles from "./planner.module.css";

function resizeTitle(field: HTMLTextAreaElement) {
    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
}

/** Wrap while typing, retaining Enter to save and Shift+Enter for a new line. */
export function TaskTitleInput({
    value,
    onKeyDown,
    maxLength = 160,
    ...props
}: ComponentProps<"textarea">) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const limitId = useId();
    const length = String(value ?? "").length;
    const atLimit = length >= maxLength;
    useLayoutEffect(() => {
        if (ref.current) resizeTitle(ref.current);
    }, [value]);
    useLayoutEffect(() => {
        const field = ref.current;
        if (!field) return;
        let width = field.getBoundingClientRect().width;
        const observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width === width) return;
            width = entry.contentRect.width;
            resizeTitle(field);
        });
        observer.observe(field);
        return () => observer.disconnect();
    }, []);
    return (
        <div className={styles.taskTitleField}>
            <textarea
                {...props}
                ref={ref}
                rows={1}
                value={value}
                maxLength={maxLength}
                aria-describedby={[props["aria-describedby"], limitId].filter(Boolean).join(" ")}
                onKeyDown={(event) => {
                    onKeyDown?.(event);
                    if (
                        !event.defaultPrevented &&
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                    ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                    }
                }}
            />
            <small id={limitId} className={styles.titleLimit}>
                <span>
                    {length}/{maxLength}
                </span>
                <span role="status">{atLimit ? " · Limit reached" : " characters"}</span>
            </small>
        </div>
    );
}
