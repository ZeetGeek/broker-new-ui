"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LogOut } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { getShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { Kbd, KbdGroup } from "@/components/ui/kbd";

const HOLD_MS = 900;
const HOLD_MS_REDUCED = 300;

export type HoldToLogoutProps = {
    disabled?: boolean;
    onComplete: () => void | Promise<void>;
};

function LogoutShortcutHint() {
    const shortcut = getShortcut("logout");
    if (!shortcut?.showInProfileMenu) return null;

    return (
        <KbdGroup className="ms-auto hidden gap-0.5 sm:inline-flex">
            {shortcut.displayKeys.map((key) => (
                <Kbd
                    key={key}
                    variant="surface"
                    className="border-danger/30 px-1.5 text-[10px] tracking-normal text-danger"
                >
                    {key}
                </Kbd>
            ))}
        </KbdGroup>
    );
}

export function HoldToLogout({ disabled = false, onComplete }: HoldToLogoutProps) {
    const reduceMotion = useReducedMotion();
    const holdDurationMs = reduceMotion ? HOLD_MS_REDUCED : HOLD_MS;

    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const rafRef = useRef<number | null>(null);
    const holdStartRef = useRef<number | null>(null);
    const completedRef = useRef(false);
    const fillRef = useRef<HTMLDivElement>(null);

    const cancelHold = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        holdStartRef.current = null;
        setIsHolding(false);
        if (!completedRef.current) {
            setProgress(0);
            if (fillRef.current) {
                fillRef.current.style.width = "0%";
            }
        }
    }, []);

    const finishHold = useCallback(async () => {
        if (completedRef.current || disabled) return;
        completedRef.current = true;
        setIsComplete(true);
        setProgress(100);
        if (fillRef.current) {
            fillRef.current.style.width = "100%";
        }
        await onComplete();
    }, [disabled, onComplete]);

    const startHold = useCallback(
        (pointerId: number | null, target: HTMLElement) => {
            if (disabled || completedRef.current) return;
            if (pointerId !== null && pointerId >= 0) {
                target.setPointerCapture(pointerId);
            }
            setIsComplete(false);
            setIsHolding(true);
            holdStartRef.current = performance.now();

            const loop = (now: number) => {
                if (holdStartRef.current === null) return;

                const elapsed = now - holdStartRef.current;
                const nextProgress = Math.min(100, (elapsed / holdDurationMs) * 100);
                setProgress(nextProgress);
                if (fillRef.current) {
                    fillRef.current.style.width = `${nextProgress}%`;
                }

                if (nextProgress >= 100) {
                    rafRef.current = null;
                    void finishHold();
                    return;
                }

                rafRef.current = requestAnimationFrame(loop);
            };

            rafRef.current = requestAnimationFrame(loop);
        },
        [disabled, finishHold, holdDurationMs],
    );

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const label = disabled ? "Signing out…" : "Hold to log out";

    return (
        <button
            type="button"
            disabled={disabled}
            aria-label={label}
            className={cn(
                "t-hold-logout body-sm rounded-inner text-start block-9 inline-full",
                isHolding && "is-holding",
                isComplete && "is-complete",
            )}
            onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                startHold(event.pointerId, event.currentTarget);
            }}
            onPointerUp={(event) => {
                if (event.pointerId >= 0) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
                if (!completedRef.current) {
                    cancelHold();
                }
            }}
            onPointerCancel={(event) => {
                if (event.pointerId >= 0) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
                cancelHold();
            }}
            onPointerLeave={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                    cancelHold();
                }
            }}
            onKeyDown={(event) => {
                if (disabled || completedRef.current) return;
                if (event.key !== " " && event.key !== "Enter") return;
                event.preventDefault();
                if (!isHolding) {
                    startHold(null, event.currentTarget);
                }
            }}
            onKeyUp={(event) => {
                if (event.key !== " " && event.key !== "Enter") return;
                if (!completedRef.current) {
                    cancelHold();
                }
            }}
            onClick={(event) => event.preventDefault()}
        >
            <div
                ref={fillRef}
                className="t-hold-logout-fill"
                aria-hidden
                style={{ width: `${progress}%` }}
            />
            <span className="t-hold-logout-content">
                <LogOut aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                <span className="flex-1 min-inline-0">{label}</span>
                <LogoutShortcutHint />
            </span>
        </button>
    );
}
