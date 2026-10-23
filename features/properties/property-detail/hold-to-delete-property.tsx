"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Trash2 } from "@/components/shared/icons";

import styles from "./property-detail.module.css";

const HOLD_MS = 1200;

export function HoldToDeleteProperty({
    disabled,
    onComplete,
}: {
    disabled: boolean;
    onComplete: () => Promise<void>;
}) {
    const [holding, setHolding] = useState(false);
    const [pending, setPending] = useState(false);
    const frame = useRef<number | null>(null);
    const started = useRef<number | null>(null);
    const locked = useRef(false);
    const fill = useRef<HTMLSpanElement>(null);

    const cancel = useCallback(() => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        started.current = null;
        if (fill.current) fill.current.style.transform = "scaleX(0)";
        setHolding(false);
    }, []);

    useEffect(() => {
        const cancelWhenHidden = () => {
            if (document.hidden) cancel();
        };
        window.addEventListener("blur", cancel);
        document.addEventListener("visibilitychange", cancelWhenHidden);
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
            window.removeEventListener("blur", cancel);
            document.removeEventListener("visibilitychange", cancelWhenHidden);
        };
    }, [cancel]);

    useEffect(() => {
        if (!disabled) return;
        const resetFrame = requestAnimationFrame(cancel);
        return () => cancelAnimationFrame(resetFrame);
    }, [disabled, cancel]);

    const start = () => {
        if (disabled || locked.current || started.current !== null) return;
        started.current = performance.now();
        setHolding(true);
        const tick = (now: number) => {
            if (started.current === null) return;
            const progress = Math.min((now - started.current) / HOLD_MS, 1);
            if (fill.current) fill.current.style.transform = `scaleX(${progress})`;
            if (progress < 1) {
                frame.current = requestAnimationFrame(tick);
                return;
            }
            locked.current = true;
            cancel();
            setPending(true);
            void onComplete().finally(() => {
                locked.current = false;
                setPending(false);
            });
        };
        frame.current = requestAnimationFrame(tick);
    };

    return (
        <button
            type="button"
            className={styles.holdDelete}
            disabled={disabled || pending}
            aria-describedby="property-delete-hint"
            aria-busy={pending}
            onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                start();
            }}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
            onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                if (
                    event.clientX < bounds.left ||
                    event.clientX > bounds.right ||
                    event.clientY < bounds.top ||
                    event.clientY > bounds.bottom
                )
                    cancel();
            }}
            onBlur={cancel}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
                if (event.key === "Escape") cancel();
                if (event.key !== " " && event.key !== "Enter") return;
                event.preventDefault();
                if (!event.repeat) start();
            }}
            onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") cancel();
            }}
            onClick={(event) => event.preventDefault()}
        >
            <span ref={fill} className={styles.holdDeleteFill} aria-hidden />
            <span className={styles.holdDeleteContent}>
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                <span>
                    {pending
                        ? "Deleting property…"
                        : holding
                          ? "Keep holding to delete…"
                          : "Hold to delete property"}
                </span>
            </span>
        </button>
    );
}
