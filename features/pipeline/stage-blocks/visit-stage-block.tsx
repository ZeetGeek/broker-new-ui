import { formatDateShort, formatTimeIn, isSameCalendarDay } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Calendar, CalendarClock, Pencil } from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealItem } from "@/features/pipeline/types";
import { canScheduleVisit, scheduleVisitHref } from "@/features/pipeline/visit-link";

import styles from "../deal-card.module.css";

/**
 * Site visit stage: the booked visit, or a prompt to book one. On exclusive
 * listings both links open Visits for this deal (see `scheduleVisitHref`);
 * owner-listed deals show the date only.
 */
export function VisitStageBlock({ deal }: { deal: DealItem }) {
    const when = deal.nextVisitAt ? new Date(deal.nextVisitAt) : null;
    const isToday = when != null && isSameCalendarDay(when, new Date());
    const href = scheduleVisitHref(deal);
    const canSchedule = canScheduleVisit(deal);
    const StatusIcon = when ? CalendarClock : Calendar;

    return (
        <div
            className={cn(
                styles.visitBlock,
                "flex items-center gap-2.5 rounded-inner border border-stage-3-soft/70 p-2.5",
                isToday ? "bg-stage-3-soft/30" : "bg-stage-3-soft/15",
            )}
        >
            <span className="flex shrink-0 items-center justify-center text-pending block-4.5 inline-4.5">
                <StatusIcon aria-hidden strokeWidth={1.75} className="block-4.5 inline-4.5" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                <p className="body-xs leading-snug font-medium text-ink">
                    {when
                        ? `${formatDateShort(when)}, ${formatTimeIn(when)}`
                        : "No visit booked yet"}
                </p>
                {when ? (
                    <p className="body-xs leading-relaxed text-pending">
                        {isToday ? "Site visit today" : "Site visit scheduled"}
                    </p>
                ) : null}
            </div>
            {!canSchedule ? null : when ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="link"
                                size="icon-sm"
                                nativeButton={false}
                                className="justify-end px-0 text-pending"
                                render={
                                    <Link
                                        href={href}
                                        aria-label="Reschedule this visit"
                                        onClick={(event) => event.stopPropagation()}
                                    />
                                }
                            />
                        }
                    >
                        <Pencil aria-hidden strokeWidth={1.75} className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>Reschedule on Visits</TooltipContent>
                </Tooltip>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    className={cn("shrink-0 text-xs", styles.scheduleAction)}
                    render={<Link href={href} onClick={(event) => event.stopPropagation()} />}
                >
                    Schedule visit
                </Button>
            )}
        </div>
    );
}
