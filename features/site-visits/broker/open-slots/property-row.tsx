"use client";

import { memo, useMemo, useState } from "react";

import { ChevronDown, MapPin } from "lucide-react";

import { formatInrCompact } from "@/lib/format/inr";
import { cn } from "@/lib/utils";
import { formatVisitDayHeading, istDateKey } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import type { PropertyWithSlots, VisitSlot } from "@/features/site-visits/broker/model";
import { SlotRail } from "@/features/site-visits/broker/open-slots/slot-rail";

export const PropertyRow = memo(function PropertyRow({
    item,
    buyerSelected,
    hideFull,
    onBook,
    onOpenVisit,
    onRequest,
    inlineError,
}: {
    item: PropertyWithSlots;
    buyerSelected: boolean;
    hideFull: boolean;
    onBook: (slot: VisitSlot) => void;
    onOpenVisit: (id: string) => void;
    onRequest: () => void;
    inlineError?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const dates = useMemo(() => {
        const grouped = new Map<string, VisitSlot[]>();
        for (const slot of item.slots) {
            if (new Date(slot.startsAt).getTime() < Date.now()) continue;
            if (hideFull && (slot.status === "full" || slot.bookedCount >= slot.capacity)) continue;
            const key = istDateKey(slot.startsAt);
            grouped.set(key, [...(grouped.get(key) ?? []), slot]);
        }
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [hideFull, item.slots]);
    const shown = expanded ? dates : dates.slice(0, 2);

    return (
        <article tabIndex={-1} className={cn(`
          rounded-card border border-border-warm bg-surface p-4 outline-none
          focus-within:border-brand/40
        `, inlineError && `border-danger/35`)}>
            <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-start">
                <div className="
                  relative overflow-hidden rounded-inner bg-surface-muted block-[72px] inline-24
                ">
                    <AppImage src={item.property.coverUrl ?? "/properties/1.jpg"} alt="" fill sizes="96px" quality={70} />
                </div>
                <div className="min-inline-0">
                    <h3 className="h6 truncate text-ink">{item.property.title}</h3>
                    <p className="body-xs mbs-1 truncate text-ink-muted">{item.property.configLabel} · {item.property.areaSqft.toLocaleString("en-IN")} sqft · {item.property.purpose === "rent" ? `${formatInrCompact(item.property.amountInr)}/mo` : formatInrCompact(item.property.amountInr)} · {item.property.purpose === "rent" ? "Rent" : "Sale"}</p>
                    {buyerSelected && item.matchScore != null ? <p className="
                      body-xs mbs-2 font-semibold text-brand-text
                    ">{item.matchScore}% match · {(item.matchReasons ?? []).join(" · ")}</p> : null}
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2"><UserAvatar name={item.owner.name} size="xs" fallback="initials-color" /><span className="
                      body-xs text-ink
                    "><span className="block text-[10px] text-ink-subtle">Owner</span><span className="
                      font-semibold
                    ">{item.owner.name}</span></span></div>
                    <span className={`body-xs rounded-md px-2 py-1 font-semibold ${item.access === "accepted" ? `
                      bg-brand-soft text-brand-text
                    ` : item.access === "requested" ? `bg-urgent-soft text-pending` : `
                      bg-surface-muted text-ink-muted
                    `}`}>{item.access === "accepted" ? "Accepted" : item.access === "requested" ? "Access asked" : "Open access"}</span>
                    <span className="body-xs flex items-center gap-1 text-ink-muted"><MapPin aria-hidden className="
                      block-3 inline-3
                    " />{item.distanceKm?.toFixed(1)} km from you</span>
                </div>
            </div>

            <div className="mbs-4 space-y-3 border-bs border-border-warm pbs-4">
                {inlineError ? <p role="alert" className="
                  body-xs rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger
                ">{inlineError}</p> : null}
                {shown.length > 0 ? shown.map(([date, slots]) => (
                    <div key={date} className="
                      grid gap-2 min-inline-0
                      lg:grid-cols-[154px_minmax(0,1fr)] lg:items-center
                    ">
                        <p className="body-xs font-bold text-ink">{formatVisitDayHeading(slots[0].startsAt)}</p>
                        <SlotRail slots={slots} propertyName={item.property.title} onBook={onBook} onOpenVisit={onOpenVisit} onRequest={onRequest} />
                    </div>
                )) : <div className="
                  flex flex-wrap items-center justify-between gap-3 rounded-inner bg-surface-muted
                  p-3
                "><p className="body-xs text-ink-muted">This owner has not published any times. Ask for one.</p><Button variant="surface" size="sm" onClick={onRequest}>Request another time</Button></div>}
                {dates.length > 2 ? <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}><ChevronDown aria-hidden className={expanded ? `
                  rotate-180
                ` : undefined} />{expanded ? "Show fewer dates" : `Show ${dates.length - 2} more dates`}</Button> : null}
            </div>
        </article>
    );
});
