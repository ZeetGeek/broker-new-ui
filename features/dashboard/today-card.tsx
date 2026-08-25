import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";
import type { SiteVisitItem } from "./mock-data";

export type TodayCardProps = {
    visits: SiteVisitItem[];
    className?: string;
};

export function TodayCard({ visits, className }: TodayCardProps) {
    return (
        <section
            className={cn("flex flex-col rounded-card bg-surface p-8 shadow-sm", className)}
        >
            <CardLabel info="Site visits scheduled for today — times, properties, and clients.">
                Today
            </CardLabel>

            {visits.length === 0 ? (
                <p className="body mbs-4 text-ink-muted">No site visits scheduled for today.</p>
            ) : (
                <ul className="mbs-1 flex flex-col">
                    {visits.map((visit, index) => (
                        <li
                            key={visit.id}
                            className={
                                index > 0 ? "mbs-3 border-bs border-border-warm pbs-3" : "mbs-4"
                            }
                        >
                            <p className="body font-semibold text-ink">
                                {visit.timeLabel} · {visit.title}
                            </p>
                            <p className="body-sm mbs-0.5 text-ink-muted">
                                {visit.clientName} · {visit.statusLabel}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
