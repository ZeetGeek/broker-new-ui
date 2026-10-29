"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PropertyMenuIcon } from "@/components/shared/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const HOLD_MS = 1200;

/** Shared destructive menu confirmation; release or leave the item to cancel. */
export function HoldToConfirmMenuItem({
    onComplete,
    label,
    icon,
}: {
    onComplete: () => void;
    label: string;
    icon: "trash" | "lost";
}) {
    const [holding, setHolding] = useState(false);
    const frame = useRef<number | null>(null);
    const started = useRef<number | null>(null);
    const completed = useRef(false);
    const fill = useRef<HTMLSpanElement>(null);

    const cancel = useCallback(() => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        started.current = null;
        if (fill.current) fill.current.style.transform = "scaleX(0)";
        setHolding(false);
    }, []);

    useEffect(() => {
        const onHidden = () => {
            if (document.hidden) cancel();
        };
        window.addEventListener("blur", cancel);
        document.addEventListener("visibilitychange", onHidden);
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
            window.removeEventListener("blur", cancel);
            document.removeEventListener("visibilitychange", onHidden);
        };
    }, [cancel]);

    const start = () => {
        if (completed.current || started.current !== null) return;
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
            completed.current = true;
            cancel();
            onComplete();
        };
        frame.current = requestAnimationFrame(tick);
    };

    return (
        <DropdownMenuItem
            variant="destructive"
            closeOnClick={false}
            label={label}
            aria-label={label}
            aria-description="Press and hold for 1.2 seconds. You can also hold Enter or Space. Release to cancel."
            title="Hold for 1.2 seconds to confirm. Release to cancel."
            className="
              body-sm relative cursor-pointer overflow-hidden rounded-inner bg-danger-soft px-3
              font-medium text-danger! select-none min-block-11
              focus:bg-danger-soft! focus:text-danger!
              data-highlighted:bg-danger-soft! data-highlighted:text-danger!
            "
            onPointerDown={(event) => {
                if (event.button !== 0 || !event.isPrimary) return;
                event.preventDefault();
                event.currentTarget.focus();
                start();
            }}
            onPointerUp={cancel}
            onPointerLeave={cancel}
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
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
            onBlur={cancel}
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={(event) => {
                if (event.key === "Escape") cancel();
                if (event.key !== " " && event.key !== "Enter") return;
                event.preventDefault();
                if (!event.repeat) start();
            }}
            onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    cancel();
                }
            }}
            onClick={(event) => event.preventDefault()}
        >
            <span
                ref={fill}
                aria-hidden
                className="
                  pointer-events-none absolute inset-0 origin-left bg-danger/15 rtl:origin-right
                "
                style={{ transform: "scaleX(0)" }}
            />
            <span className="relative flex items-center gap-3">
                <PropertyMenuIcon
                    name={icon}
                    aria-hidden
                    className="menu-stroke-icon is-danger shrink-0 block-4.5 inline-4.5"
                />
                <span>{holding ? "Keep holding…" : label}</span>
            </span>
        </DropdownMenuItem>
    );
}
