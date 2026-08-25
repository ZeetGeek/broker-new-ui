import Link from "next/link";

import { formatDateIso, formatDateShort, formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { TodayAgenda, TodayItem } from "./mock-data";
import { TodayTimeline } from "./today-timeline";

const TODAY_INFO = "Your full day as a timeline: what's done, what's left, and where you are now.";

/** Soft cap inside the scroll list; overflow goes to "View all visits". */
const MAX_SCROLL_ROWS = 8;

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

function sortByTime(items: TodayItem[]): TodayItem[] {
    return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

function buildTimeline(items: TodayItem[], nowLabel: string) {
    const entries: Array<
        | { type: "now"; key: string; label: string }
        | { type: "item"; key: string; item: TodayItem; showDivider: boolean }
    > = [];
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

function EmptyToday({ now, className }: { now: Date; className?: string }) {
    const dateLabel = formatDateShort(now);
    const dateIso = formatDateIso(now);

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="today-card-heading"
        >
            <CardLabel info={TODAY_INFO}>
                <span id="today-card-heading">
                    Today
                    <span aria-hidden> · </span>
                    <time dateTime={dateIso}>{dateLabel}</time>
                </span>
            </CardLabel>
            <div className="mbs-4 flex flex-1 flex-col min-block-0">
                <p className="h5 text-ink">Nothing scheduled today.</p>
                <p className="body mbs-1 text-ink-muted">
                    A free day is fine. Book a visit when a client is ready.
                </p>
                <div className="pts-3 mbs-auto">
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
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="today-card-heading"
        >
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

            <div className="relative mbs-2 flex-1 min-block-0">
                <TodayTimeline
                    timeline={timeline}
                    doneCount={agenda.doneCount}
                    showFade={showFade}
                />

                <div
                    className="
                      absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end block-14
                    "
                >
                    {showFade ? (
                        <div
                            aria-hidden
                            className={`
                              pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                              from-40% via-surface/90 to-transparent
                            `}
                        />
                    ) : null}
                    <div className="relative flex justify-center">
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
