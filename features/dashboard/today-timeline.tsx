"use client";

import Link from "next/link";
import { useEffect, useRef, type RefObject } from "react";

import { CircleCheck, MapPin, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TodayItem } from "./mock-data";

const SCROLL_HIDE = `
  overflow-y-auto overscroll-contain
  [scrollbar-width:none]
  [-ms-overflow-style:none]
  [&::-webkit-scrollbar]:hidden
`;

export type TimelineEntry =
    | { type: "now"; key: string; label: string }
    | { type: "item"; key: string; item: TodayItem; showDivider: boolean };

/** How much of the completed stack peeks above the Now marker. */
const COMPLETED_PEEK_PX = 52;

function elementScrollTop(container: HTMLElement, el: HTMLElement) {
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
}

/** Pin Now at top when nothing is done; otherwise leave a small done-row peek above it. */
function scrollTimelineFocus(container: HTMLElement, nowEl: HTMLElement, doneCount: number) {
    const nowTop = elementScrollTop(container, nowEl);
    if (doneCount === 0) {
        container.scrollTop = nowTop;
        return;
    }

    container.scrollTop = Math.max(0, nowTop - COMPLETED_PEEK_PX);
}

function ItemIcon({ item }: { item: TodayItem }) {
    const className = cn(
        "shrink-0 block-4 inline-4",
        item.state === "done" && "text-brand",
        item.state !== "done" && item.isNext && "text-brand",
        item.state !== "done" && !item.isNext && "text-ink-subtle",
    );

    if (item.state === "done") {
        return <CircleCheck aria-hidden className={className} strokeWidth={1.75} />;
    }
    if (item.kind === "call") {
        return <Phone aria-hidden className={className} strokeWidth={1.75} />;
    }
    return <MapPin aria-hidden className={className} strokeWidth={1.75} />;
}

function TimelineRow({ item, showDivider }: { item: TodayItem; showDivider: boolean }) {
    const isDone = item.state === "done";
    const isNext = Boolean(item.isNext) && !isDone;
    const isBlocked = item.state === "blocked";

    return (
        <li className={cn(showDivider && "border-bs border-border-warm")}>
            <Link
                href={item.href}
                className={`
                  grid grid-cols-[auto_auto_1fr] items-start gap-x-4 py-3.5 outline-none
                  focus-visible:ring-3 focus-visible:ring-ring/30
                `}
            >
                <time
                    className={cn(
                        "body tabular shrink-0 whitespace-nowrap min-inline-18",
                        isDone && "font-medium text-ink-subtle",
                        isNext && "font-semibold text-ink",
                        !isDone && !isNext && "font-medium text-ink-muted",
                    )}
                >
                    {item.timeLabel}
                </time>
                <span className="mbs-0.5 flex items-center justify-center block-5 inline-5">
                    <ItemIcon item={item} />
                </span>
                <div className="min-inline-0">
                    <p
                        className={cn(
                            "body",
                            isDone && "font-medium text-ink-subtle line-through",
                            isNext && "font-semibold text-ink",
                            !isDone && !isNext && "font-medium text-ink",
                        )}
                    >
                        {item.title}
                    </p>
                    <p
                        className={cn(
                            "body-sm mbs-0.5",
                            isBlocked
                                ? "text-urgent"
                                : isDone
                                  ? "text-ink-subtle"
                                  : "text-ink-muted",
                        )}
                    >
                        {item.subtitle}
                    </p>
                </div>
            </Link>
        </li>
    );
}

function NowMarker({ label, markerRef }: { label: string; markerRef: RefObject<HTMLLIElement | null> }) {
    return (
        <li
            ref={markerRef}
            className="flex items-center gap-3 py-1"
            aria-label={`Now, ${label}`}
        >
            <p className="body-sm shrink-0 font-semibold whitespace-nowrap text-urgent">
                Now · {label}
            </p>
            <span className="flex-1 bg-urgent/70 block-px min-inline-0" aria-hidden />
        </li>
    );
}

export type TodayTimelineProps = {
    timeline: TimelineEntry[];
    doneCount: number;
    showFade: boolean;
};

export function TodayTimeline({ timeline, doneCount, showFade }: TodayTimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const container = scrollRef.current;
        const nowEl = nowRef.current;
        if (!container || !nowEl) {
            return;
        }

        // Wait a frame so row heights are settled before measuring.
        const frame = requestAnimationFrame(() => {
            scrollTimelineFocus(container, nowEl, doneCount);
        });

        return () => cancelAnimationFrame(frame);
    }, [doneCount]);

    return (
        <div ref={scrollRef} className={cn("absolute inset-0", SCROLL_HIDE)}>
            <ul className={cn("flex flex-col", showFade && "pbe-7")}>
                {timeline.map((entry) => {
                    if (entry.type === "now") {
                        return <NowMarker key={entry.key} label={entry.label} markerRef={nowRef} />;
                    }
                    return (
                        <TimelineRow
                            key={entry.key}
                            item={entry.item}
                            showDivider={entry.showDivider}
                        />
                    );
                })}
            </ul>
        </div>
    );
}
