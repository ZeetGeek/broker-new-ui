"use client";

import { memo, useMemo, useState } from "react";

import {
    BadgeCheck,
    Building2,
    CalendarClock,
    ChevronDown,
    MapPin,
    Sparkles,
} from "@/components/shared/icons";

import { bhkFromConfigLabel, formatPropertyCardName } from "@/lib/format/property-card-name";
import { brokerOwnerListingDetailHref, brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { formatVisitDayHeading, istDateKey } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
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
    const [slotsOpen, setSlotsOpen] = useState(true);
    const dates = useMemo(() => {
        const grouped = new Map<string, VisitSlot[]>();
        for (const slot of item.slots) {
            if (new Date(slot.startsAt).getTime() < Date.now()) continue;
            // Always keep booked-by-you slots; hide other full slots when filter is on.
            if (
                hideFull &&
                !slot.bookedVisitId &&
                (slot.status === "full" || slot.bookedCount >= slot.capacity)
            ) {
                continue;
            }
            const key = istDateKey(slot.startsAt);
            grouped.set(key, [...(grouped.get(key) ?? []), slot]);
        }
        return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [hideFull, item.slots]);
    const shown = expanded ? dates : dates.slice(0, 5);
    const slotCount = dates.reduce((total, [, slots]) => total + slots.length, 0);
    const bookedSlotCount = dates.reduce(
        (total, [, slots]) => total + slots.filter((slot) => Boolean(slot.bookedVisitId)).length,
        0,
    );
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
    const hasAccess = item.propertySource === "own_listing" || item.access === "accepted";
    const purposeLabel = item.property.purpose === "rent" ? "For rent" : "For sale";
    const propertyHref =
        item.propertySource === "own_listing"
            ? brokerPropertyDetailHref(item.property.id)
            : brokerOwnerListingDetailHref(item.property.id);
    const propertyName =
        formatPropertyCardName(item.property.propertyType, item.property.areaSqft, {
            bhk: bhkFromConfigLabel(item.property.configLabel),
        }) || item.property.configLabel;

    return (
        <article
            tabIndex={-1}
            aria-label={item.property.title}
            className={cn(
                "overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm",
                inlineError && "border-danger/35",
            )}
        >
            <div
                className="
                  grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-4
                  sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5
                "
            >
                <div
                    className="
                      relative shrink-0 overflow-hidden rounded-inner bg-surface-muted block-20
                      inline-20
                      sm:block-24 sm:inline-24
                    "
                >
                    <AppImage
                        src={item.property.coverUrl ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="96px"
                    />
                </div>

                <div className="flex flex-col pbs-1! min-inline-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                            color={
                                hasAccess
                                    ? "emerald"
                                    : item.access === "requested"
                                      ? "amber"
                                      : "stone"
                            }
                        >
                            {hasAccess ? <BadgeCheck aria-hidden /> : null}
                            {accessLabel}
                        </Badge>
                        <Badge color={item.property.purpose === "rent" ? "orange" : "emerald"}>
                            <Building2 aria-hidden />
                            {purposeLabel}
                        </Badge>
                    </div>

                    <PriceWithCommission
                        amountInr={item.property.amountInr}
                        isRent={item.property.purpose === "rent"}
                        commissionPercent={item.property.commissionPercent}
                        commissionAmountInr={item.property.commissionAmountInr}
                        audience="broker"
                        size="lg"
                        showEmptyTip
                        className="mbs-3 mbe-0.5 leading-none"
                    />

                    <p
                        className="
                          body-sm flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-none
                          tracking-wide min-inline-0
                        "
                    >
                        <PropertyTitleLink
                            href={propertyHref}
                            className="body-sm font-semibold tracking-wide capitalize"
                        >
                            {propertyName}
                        </PropertyTitleLink>
                        <span className="text-ink-subtle" aria-hidden>
                            ·
                        </span>
                        <span className="flex items-center gap-1 text-ink-muted min-inline-0">
                            <MapPin
                                aria-hidden
                                className="shrink-0 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            <span className="truncate capitalize">
                                {item.property.locality}, {item.property.city}
                                {item.distanceKm != null
                                    ? ` · ${item.distanceKm.toFixed(1)} km`
                                    : ""}
                            </span>
                        </span>
                        <span className="text-ink-subtle" aria-hidden>
                            ·
                        </span>
                        <span className="truncate min-inline-0">
                            <span className="text-ink-subtle">Owner</span>
                            <span className="text-ink-subtle/60"> </span>
                            <span className="font-semibold text-ink capitalize">
                                {item.owner.name}
                            </span>
                        </span>
                    </p>

                    {buyerSelected && item.matchScore != null ? (
                        <p className="body-xs mbs-1.5 flex items-center gap-1.5 text-brand-text">
                            <Sparkles aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                            <span className="truncate font-semibold">
                                {item.matchScore}% match
                                {(item.matchReasons ?? []).length > 0
                                    ? ` · ${(item.matchReasons ?? []).join(", ")}`
                                    : ""}
                            </span>
                        </p>
                    ) : null}
                </div>

                {item.propertySource === "own_listing" ? null : (
                    <Button
                        variant="outline"
                        size="md"
                        onClick={onRequest}
                        className="hidden shrink-0 sm:inline-flex"
                    >
                        <CalendarClock aria-hidden />
                        Request another time
                    </Button>
                )}
            </div>

            <div aria-hidden className="mx-4 border-bs border-border-warm sm:mx-5" />
            <div className="px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                    <p className="body-sm font-semibold text-ink">Available visit times</p>
                    <div className="ms-auto flex items-center gap-2 min-inline-0">
                        {slotCount > 0 ? (
                            <p className="body-xs truncate text-ink-muted tabular-nums">
                                {slotCount} {slotCount === 1 ? "slot" : "slots"} across{" "}
                                {dates.length} {dates.length === 1 ? "day" : "days"}
                            </p>
                        ) : null}
                        {bookedSlotCount > 0 ? (
                            <span className="body-xs shrink-0 font-semibold text-brand tabular-nums">
                                {bookedSlotCount} {bookedSlotCount === 1 ? "slot" : "slots"} booked
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-expanded={slotsOpen}
                            aria-label={slotsOpen ? "Hide visit times" : "Show visit times"}
                            onClick={() => setSlotsOpen((value) => !value)}
                        >
                            <ChevronDown
                                aria-hidden
                                className={cn(
                                    "transition-transform duration-160",
                                    slotsOpen && "rotate-180",
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {slotsOpen ? (
                    <>
                        {inlineError ? (
                            <p
                                role="alert"
                                className="
                                  body-sm mbs-3 rounded-inner bg-danger-soft px-3 py-2 font-semibold
                                  text-danger
                                "
                            >
                                {inlineError}
                            </p>
                        ) : null}

                        {shown.length > 0 ? (
                            <div
                                className="
                                  mbs-3 grid grid-cols-1 gap-4
                                  sm:grid-cols-2
                                  xl:grid-cols-4
                                "
                            >
                                {shown.map(([date, slots]) => (
                                    <section key={date} className="min-inline-0">
                                        <p className="body-xs mbe-2 font-semibold text-ink-muted">
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
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <p className="body-sm mbs-3 text-ink-muted">
                                {item.propertySource === "own_listing"
                                    ? "No open times left in this range."
                                    : "The owner hasn’t published any bookable times."}
                            </p>
                        )}

                        {item.propertySource === "own_listing" ? null : (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={onRequest}
                                className="mbs-1 inline-full sm:hidden"
                            >
                                <CalendarClock aria-hidden />
                                Request another time
                            </Button>
                        )}

                        {dates.length > 5 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded((value) => !value)}
                                className="mbs-1"
                            >
                                <ChevronDown
                                    aria-hidden
                                    className={expanded ? "rotate-180" : undefined}
                                />
                                {expanded
                                    ? "Show fewer dates"
                                    : `Show ${dates.length - 5} more dates`}
                            </Button>
                        ) : null}
                    </>
                ) : null}
            </div>
        </article>
    );
});
