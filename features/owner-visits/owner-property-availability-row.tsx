"use client";

import { memo, useMemo, useState } from "react";

import { Building2, CalendarPlus, Check, ChevronDown, MapPin, X } from "@/components/shared/icons";

import type { VisitSlot } from "@/lib/api/owner-slots";
import type { PropertyListing } from "@/lib/api/properties";
import { bhkFromConfigLabel, formatPropertyCardName } from "@/lib/format/property-card-name";
import { formatTime24, parseApiInstant } from "@/lib/format/date";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";
import { formatVisitDayHeading, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { PriceWithCommission, toCommissionNumber } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    propertyAmountInr,
    propertyConfigLabel,
    propertyLocalityLine,
} from "@/features/owner-visits/availability-helpers";

export const OwnerPropertyAvailabilityRow = memo(function OwnerPropertyAvailabilityRow({
    property,
    slots,
    removingId,
    onAddTime,
    onRemoveSlot,
}: {
    property: PropertyListing;
    slots: VisitSlot[];
    removingId: string | null;
    onAddTime: () => void;
    onRemoveSlot: (slot: VisitSlot) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [slotsOpen, setSlotsOpen] = useState(true);

    const dates = useMemo(() => {
        const grouped = new Map<string, VisitSlot[]>();
        const now = Date.now();
        for (const slot of slots) {
            if (slot.status !== "open" && slot.status !== "booked") continue;
            const start = parseApiInstant(slot.startAt);
            if (start.getTime() < now && slot.status !== "booked") continue;
            const key = istDateKey(slot.startAt);
            const list = grouped.get(key) ?? [];
            list.push(slot);
            grouped.set(key, list);
        }
        return [...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(
                ([date, daySlots]) =>
                    [
                        date,
                        daySlots.sort(
                            (a, b) =>
                                parseApiInstant(a.startAt).getTime() -
                                parseApiInstant(b.startAt).getTime(),
                        ),
                    ] as const,
            );
    }, [slots]);

    const shown = expanded ? dates : dates.slice(0, 5);
    const slotCount = dates.reduce((total, [, daySlots]) => total + daySlots.length, 0);
    const bookedSlotCount = dates.reduce(
        (total, [, daySlots]) => total + daySlots.filter((slot) => slot.status === "booked").length,
        0,
    );

    const { amountInr, isRent } = propertyAmountInr(property);
    const configLabel = propertyConfigLabel(property);
    const purposeLabel = isRent ? "For rent" : "For sale";
    const typeKey = property.propertyType?.trim() || property.subtype?.trim() || "";
    const propertyName =
        formatPropertyCardName(typeKey, property.areaSqft, {
            bhk: bhkFromConfigLabel(configLabel),
            bathrooms: property.bathrooms,
        }) ||
        configLabel ||
        "Property";
    const title =
        property.title?.trim() || `${configLabel} in ${property.city?.trim() || "your city"}`;

    return (
        <article
            tabIndex={-1}
            aria-label={title}
            className="overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm"
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
                        src={property.photos?.[0] ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="96px"
                    />
                </div>

                <div className="flex flex-col pbs-1! min-inline-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="brand">
                            <Check aria-hidden />
                            Your listing
                        </Badge>
                        <Badge variant="neutral">
                            <Building2 aria-hidden />
                            {purposeLabel}
                        </Badge>
                    </div>

                    {amountInr > 0 ? (
                        <PriceWithCommission
                            amountInr={amountInr}
                            isRent={isRent}
                            commissionPercent={toCommissionNumber(property.commissionPercent)}
                            commissionAmountInr={toCommissionNumber(property.commissionAmount)}
                            audience="owner"
                            size="lg"
                            showEmptyTip
                            className="mbs-3 mbe-0.5 leading-none"
                        />
                    ) : (
                        <p className="h5 mbs-3 mbe-0.5 font-semibold text-ink-muted">Price TBD</p>
                    )}

                    <p
                        className="
                          body-sm flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-none
                          tracking-wide min-inline-0
                        "
                    >
                        <PropertyTitleLink
                            href={ownerPropertyDetailHref(property.id)}
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
                                {propertyLocalityLine(property)}
                            </span>
                        </span>
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="md"
                    onClick={onAddTime}
                    className="hidden shrink-0 sm:inline-flex"
                >
                    <CalendarPlus aria-hidden />
                    Add time
                </Button>
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
                        {shown.length > 0 ? (
                            <div
                                className="
                                  mbs-3 grid grid-cols-1 gap-4
                                  sm:grid-cols-2
                                  xl:grid-cols-4
                                "
                            >
                                {shown.map(([date, daySlots]) => (
                                    <section key={date} className="min-inline-0">
                                        <p className="body-xs mbe-2 font-semibold text-ink-muted">
                                            {formatVisitDayHeading(daySlots[0].startAt)}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {daySlots.map((slot) => {
                                                const booked = slot.status === "booked";
                                                const busy = removingId === slot.id;
                                                return (
                                                    <button
                                                        key={slot.id}
                                                        type="button"
                                                        disabled={booked || busy}
                                                        title={
                                                            booked
                                                                ? "Booked — cannot remove"
                                                                : "Close this slot"
                                                        }
                                                        onClick={() => onRemoveSlot(slot)}
                                                        className={cn(
                                                            `
                                                              t-slot-chip tabular flex
                                                              touch-manipulation items-center
                                                              justify-center gap-1 rounded-control
                                                              border px-2 text-sm font-bold
                                                              transition-[background-color,color,transform]
                                                              duration-160 outline-none inline-full
                                                              min-block-11
                                                              focus-visible:ring-3
                                                              focus-visible:ring-brand/30
                                                            `,
                                                            booked
                                                                ? "border-brand bg-brand text-surface shadow-sm"
                                                                : `
                                                                  border-brand/20 bg-brand-soft
                                                                  text-brand-text
                                                                  hover:bg-brand-soft-hover
                                                                `,
                                                            busy && "opacity-60",
                                                        )}
                                                    >
                                                        {booked ? (
                                                            <Check
                                                                aria-hidden
                                                                className="shrink-0 block-3.5 inline-3.5"
                                                            />
                                                        ) : (
                                                            <X
                                                                aria-hidden
                                                                className="
                                                                  shrink-0 opacity-70 block-3.5
                                                                  inline-3.5
                                                                "
                                                            />
                                                        )}
                                                        <span className="truncate leading-none">
                                                            {formatVisitTime(slot.startAt)}
                                                        </span>
                                                        {booked ? (
                                                            <span className="body-xs truncate leading-none font-medium opacity-90">
                                                                · Booked
                                                            </span>
                                                        ) : null}
                                                        <span className="sr-only">
                                                            {formatTime24(
                                                                parseApiInstant(slot.startAt),
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <p className="body-sm mbs-3 text-ink-muted">
                                No visiting times yet. Tap Add time to open slots brokers can book.
                            </p>
                        )}

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onAddTime}
                            className="mbs-1 inline-full sm:hidden"
                        >
                            <CalendarPlus aria-hidden />
                            Add time
                        </Button>

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
