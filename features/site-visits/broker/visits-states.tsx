import { CalendarDays, Clock3, RotateCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VisitsTabSkeleton({ kind = "visits" }: { kind?: "visits" | "slots" | "requests" }) {
    return (
        <div aria-label={`Loading ${kind}`} aria-busy="true" className="animate-pulse space-y-3">
            {Array.from({ length: kind === "slots" ? 4 : 3 }, (_, index) => (
                <div key={index} className="rounded-card border border-border-warm bg-surface p-4">
                    <div className="flex gap-4">
                        <div className="rounded-inner bg-surface-muted block-16 inline-20" />
                        <div className="flex-1 space-y-3">
                            <div className="rounded-sm bg-surface-muted block-4 inline-1/2" />
                            <div className="rounded-sm bg-surface-muted block-3 inline-2/3" />
                            <div className="flex gap-2 pbs-2">
                                <div className="rounded-control bg-surface-muted block-10 inline-24" />
                                <div className="rounded-control bg-surface-muted block-10 inline-24" />
                                <div className="rounded-control bg-surface-muted block-10 inline-24" />
                            </div>
                        </div>
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
}: {
    kind: "no-visits" | "no-today" | "no-slots" | "no-property-slots" | "no-requests" | "slots-error";
    onPrimary?: () => void;
    onSecondary?: () => void;
}) {
    const content = {
        "no-visits": { icon: CalendarDays, title: "No visits booked yet.", detail: "Open slots to book your first one.", primary: "Browse open slots" },
        "no-today": { icon: Clock3, title: "Nothing today.", detail: "Next visit is tomorrow at 10:00 AM, Shreeji Heights.", primary: "View next visit" },
        "no-slots": { icon: SlidersHorizontal, title: "No slots match these filters.", detail: "Clear filters or ask an owner for a time that works.", primary: "Clear filters", secondary: "Request another time" },
        "no-property-slots": { icon: Clock3, title: "This owner has not published any times.", detail: "Ask for one that suits your buyer.", primary: "Request another time" },
        "no-requests": { icon: Clock3, title: "No time requests.", detail: "Ask an owner for a time that suits your buyer.", primary: "Request another time" },
        "slots-error": { icon: RotateCw, title: "Could not load slots.", detail: "Check your connection.", primary: "Try again" },
    }[kind];
    const Icon = content.icon;

    return (
        <section className="
          flex flex-col items-center justify-center rounded-card border border-dashed
          border-border-warm bg-surface px-6 py-10 text-center min-block-72
        ">
            <span className="
              mbe-4 grid place-items-center rounded-inner bg-brand-soft text-brand-text block-12
              inline-12
            "><Icon aria-hidden /></span>
            <h2 className="h5 text-ink">{content.title}</h2>
            <p className="body-sm mbs-1 text-ink-muted max-inline-md">{content.detail}</p>
            <div className="mbs-5 flex flex-wrap justify-center gap-2">
                {content.primary && onPrimary ? <Button onClick={onPrimary}>{content.primary}</Button> : null}
                {content.secondary && onSecondary ? <Button variant="surface" onClick={onSecondary}>{content.secondary}</Button> : null}
            </div>
        </section>
    );
}

