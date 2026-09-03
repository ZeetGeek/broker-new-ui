"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const KNOB_MAX_DEG = 270;
const POINTER_OFFSET_DEG = 225;

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
    };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export type BudgetRotaryKnobProps = {
    /** Discrete step count including the zero position (e.g. 9 presets → 8). */
    stepCount: number;
    /** Controlled step index 0 .. stepCount. */
    value: number;
    onValueChange: (stepIndex: number) => void;
    /** Large readout in the hub. */
    displayValue: string;
    /** Secondary line under the readout. */
    displayHint: string;
    className?: string;
};

export function BudgetRotaryKnob({
    stepCount,
    value,
    onValueChange,
    displayValue,
    displayHint,
    className,
}: BudgetRotaryKnobProps) {
    const gradientId = useId();
    const dialRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const prevAngle = useRef(0);
    const [angle, setAngle] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const maxSteps = Math.max(1, stepCount);
    const stepSize = KNOB_MAX_DEG / maxSteps;

    useEffect(() => {
        if (dragging.current) return;
        setAngle(clamp(value, 0, maxSteps) * stepSize);
    }, [value, maxSteps, stepSize]);

    const getPointerAngle = useCallback((clientX: number, clientY: number) => {
        const node = dialRef.current;
        if (!node) return 0;
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    }, []);

    const commitAngle = useCallback(
        (nextAngle: number, snap: boolean) => {
            const clamped = clamp(nextAngle, 0, KNOB_MAX_DEG);
            const snapped = snap ? Math.round(clamped / stepSize) * stepSize : clamped;
            setAngle(snapped);
            onValueChange(Math.round(snapped / stepSize));
        },
        [onValueChange, stepSize],
    );

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            event.preventDefault();
            dialRef.current?.setPointerCapture(event.pointerId);
            dragging.current = true;
            setIsDragging(true);
            prevAngle.current = getPointerAngle(event.clientX, event.clientY);
        },
        [getPointerAngle],
    );

    const onPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragging.current) return;
            const current = getPointerAngle(event.clientX, event.clientY);
            let delta = current - prevAngle.current;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            prevAngle.current = current;
            setAngle((prev) => {
                const next = clamp(prev + delta, 0, KNOB_MAX_DEG);
                onValueChange(Math.round(next / stepSize));
                return next;
            });
        },
        [getPointerAngle, onValueChange, stepSize],
    );

    const onPointerUp = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragging.current) return;
            dragging.current = false;
            setIsDragging(false);
            dialRef.current?.releasePointerCapture(event.pointerId);
            setAngle((prev) => {
                const snapped = Math.round(prev / stepSize) * stepSize;
                onValueChange(Math.round(snapped / stepSize));
                return snapped;
            });
        },
        [onValueChange, stepSize],
    );

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                commitAngle(angle + stepSize, true);
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                commitAngle(angle - stepSize, true);
            }
            if (event.key === "Home") {
                event.preventDefault();
                commitAngle(0, true);
            }
            if (event.key === "End") {
                event.preventDefault();
                commitAngle(KNOB_MAX_DEG, true);
            }
        },
        [angle, commitAngle, stepSize],
    );

    const trackStart = POINTER_OFFSET_DEG;
    const trackEnd = POINTER_OFFSET_DEG + KNOB_MAX_DEG;
    const progressEnd = POINTER_OFFSET_DEG + angle;
    const size = 196;
    const cx = size / 2;
    const cy = size / 2;
    const trackRadius = 76;
    const strokeWidth = 10;
    const capRadius = strokeWidth / 2;
    const progressSweep = Math.max(0.01, angle);
    const progressEndAngle = trackStart + progressSweep;
    const gradientStart = polarToCartesian(cx, cy, trackRadius, trackStart);
    const gradientEnd = polarToCartesian(cx, cy, trackRadius, progressEndAngle);
    const startCap = gradientStart;
    const endCap = gradientEnd;

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div
                ref={dialRef}
                role="slider"
                tabIndex={0}
                aria-valuemin={0}
                aria-valuemax={maxSteps}
                aria-valuenow={value}
                aria-valuetext={displayHint}
                aria-label="Budget"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                className="
                  relative mx-auto aspect-square touch-none outline-none select-none inline-full
                  max-inline-46
                  focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
                  focus-visible:ring-offset-surface
                "
            >
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="pointer-events-none absolute inset-0 block-full inline-full"
                    aria-hidden
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            gradientUnits="userSpaceOnUse"
                            x1={gradientStart.x}
                            y1={gradientStart.y}
                            x2={gradientEnd.x}
                            y2={gradientEnd.y}
                        >
                            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="var(--color-brand)" />
                        </linearGradient>
                    </defs>

                    <path
                        d={describeArc(cx, cy, trackRadius, trackStart, trackEnd)}
                        fill="none"
                        stroke="var(--color-border-warm)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    <path
                        d={describeArc(cx, cy, trackRadius, trackStart, progressEndAngle)}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                    />
                    {/* Solid caps so the gradient never splits across a round linecap. */}
                    <circle
                        cx={startCap.x}
                        cy={startCap.y}
                        r={capRadius}
                        fill="var(--color-brand)"
                        fillOpacity="0.5"
                    />
                    <circle cx={endCap.x} cy={endCap.y} r={capRadius} fill="var(--color-brand)" />

                    {Array.from({ length: maxSteps + 1 }, (_, index) => {
                        const tickAngle = POINTER_OFFSET_DEG + index * stepSize;
                        const outer = polarToCartesian(cx, cy, trackRadius + 14, tickAngle);
                        const inner = polarToCartesian(cx, cy, trackRadius + 8, tickAngle);
                        const active = index <= value;
                        return (
                            <line
                                key={index}
                                x1={inner.x}
                                y1={inner.y}
                                x2={outer.x}
                                y2={outer.y}
                                stroke={active ? "var(--color-brand)" : "var(--color-border-warm)"}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>

                <div
                    className="
                      absolute inset-[18%] rounded-full border border-border-warm bg-surface
                      shadow-sm
                    "
                    aria-hidden
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `rotate(${angle + POINTER_OFFSET_DEG}deg)`,
                            transition: isDragging
                                ? "none"
                                : "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                    >
                        <span
                            className="
                              absolute inset-s-1/2 inset-bs-[10%] -translate-x-1/2 rounded-full
                              bg-brand block-2.5 inline-2.5
                            "
                        />
                    </div>
                </div>

                <div
                    className="
                      pointer-events-none absolute inset-0 flex flex-col items-center justify-center
                      gap-1 px-7 text-center
                    "
                >
                    <p
                        className="
                          font-display text-[1.5rem] leading-none font-semibold tracking-tight
                          text-ink tabular-nums
                        "
                    >
                        {displayValue}
                    </p>
                    {displayHint !== displayValue ? (
                        <p className="body-xs text-balance text-ink-muted">{displayHint}</p>
                    ) : null}
                </div>
            </div>

            <p className="body-xs -mbs-3 mbe-1 text-center text-ink-subtle">
                Drag the dial · snaps when you release
            </p>
        </div>
    );
}
