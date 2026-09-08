"use client";

import { useMemo, useRef } from "react";

import { CalendarPlus, Clock3, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    EventCalendar,
    type EventCalendarApi,
    type EventCalendarRenderEventProps,
} from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import {
    EventCalendarNav,
    EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav";
import type {
    CalendarView,
    EventCalendarProposedUpdate,
} from "@/components/reui/event-calendar/event-calendar-types";
import { Button } from "@/components/ui/button";

import type { VisitItem, VisitViewer } from "@/features/site-visits/types";
import {
    toCalendarEvents,
    toCalendarResources,
    type VisitEventData,
} from "@/features/site-visits/visit-calendar-adapter";
import { VISIT_STATUS_META } from "@/features/site-visits/visit-meta";
import { canRescheduleVisit } from "@/features/site-visits/visit-permissions";
import { findConflicts, hasBlockingConflict } from "@/features/site-visits/visit-scheduling";

/**
 * Brand skin for the ReUI calendar.
 *
 * Every value is an existing token — the calendar ships neutral shadcn
 * surfaces, and this map is what makes it read as part of this product rather
 * than a component drop. Kept in one place so a palette change is one edit.
 */
const CALENDAR_CLASS_NAMES = {
    nav: "pbe-3",
    navButton: "rounded-control border-border-warm",
    title: "h5 text-ink",
    monthView: "rounded-card border-border-warm",
    monthHeader: "bg-surface-muted",
    monthDayHeader: "eyebrow text-ink-subtle",
    monthCell: "border-border-warm transition-colors duration-160 hover:bg-surface-muted/60",
    monthDayNumber: "tabular body-sm text-ink-muted",
    monthBody: "bg-surface",
    monthRow: "border-border-warm",
    timeGrid: "rounded-card border-border-warm bg-surface [--ec-gutter-width:3.75rem]",
    timeGridHeader: "bg-surface-muted",
    timeGutterLabel: "tabular body-xs text-ink-subtle",
    dayColumn: "border-border-warm",
    allDaySection: "border-border-warm bg-surface-muted/50",
    allDayLabel: "eyebrow text-ink-subtle",
    agendaView: "rounded-card border-border-warm bg-surface",
    agendaDayHeader: "bg-surface-muted",
    agendaDate: "tabular text-ink",
    noEvents: "body-sm text-ink-muted",
    resourceHeader: "body-xs font-semibold text-ink",
    event: "rounded-inner",
    moreIndicator: "body-xs font-semibold text-brand-text",
    morePopover: "rounded-card border-border-warm shadow-lg",
    dropIndicator: "bg-brand",
    slotDraft: "bg-brand/10",
} as const;

type VisitCalendarProps = {
    visits: VisitItem[];
    viewer: VisitViewer;
    /** Uncontrolled starting view; the switcher takes over after mount. */
    defaultView?: CalendarView;
    now: Date;
    onOpenVisit: (visitId: string) => void;
    /** A drag landed on a new slot. */
    onReschedule: (visitId: string, start: Date, durationMin: number) => void;
    /** Clicking empty space, when the viewer may propose a time. */
    onPickSlot?: (start: Date) => void;
    onNewVisit?: () => void;
    className?: string;
};

/**
 * The visits calendar — month, week, day, agenda and per-property columns.
 *
 * Built on the ReUI event calendar with the domain rules layered on top:
 * `canDropEvent` refuses a drop that would double-book, and `onEventUpdate`
 * routes an accepted drop back through the consent gate rather than silently
 * moving a visit the other side already agreed to.
 */
export function VisitCalendar({
    visits,
    viewer,
    defaultView = "month",
    now,
    onOpenVisit,
    onReschedule,
    onPickSlot,
    onNewVisit,
    className,
}: VisitCalendarProps) {
    const apiRef = useRef<EventCalendarApi<VisitEventData> | null>(null);

    const events = useMemo(() => toCalendarEvents(visits, viewer, now), [visits, viewer, now]);
    const resources = useMemo(() => toCalendarResources(visits), [visits]);

    /**
     * Refuses a drop that would overlap another live visit. This runs on every
     * pointer move during a drag, so the chip reads as invalid *before* the
     * drop — the broker never has to undo a clash they could not see coming.
     */
    const canDropEvent = (update: EventCalendarProposedUpdate<VisitEventData>) => {
        const visit = update.event.data?.visit;
        if (!visit) return true;

        const conflicts = findConflicts(
            { start: update.start, end: update.end, locality: visit.property.locality },
            visits,
            { excludeVisitId: visit.id },
        );
        return !hasBlockingConflict(conflicts);
    };

    const handleEventUpdate = (update: EventCalendarProposedUpdate<VisitEventData>) => {
        const visit = update.event.data?.visit;
        if (!visit) return false;

        const durationMin = Math.round((update.end.getTime() - update.start.getTime()) / 60_000);

        // The mutation sends the visit back through `proposed` for the other
        // side to re-confirm — see visit-permissions.statusAfterReschedule.
        onReschedule(visit.id, update.start, durationMin);
        return true;
    };

    return (
        <EventCalendar<VisitEventData>
            events={events}
            defaultView={defaultView}
            resources={resources}
            apiRef={apiRef}
            timeZone="Asia/Kolkata"
            weekStartsOn={0}
            dayStartHour={7}
            dayEndHour={22}
            interval={60}
            snapDuration={15}
            scrollToHour={Math.max(7, now.getHours() - 1)}
            nowIndicator
            renderEvent={renderVisitChip}
            classNames={CALENDAR_CLASS_NAMES}
            onEventClick={(occurrence) => onOpenVisit(occurrence.event.id)}
            onSlotClick={(slot) => onPickSlot?.(slot.date)}
            canDropEvent={canDropEvent}
            onEventUpdate={handleEventUpdate}
            className={cn("block-144 inline-full", className)}
        >
            <div className="flex flex-wrap items-center gap-2">
                <EventCalendarNav className="flex-1 min-inline-0" />
                {onNewVisit ? (
                    <EventCalendarToolbar>
                        <Button size="sm" onClick={onNewVisit}>
                            <CalendarPlus aria-hidden />
                            Propose a visit
                        </Button>
                    </EventCalendarToolbar>
                ) : null}
            </div>

            <EventCalendarContent />
        </EventCalendar>
    );
}

/**
 * The chip.
 *
 * Says the three things a chip has room for: whether it needs you, what the
 * property is, and when. The "needs you" signal is a ring rather than only a
 * colour — docs/DESIGN.md §1.4 forbids encoding meaning in colour alone, and a
 * broker scanning a month grid should find the ones waiting on them without
 * reading a legend.
 */
function renderVisitChip({ occurrence, view }: EventCalendarRenderEventProps<VisitEventData>) {
    const data = occurrence.event.data;
    if (!data) return undefined;

    const { visit, needsAction } = data;
    const meta = VISIT_STATUS_META[visit.status];
    const isCompact = view === "month";
    const isLocked = occurrence.event.readOnly === true;

    const time = occurrence.start.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });

    return (
        <span
            className={cn(
                "flex items-center gap-1.5 inline-full min-inline-0",
                needsAction && "rounded-sm ring-2 ring-urgent",
            )}
        >
            <span
                aria-hidden
                className={cn("shrink-0 rounded-full block-1.5 inline-1.5", meta.dotClass)}
            />

            <span className="truncate font-medium">
                {visit.property.configLabel} · {visit.property.locality}
            </span>

            {/* A visit nobody can move any more says so, rather than leaving
                the user to find out by dragging and watching it snap back. */}
            {isLocked ? (
                <Lock aria-hidden className="ms-auto shrink-0 opacity-60 block-3 inline-3" />
            ) : null}

            {!isCompact ? (
                <span className="tabular ms-auto flex shrink-0 items-center gap-1 opacity-80">
                    <Clock3 aria-hidden className="block-3 inline-3" />
                    {visit.durationMin}m
                </span>
            ) : (
                <span className="tabular ms-auto shrink-0 text-[10px] opacity-70">{time}</span>
            )}
        </span>
    );
}

/** Re-exported so callers can ask whether a drag is even allowed. */
export { canRescheduleVisit };
