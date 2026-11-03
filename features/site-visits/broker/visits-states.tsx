"use client";

import { CalendarDays, Clock3, RotateCw, SlidersHorizontal } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

export function VisitsTabSkeleton({ kind = "visits" }: { kind?: "visits" | "slots" | "requests" }) {
    if (kind === "slots") {
        return (
            <div aria-label="Loading slots" aria-busy="true" className="animate-pulse space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <div
                        key={index}
                        className="
                          overflow-hidden rounded-card border border-border-warm bg-surface
                          shadow-sm
                        "
                    >
                        <div
                            className="
                              grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4
                              sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5
                            "
                        >
                            <div
                                className="
                                  shrink-0 rounded-inner bg-surface-muted block-20 inline-20
                                  sm:block-24 sm:inline-24
                                "
                            />
                            <div className="flex-1 space-y-1.5">
                                <div className="flex gap-1.5">
                                    <div className="rounded-lg bg-brand-soft block-6 inline-20" />
                                    <div className="rounded-lg bg-surface-muted block-6 inline-20" />
                                </div>
                                <div className="rounded-sm bg-brand-soft block-5 inline-20" />
                                <div
                                    className="
                                      rounded-sm bg-surface-muted block-3.5 inline-full
                                      max-inline-96
                                    "
                                />
                            </div>
                            <div
                                className="
                                  hidden rounded-control bg-surface-muted block-11 inline-40
                                  sm:block
                                "
                            />
                        </div>
                        <div aria-hidden className="mx-4 border-bs border-border-warm sm:mx-5" />
                        <div className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-sm bg-surface-muted block-4 inline-36" />
                                <div className="ms-auto flex items-center gap-2">
                                    <div className="rounded-sm bg-surface-muted block-3 inline-28" />
                                    <div
                                        className="
                                          rounded-control bg-surface-muted block-8 inline-8
                                        "
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 4 }, (_, dayIndex) => (
                                    <div key={dayIndex} className="space-y-2">
                                        <div className="rounded-sm bg-border-warm block-3 inline-28" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-control bg-brand-soft block-11" />
                                            <div className="rounded-control bg-brand-soft block-11" />
                                            <div className="rounded-control bg-brand-soft block-11" />
                                            <div className="rounded-control bg-brand-soft block-11" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (kind === "requests") {
        return (
            <div aria-label="Loading requests" aria-busy="true" className="animate-pulse space-y-6">
                {Array.from({ length: 2 }, (_, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                        <div className="flex items-center justify-between gap-2 px-0.5">
                            <div className="rounded-sm bg-surface-muted block-3.5 inline-28" />
                            <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                        </div>
                        {Array.from({ length: groupIndex === 0 ? 2 : 1 }, (_, index) => (
                            <div
                                key={index}
                                className="
                                  overflow-hidden rounded-card border border-border-warm bg-surface
                                  shadow-sm
                                "
                            >
                                <div
                                    className="
                                      grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4
                                      sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5
                                    "
                                >
                                    <div
                                        className="
                                          shrink-0 rounded-inner bg-surface-muted block-20 inline-20
                                          sm:block-24 sm:inline-24
                                        "
                                    />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex gap-1.5">
                                            <div
                                                className="
                                                  rounded-lg bg-brand-soft block-6 inline-20
                                                "
                                            />
                                            <div
                                                className="
                                                  rounded-lg bg-surface-muted block-6 inline-28
                                                "
                                            />
                                        </div>
                                        <div className="rounded-sm bg-brand-soft block-5 inline-20" />
                                        <div
                                            className="
                                              rounded-sm bg-surface-muted block-3.5 inline-full
                                              max-inline-md
                                            "
                                        />
                                    </div>
                                    <div
                                        className="
                                          hidden rounded-control bg-surface-muted block-11 inline-28
                                          sm:block
                                        "
                                    />
                                </div>
                                <div
                                    aria-hidden
                                    className="mx-4 border-bs border-border-warm sm:mx-5"
                                />
                                <div className="flex gap-2 px-4 py-3 sm:px-5">
                                    <div
                                        className="
                                          rounded-control bg-surface-muted block-8 inline-24
                                        "
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            aria-label="Loading visits"
            aria-busy="true"
            className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
            {Array.from({ length: 4 }, (_, index) => (
                <div
                    key={index}
                    className="space-y-4 rounded-[20px] border border-border-warm bg-surface p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="rounded-full bg-brand-soft block-6 inline-24" />
                        <div className="rounded-full bg-surface-muted block-11 inline-11" />
                    </div>
                    <div className="flex gap-3">
                        <div className="shrink-0 rounded-xl bg-surface-muted block-20 inline-20" />
                        <div className="flex-1 space-y-3">
                            <div className="rounded-sm bg-brand-soft block-5 inline-20" />
                            <div className="rounded-sm bg-surface-muted block-4 inline-full" />
                            <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                        </div>
                    </div>
                    <div className="rounded-inner bg-surface-muted block-10" />
                    <div className="rounded-control border border-border-warm bg-surface-muted block-16" />
                    <div className="rounded-sm bg-surface-muted block-4 inline-28" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-control bg-surface-muted block-11" />
                        <div className="rounded-control bg-brand-soft block-11" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function EmptyState({
    kind,
    onPrimary,
    onSecondary,
    detail,
    primary,
}: {
    kind:
        | "no-visits"
        | "no-today"
        | "no-slots"
        | "no-exclusive-slots"
        | "no-property-slots"
        | "no-requests"
        | "slots-error";
    onPrimary?: () => void;
    onSecondary?: () => void;
    detail?: string;
    primary?: string;
}) {
    const content = {
        "no-visits": {
            icon: CalendarDays,
            title: "No visits booked yet.",
            detail: "Open slots to book your first one.",
            primary: "Browse open slots",
        },
        "no-today": {
            icon: Clock3,
            title: "Nothing today.",
            detail: "Next visit is tomorrow at 10:00 AM, Shreeji Heights.",
            primary: "View next visit",
        },
        "no-slots": {
            icon: SlidersHorizontal,
            title: "No slots match these filters.",
            detail: "Clear filters or ask an owner for a time that works.",
            primary: "Clear filters",
            secondary: "Request another time",
        },
        "no-exclusive-slots": {
            icon: SlidersHorizontal,
            title: "No open times in this range.",
            detail: "Without filters, only listings with an open client lead show. Booked times stay hidden. Pick a property in Filters or try another week.",
            primary: "Clear filters",
        },
        "no-property-slots": {
            icon: Clock3,
            title: "This owner has not published any times.",
            detail: "Ask for one that suits your client.",
            primary: "Request another time",
        },
        "no-requests": {
            icon: Clock3,
            title: "No time requests.",
            detail: "Ask an owner for a time that suits your client.",
            primary: "Request another time",
        },
        "slots-error": {
            icon: RotateCw,
            title: "Could not load slots.",
            detail: "Check your connection.",
            primary: "Try again",
        },
    }[kind];
    const Icon = content.icon;

    return (
        <section
            className="
              flex flex-col items-center justify-center rounded-card border border-dashed
              border-border-warm bg-surface px-6 py-10 text-center min-block-72
            "
        >
            <span
                className="
                  mbe-4 grid place-items-center rounded-inner bg-brand-soft text-brand-text block-12
                  inline-12
                "
            >
                <Icon aria-hidden />
            </span>
            <h2 className="h5 text-ink">{content.title}</h2>
            <p className="body-sm mbs-1 text-ink-muted max-inline-md">{detail ?? content.detail}</p>
            <div className="mbs-5 flex flex-wrap justify-center gap-2">
                {(primary ?? content.primary) && onPrimary ? (
                    <Button onClick={onPrimary}>{primary ?? content.primary}</Button>
                ) : null}
                {content.secondary && onSecondary ? (
                    <Button variant="surface" onClick={onSecondary}>
                        {content.secondary}
                    </Button>
                ) : null}
            </div>
        </section>
    );
}
