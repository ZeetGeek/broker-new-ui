import { CalendarDays } from "lucide-react";

import { formatDateIso, formatDateShort, formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import type { TodayAgenda, TodayItem } from "./mock-data";
import { TextLinkButton } from "./text-link-button";
import { TodayTimeline } from "./today-timeline";

const TODAY_INFO = "Your full day as a timeline: what's done, what's left, and where you are now.";

/** Soft cap inside the scroll list; overflow goes to "View all visits". */
const MAX_SCROLL_ROWS = 8;

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
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="today-card-heading"
        >
            <CardLabel info={TODAY_INFO}>
                <span id="today-card-heading">
                    Today
                    <span aria-hidden> · </span>
                    <time dateTime={dateIso}>{dateLabel}</time>
                </span>
            </CardLabel>

            <EmptyState
                icon={CalendarDays}
                heading="Nothing booked today"
                description="Visits you schedule will appear here."
            >
                <TextLinkButton href="/broker/visits/new">Book a site visit</TextLinkButton>
            </EmptyState>
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
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                aria-label={
                                    `${agenda.doneCount} of ${agenda.doneCount + agenda.remainingCount} ` +
                                    `items done today, ${agenda.remainingCount} still to go`
                                }
                                className="
                                  eyebrow shrink-0 rounded-full text-ink-muted outline-none
                                  focus-visible:ring-2 focus-visible:ring-ring
                                "
                            >
                                {agenda.doneCount} done
                                <span aria-hidden> · </span>
                                {agenda.remainingCount} left
                            </button>
                        }
                    />
                    <TooltipContent side="top" align="center" className="text-pretty max-inline-64">
                        {`${agenda.doneCount} of ${agenda.doneCount + agenda.remainingCount} items today are done. ${agenda.remainingCount} still to go.`}
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="relative mbs-2 flex-1 min-block-0">
                <TodayTimeline
                    timeline={timeline}
                    doneCount={agenda.doneCount}
                    showFade={showFade}
                />

                {agenda.doneCount > 0 ? (
                    <div
                        aria-hidden
                        className={`
                          pointer-events-none absolute inset-x-0 inset-bs-0 z-10 bg-linear-to-b
                          from-surface from-25% via-surface/80 to-transparent block-6
                        `}
                    />
                ) : null}

                <div
                    className="
                      absolute inset-x-0 -inset-be-4 z-10 flex flex-col justify-end block-14
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
                        <ShortcutTooltip shortcutId="visits">
                            <TextLinkButton href="/broker/visits">View all visits</TextLinkButton>
                        </ShortcutTooltip>
                    </div>
                </div>
            </div>
        </section>
    );
}
