import Link from "next/link";

import { CircleCheck, MapPin, Phone } from "lucide-react";

import { formatDateIso, formatDateShort, formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";

import { CardLabel } from "./card-label";
import type { TodayAgenda, TodayItem } from "./mock-data";

const TODAY_INFO = "Your full day as a timeline: what's done, what's left, and where you are now.";

/** Soft cap inside the scroll list; overflow goes to "View all visits". */
const MAX_SCROLL_ROWS = 5;

const CARD_SHELL = `
  flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface
  p-8 shadow-sm
  md:block-full
`;

const LINK_CLASS = cn(
    "body-sm inline-flex items-center gap-1 font-semibold text-brand outline-none",
    "hover:text-brand-text",
    "focus-visible:ring-3 focus-visible:ring-ring/30",
);

export type TodayCardProps = {
    agenda: TodayAgenda;
    now: Date;
    className?: string;
};

type TimelineEntry =
    | { type: "now"; key: string; label: string }
    | { type: "item"; key: string; item: TodayItem; showDivider: boolean };

function sortByTime(items: TodayItem[]): TodayItem[] {
    return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

function buildTimeline(items: TodayItem[], nowLabel: string): TimelineEntry[] {
    const entries: TimelineEntry[] = [];
    let nowPlaced = false;

    items.forEach((item, index) => {
        const shouldPlaceNow = !nowPlaced && item.state !== "done";
        if (shouldPlaceNow) {
            entries.push({ type: "now", key: "now", label: nowLabel });
            nowPlaced = true;
        }

        entries.push({
            type: "item",
            key: item.id,
            item,
            showDivider: index > 0 && !shouldPlaceNow,
        });
    });

    return entries;
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

function NowMarker({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-3 py-1" aria-label={`Now, ${label}`}>
            <p className="body-sm shrink-0 font-semibold whitespace-nowrap text-urgent">
                now · {label}
            </p>
            <span className="flex-1 bg-urgent/70 block-px min-inline-0" aria-hidden />
        </li>
    );
}

function EmptyToday({ now, className }: { now: Date; className?: string }) {
    const dateLabel = formatDateShort(now);
    const dateIso = formatDateIso(now);

    return (
        <section className={cn(CARD_SHELL, className)} aria-labelledby="today-card-heading">
            <CardLabel info={TODAY_INFO}>
                <span id="today-card-heading">
                    Today
                    <span aria-hidden> · </span>
                    <time dateTime={dateIso}>{dateLabel}</time>
                </span>
            </CardLabel>
            <div className="mbs-5 flex flex-1 flex-col">
                <p className="h5 text-ink">Nothing scheduled today.</p>
                <p className="body mbs-1 text-ink-muted">
                    A free day is fine. Book a visit when a client is ready.
                </p>
                <div className="pts-5 mbs-auto">
                    <Link href="/broker/visits/new" className={LINK_CLASS}>
                        Book a site visit
                        <span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function TodayCard({ agenda, now, className }: TodayCardProps) {
    if (agenda.items.length === 0) {
        return <EmptyToday now={now} className={className} />;
    }

    const dateLabel = formatDateShort(now);
    const dateIso = formatDateIso(now);
    const nowLabel = formatTimeIn(now);
    const sorted = sortByTime(agenda.items);
    const scrollItems = sorted.slice(0, MAX_SCROLL_ROWS);
    const timeline = buildTimeline(scrollItems, nowLabel);
    const showFade = scrollItems.length > 3;

    return (
        <section className={cn(CARD_SHELL, className)} aria-labelledby="today-card-heading">
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={TODAY_INFO}>
                    <span id="today-card-heading">
                        Today
                        <span aria-hidden> · </span>
                        <time dateTime={dateIso}>{dateLabel}</time>
                    </span>
                </CardLabel>
                <p className="body-sm shrink-0 font-medium text-ink-muted">
                    {agenda.doneCount} done
                    <span aria-hidden> · </span>
                    {agenda.remainingCount} left
                </p>
            </div>

            <div className="relative mbs-1 flex-1 min-block-52">
                <ScrollArea className="absolute inset-0 **:data-[slot=scroll-area-scrollbar]:hidden">
                    <ul className={cn("flex flex-col", showFade && "pbe-14")}>
                        {timeline.map((entry) => {
                            if (entry.type === "now") {
                                return <NowMarker key={entry.key} label={entry.label} />;
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
                </ScrollArea>

                <div
                    className={cn(
                        "absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end block-16",
                    )}
                >
                    {showFade ? (
                        <div
                            aria-hidden
                            className={`
                              pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                              from-35% via-surface/85 to-transparent
                            `}
                        />
                    ) : null}
                    <div className="relative flex justify-center pbe-0.5">
                        <Link href="/broker/visits" className={LINK_CLASS}>
                            View all visits
                            <span aria-hidden>→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
