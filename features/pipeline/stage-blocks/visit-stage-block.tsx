import Link from "next/link";

import { Icon } from "@iconify/react";

import { formatDateShort, formatTimeIn, isSameCalendarDay } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealItem } from "@/features/pipeline/types";

export function VisitStageBlock({ deal }: { deal: DealItem }) {
    const when = deal.nextVisitAt ? new Date(deal.nextVisitAt) : null;
    const isToday = when != null && isSameCalendarDay(when, new Date());

    return (
        <div
            className={cn(
                "flex items-center gap-2.5 rounded-inner border border-stage-3-soft/70 px-3 py-1",
                isToday ? "bg-stage-3-soft/30" : "bg-stage-3-soft/15",
            )}
        >
            <span className="flex shrink-0 items-center justify-center text-pending block-4.5 inline-4.5">
                <Icon
                    icon={when ? "tabler:calendar-event" : "tabler:calendar"}
                    aria-hidden
                    className="block-4.5 inline-4.5"
                />
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
            {when ? (
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
                                        href="/broker/visits"
                                        aria-label="Reschedule this visit"
                                        onClick={(event) => event.stopPropagation()}
                                    />
                                }
                            />
                        }
                    >
                        <Icon icon="tabler:pencil" aria-hidden className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>Reschedule on Visits</TooltipContent>
                </Tooltip>
            ) : (
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    className="px-0 text-xs text-pending"
                    render={
                        <Link href="/broker/visits" onClick={(event) => event.stopPropagation()} />
                    }
                >
                    Visits
                    <Icon icon="tabler:chevron-right" aria-hidden />
                </Button>
            )}
        </div>
    );
}
