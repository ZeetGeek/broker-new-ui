"use client";

import { formatVisitTime } from "@/lib/visits/time";

import { EmptyState } from "@/components/empty-state";
import { CalendarCheck, Clock, RefreshCw } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

/** Free start times as tappable chips. Only times the server says will book. */
export function TimeChips({
    labelledBy,
    ready,
    loading,
    failed,
    starts,
    value,
    onChange,
    onRetry,
    invalid,
}: {
    labelledBy: string;
    /** Client, property, length and date are all chosen. */
    ready: boolean;
    loading: boolean;
    failed: boolean;
    starts: string[];
    value: string;
    onChange: (startAt: string) => void;
    onRetry?: () => void;
    invalid: boolean;
}) {
    if (!ready) {
        return (
            <p className="body-sm text-ink-muted">
                Choose a client, property, length, and date to see available times.
            </p>
        );
    }
    if (loading && starts.length === 0) {
        return (
            <p role="status" className="body-sm text-ink-muted">
                Finding times…
            </p>
        );
    }
    if (failed) {
        return (
            <EmptyState
                size="card"
                variant="error"
                icon={Clock}
                heading="Could not load available times"
                description="Check your connection and try again."
                action={
                    onRetry ? { label: "Try again", icon: RefreshCw, onClick: onRetry } : undefined
                }
            />
        );
    }
    if (starts.length === 0) {
        return (
            <EmptyState
                size="card"
                icon={CalendarCheck}
                heading="No times are available"
                description="Try another date or a shorter visit length."
            />
        );
    }
    return (
        <div
            role="group"
            aria-labelledby={labelledBy}
            aria-busy={loading || undefined}
            className="flex flex-wrap gap-2"
        >
            {starts.map((startAt) => (
                <Button
                    key={startAt}
                    type="button"
                    size="sm"
                    variant={value === startAt ? "accent" : "outline"}
                    aria-pressed={value === startAt}
                    aria-invalid={invalid || undefined}
                    onClick={() => onChange(startAt)}
                >
                    {formatVisitTime(startAt)}
                </Button>
            ))}
        </div>
    );
}
