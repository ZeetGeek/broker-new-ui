import Link from "next/link";

import { Calendar, Pencil } from "lucide-react";

import { formatDateShort, formatTimeIn, isSameCalendarDay } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealItem } from "@/features/pipeline/types";

export function VisitStageBlock({ deal }: { deal: DealItem }) {
    if (!deal.nextVisitAt) {
        return <p className="body-xs text-ink-muted">No visit booked yet</p>;
    }

    const when = new Date(deal.nextVisitAt);
    const now = new Date();
    const isToday = isSameCalendarDay(when, now);
    const whenLabel = `${formatDateShort(when)}, ${formatTimeIn(when)}`;

    return (
        <div
            className={cn(
                "flex items-center justify-between gap-2 rounded-inner",
                isToday ? "bg-brand-soft px-2 py-1.5" : "bg-transparent",
            )}
        >
            <div className="flex items-center gap-1.5 min-inline-0">
                <Calendar
                    aria-hidden
                    className={cn(
                        "shrink-0 block-3.5 inline-3.5",
                        isToday ? "text-brand-text" : "text-ink-muted",
                    )}
                    strokeWidth={1.75}
                />
                <p
                    className={cn(
                        "body-xs truncate",
                        isToday ? "font-semibold text-brand-text" : "text-ink",
                    )}
                >
                    {whenLabel}
                </p>
                {isToday ? (
                    <span
                        className="
                          body-xs shrink-0 rounded-sm bg-surface px-1.5 py-0.5 font-semibold
                          text-brand-text
                        "
                    >
                        Today
                    </span>
                ) : null}
            </div>

            <Tooltip>
                <TooltipTrigger
                    render={
                        <Link
                            href="/broker/visits"
                            aria-label="Reschedule this visit"
                            onClick={(event) => event.stopPropagation()}
                            className="
                              flex shrink-0 items-center justify-center rounded-sm text-ink
                              block-control-sm inline-control-sm
                              hover:bg-surface
                            "
                        />
                    }
                >
                    <Pencil aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                </TooltipTrigger>
                <TooltipContent>Reschedule on Visits</TooltipContent>
            </Tooltip>
        </div>
    );
}
