"use client";

import { memo, useMemo, useState } from "react";

import { ChevronDown, MapPin, Sparkles } from "lucide-react";

import { formatInrCompact } from "@/lib/format/inr";
import { cn } from "@/lib/utils";
import { formatVisitDayHeading, istDateKey } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
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
            if (
                hideFull &&
                !slot.bookedVisitId &&
                (slot.status === "full" || slot.bookedCount >= slot.capacity)
            )
                continue;
            const key = istDateKey(slot.startsAt);
            grouped.set(key, [...(grouped.get(key) ?? []), slot]);
        }
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [hideFull, item.slots]);
    const shown = expanded ? dates : dates.slice(0, 2);
    const canBookSlot = (slot: VisitSlot) =>
        item.propertySource === "own_listing" ||
        item.access === "accepted" ||
        slot.visibility === "all_brokers";
    const accessLabel =
        item.propertySource === "own_listing"
            ? "Your listing"
            : item.access === "accepted"
              ? "Accepted"
              : item.access === "requested"
                ? "Access asked"
                : "Approval needed";
    const accessClass =
        item.propertySource === "own_listing" || item.access === "accepted"
            ? "border-brand/20 bg-brand-soft text-brand-text"
            : item.access === "requested"
              ? "border-pending/20 bg-urgent-soft text-pending"
              : "border-border-warm bg-surface-muted text-ink-muted";

    return (
        <article
            className={cn(
                "rounded-card border border-border-warm bg-surface p-4 md:p-5",
                inlineError && "border-danger/35",
            )}
        >
            <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-start">
                <div className="relative overflow-hidden rounded-inner bg-surface-muted block-[72px] inline-24">
                    <AppImage
                        src={item.property.coverUrl ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="96px"
                    />
                </div>

                <div className="min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="h6 truncate text-ink">{item.property.title}</h3>
                        <Badge variant="outline" className={accessClass}>
                            {accessLabel}
                        </Badge>
                    </div>
                    <p className="body-sm mbs-1 truncate text-ink-muted">
                        {item.property.configLabel} ·{" "}
                        {item.property.areaSqft.toLocaleString("en-IN")} sq ft ·{" "}
                        {item.property.purpose === "rent"
                            ? `${formatInrCompact(item.property.amountInr)}/mo`
                            : formatInrCompact(item.property.amountInr)}{" "}
                        · {item.property.purpose === "rent" ? "Rent" : "Sale"}
                    </p>
                    {buyerSelected && item.matchScore != null ? (
                        <p className="body-xs mbs-2 flex items-center gap-1.5 font-semibold text-brand-text">
                            <Sparkles aria-hidden className="block-3.5 inline-3.5" />
                            {item.matchScore}% match: {(item.matchReasons ?? []).join(", ")}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                    <div className="flex items-center gap-2">
                        <UserAvatar
                            name={item.owner.name}
                            imageUrl={item.owner.avatarUrl}
                            size="xs"
                            fallback="character"
                        />
                        <span className="min-inline-0">
                            <span className="body-xs block text-ink-subtle">Owner</span>
                            <span className="body-sm block truncate font-semibold text-ink">
                                {item.owner.name}
                            </span>
                        </span>
                    </div>
                    {item.distanceKm != null ? (
                        <span className="body-xs flex items-center gap-1 text-ink-muted">
                            <MapPin aria-hidden className="block-3.5 inline-3.5" />
                            {item.distanceKm.toFixed(1)} km away
                        </span>
                    ) : null}
                </div>
            </div>

            {inlineError ? (
                <p
                    role="alert"
                    className="body-sm mbs-4 rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger"
                >
                    {inlineError}
                </p>
            ) : null}

            <div className="mbs-4 rounded-inner bg-surface-muted p-3 md:p-4">
                {shown.length > 0 ? (
                    <div className="space-y-3">
                        {shown.map(([date, slots]) => (
                            <div
                                key={date}
                                className="grid gap-2 min-inline-0 lg:grid-cols-[148px_minmax(0,1fr)] lg:items-center"
                            >
                                <p className="body-sm font-semibold text-ink">
                                    {formatVisitDayHeading(slots[0].startsAt)}
                                </p>
                                <SlotRail
                                    slots={slots}
                                    propertyName={item.property.title}
                                    canBook={canBookSlot}
                                    onBook={onBook}
                                    onOpenVisit={onOpenVisit}
                                    onRequest={onRequest}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="body-sm font-semibold text-ink">No open slots</p>
                            <p className="body-xs text-ink-muted">
                                The owner hasn’t published visit times for this listing yet.
                            </p>
                        </div>
                    </div>
                )}

                {dates.length > 2 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded((value) => !value)}
                        className="mbs-3"
                    >
                        <ChevronDown aria-hidden className={expanded ? "rotate-180" : undefined} />
                        {expanded ? "Show fewer dates" : `Show ${dates.length - 2} more dates`}
                    </Button>
                ) : null}
            </div>
        </article>
    );
});
