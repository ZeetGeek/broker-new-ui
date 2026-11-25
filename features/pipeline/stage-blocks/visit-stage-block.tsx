import { formatDateShort, formatTimeIn, isSameCalendarDay } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { IconButton } from "@/components/shared/icon-button";
import { Calendar, CalendarClock, CalendarPlus } from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealItem } from "@/features/pipeline/types";
import { canOpenVisitAction, scheduleVisitHref } from "@/features/pipeline/visit-link";

import styles from "../deal-card.module.css";

/** Booked visits expose rescheduling; Visits resolves and checks the actual booking. */
export function VisitStageBlock({ deal }: { deal: DealItem }) {
    const date = deal.nextVisitAt ? new Date(deal.nextVisitAt) : null;
    const when = date && Number.isFinite(date.getTime()) ? date : null;
    const isToday = when != null && isSameCalendarDay(when, new Date());
    const canOpenAction = canOpenVisitAction(deal);
    const label = when ? "Reschedule visit" : "Schedule visit";
    const StatusIcon = when ? CalendarClock : Calendar;
    const ActionIcon = when ? CalendarClock : CalendarPlus;
    const dateLabel = when
        ? `${formatDateShort(when)}, ${formatTimeIn(when)}`
        : "No visit booked yet";

    return (
        <div
            className={cn(
                styles.visitBlock,
                "rounded-inner border border-stage-3-soft/70 p-2.5 text-pending",
                isToday ? "bg-stage-3-soft/30" : "bg-stage-3-soft/15",
            )}
        >
            <StatusIcon aria-hidden strokeWidth={1.75} className="shrink-0 block-4.5 inline-4.5" />
            <p className={cn("body-xs font-medium text-ink", styles.stageInfo)} title={dateLabel}>
                {when ? (
                    <span className="sr-only">
                        {isToday ? "Site visit today: " : "Site visit scheduled: "}
                    </span>
                ) : null}
                {when ? <time dateTime={when.toISOString()}>{dateLabel}</time> : dateLabel}
            </p>
            {canOpenAction ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <IconButton
                                size="sm"
                                tone="warning"
                                aria-label={label}
                                className={styles.stageControl}
                                nativeButton={false}
                                render={
                                    <Link
                                        href={scheduleVisitHref(deal)}
                                        onClick={(event) => event.stopPropagation()}
                                    />
                                }
                            />
                        }
                    >
                        <ActionIcon aria-hidden strokeWidth={1.75} className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}
