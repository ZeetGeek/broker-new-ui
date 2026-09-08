"use client";

import { useMemo, useState } from "react";

import { CircleAlert, TriangleAlert, Zap } from "lucide-react";

import { formatShowingWhen } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Button } from "@/components/ui/button";

import {
    VISIT_DURATION_OPTIONS,
    type VisitItem,
    type VisitViewer,
} from "@/features/site-visits/types";
import { rescheduleConsequence } from "@/features/site-visits/visit-permissions";
import {
    findConflicts,
    freeWindowsOnDay,
    hasBlockingConflict,
    nextFreeSlot,
} from "@/features/site-visits/visit-scheduling";

type VisitRescheduleModalProps = {
    visit: VisitItem | null;
    viewer: VisitViewer;
    /** Every other visit, for conflict checking. */
    allVisits: VisitItem[];
    open: boolean;
    now: Date;
    isBusy: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (visitId: string, scheduledAt: string, durationMin: number) => void;
};

function toLocalInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours(),
    )}:${pad(date.getMinutes())}`;
}

/**
 * Pick a new time, with the clash shown before the commit rather than after.
 *
 * The conflict check runs live against every other live visit — an overlap
 * blocks the button, a tight travel gap only warns. The distinction matters:
 * two flats in the same tower half an hour apart is fine, and a product that
 * refused it would be wrong more often than the broker is.
 */
export function VisitRescheduleModal({
    visit,
    viewer,
    allVisits,
    open,
    now,
    isBusy,
    onOpenChange,
    onConfirm,
}: VisitRescheduleModalProps) {
    const initial = visit ? new Date(visit.scheduledAt) : now;
    const [value, setValue] = useState(() => toLocalInputValue(initial));
    const [durationMin, setDurationMin] = useState(visit?.durationMin ?? 45);
    const [prevVisitId, setPrevVisitId] = useState(visit?.id);

    // Re-seed when a different visit opens the same modal instance.
    if (visit && visit.id !== prevVisitId) {
        setPrevVisitId(visit.id);
        setValue(toLocalInputValue(new Date(visit.scheduledAt)));
        setDurationMin(visit.durationMin);
    }

    const picked = useMemo(() => new Date(value), [value]);
    const isValidDate = !Number.isNaN(picked.getTime());

    const conflicts = useMemo(() => {
        if (!visit || !isValidDate) return [];
        return findConflicts(
            {
                start: picked,
                end: new Date(picked.getTime() + durationMin * 60_000),
                locality: visit.property.locality,
            },
            allVisits,
            { excludeVisitId: visit.id },
        );
    }, [allVisits, durationMin, isValidDate, picked, visit]);

    const blocked = hasBlockingConflict(conflicts);
    const isPast = isValidDate && picked.getTime() < now.getTime();

    /** Free half-hour windows on the picked day, so the user has somewhere to go. */
    const suggestions = useMemo(() => {
        if (!visit || !isValidDate) return [];
        return freeWindowsOnDay(picked, durationMin, allVisits).slice(0, 6);
    }, [allVisits, durationMin, isValidDate, picked, visit]);

    if (!visit) return null;

    const handleNextFree = () => {
        const slot = nextFreeSlot(now, durationMin, allVisits, {
            locality: visit.property.locality,
        });
        if (slot) setValue(toLocalInputValue(slot));
    };

    const canSubmit = isValidDate && !blocked && !isPast && !isBusy;

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title="Suggest another time"
            description={rescheduleConsequence(visit, viewer)}
            footer={
                <AppModalFooter
                    primaryLabel="Send suggestion"
                    primaryDisabled={!canSubmit}
                    onPrimary={() => onConfirm(visit.id, picked.toISOString(), durationMin)}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                />
            }
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="visit-when" className="body-sm font-medium text-ink">
                        New date and time
                    </label>
                    <input
                        id="visit-when"
                        type="datetime-local"
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        className="
                          body rounded-control border-2 border-border-warm bg-surface px-4 text-ink
                          block-control-xl
                          focus-visible:border-brand focus-visible:outline-none
                        "
                    />

                    <Button
                        size="sm"
                        variant="ghost"
                        className="self-start"
                        onClick={handleNextFree}
                    >
                        <Zap aria-hidden />
                        Use my next free slot
                    </Button>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="body-sm font-medium text-ink">How long</span>
                    <div className="flex flex-wrap gap-2">
                        {VISIT_DURATION_OPTIONS.map((option) => (
                            <Button
                                key={option}
                                size="sm"
                                variant={durationMin === option ? "default" : "outline"}
                                aria-pressed={durationMin === option}
                                onClick={() => setDurationMin(option)}
                            >
                                {option} min
                            </Button>
                        ))}
                    </div>
                </div>

                {isPast ? (
                    <p role="alert" className="body-sm flex items-start gap-2 text-danger">
                        <CircleAlert aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" />
                        That time has already passed. Pick a later one.
                    </p>
                ) : null}

                {conflicts.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                        {conflicts.map((conflict) => (
                            <li
                                key={`${conflict.kind}-${conflict.against.id}`}
                                className={cn(
                                    "body-sm flex items-start gap-2 rounded-inner p-3",
                                    conflict.kind === "overlap"
                                        ? "bg-danger-soft text-danger"
                                        : "bg-urgent-soft text-urgent",
                                )}
                            >
                                {conflict.kind === "overlap" ? (
                                    <CircleAlert
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 block-4 inline-4"
                                    />
                                ) : (
                                    <TriangleAlert
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 block-4 inline-4"
                                    />
                                )}
                                <span>
                                    {conflict.message}{" "}
                                    <span className="opacity-80">
                                        {formatShowingWhen(
                                            new Date(conflict.against.scheduledAt),
                                            now,
                                        )}
                                        .
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {suggestions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <p className="eyebrow">Free that day</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((slot) => (
                                <Button
                                    key={slot.toISOString()}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setValue(toLocalInputValue(slot))}
                                >
                                    {slot.toLocaleTimeString("en-IN", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </AppModal>
    );
}
