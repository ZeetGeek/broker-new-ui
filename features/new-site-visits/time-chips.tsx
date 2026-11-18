"use client";

import { formatVisitTime } from "@/lib/visits/time";

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
    invalid: boolean;
}) {
    if (!ready) {
        return (
            <p className="body-sm text-ink-muted">
                Choose the client, property, length and date to see free times.
            </p>
        );
    }
    if (loading && starts.length === 0) {
        return (
            <p role="status" className="body-sm text-ink-muted">
                Finding free times…
            </p>
        );
    }
    if (failed) {
        return (
            <p role="alert" className="body-sm text-ink-muted">
                Free times couldn&apos;t be loaded. Check your connection and try again.
            </p>
        );
    }
    if (starts.length === 0) {
        return <p className="body-sm text-ink-muted">No free times this day. Try another date.</p>;
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
