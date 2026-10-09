"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, MapPin } from "lucide-react";

import { useBookSlot } from "@/hooks/use-book-slot";
import { ApiError } from "@/lib/api/client";
import { SlotTakenError } from "@/lib/api/broker-visits";
import { checkVisitConflicts, type ConflictResult } from "@/lib/visits/conflicts";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

import type {
    BrokerSiteVisit,
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";
import { BuyerPicker } from "@/features/site-visits/broker/panels/buyer-picker";
import { ConflictPanel } from "@/features/site-visits/broker/panels/conflict-panel";
import { type BookingFormValues, bookingSchema } from "@/schemas/visits";

function conflictFromApiError(error: unknown): ConflictResult | null {
    if (!(error instanceof ApiError) || error.status !== 400) return null;
    const body = error.body;
    const visitId =
        body && typeof body === "object" && "visitId" in body
            ? typeof (body as { visitId?: unknown }).visitId === "string"
                ? (body as { visitId: string }).visitId
                : undefined
            : undefined;
    const code =
        body && typeof body === "object" && "code" in body
            ? typeof (body as { code?: unknown }).code === "string"
                ? (body as { code: string }).code
                : undefined
            : undefined;
    if (!error.message?.trim()) return null;
    return {
        level: "clash",
        reasons: [
            {
                code: code === "LEAD_TIME_CONFLICT" ? "BUYER_BUSY" : "OVERLAP",
                message: error.message,
                visitId,
            },
        ],
    };
}

export function BookingDrawer({
    open,
    item,
    slot,
    buyers,
    visits,
    preselectedBuyerId,
    onClose,
    onOpenVisit,
    onChooseAlternative,
    onSlotTaken,
}: {
    open: boolean;
    item?: PropertyWithSlots;
    slot?: VisitSlot;
    buyers: PersonSummary[];
    visits: BrokerSiteVisit[];
    preselectedBuyerId?: string;
    onClose: () => void;
    onOpenVisit: (id: string) => void;
    onChooseAlternative: (slotId: string) => void;
    onSlotTaken: (propertyId: string, message: string) => void;
}) {
    const mutation = useBookSlot();
    const [inlineError, setInlineError] = useState<string>();
    const [apiConflict, setApiConflict] = useState<ConflictResult | null>(null);
    const [createdBuyers, setCreatedBuyers] = useState<PersonSummary[]>([]);
    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            buyerIds: preselectedBuyerId ? [preselectedBuyerId] : [],
            acceptTight: false,
        },
    });
    const buyerIds = useWatch({ control: form.control, name: "buyerIds" });
    const acceptTight = useWatch({ control: form.control, name: "acceptTight" });
    const allBuyers = useMemo(() => [...createdBuyers, ...buyers], [buyers, createdBuyers]);
    const selectedBuyers = allBuyers.filter((buyer) => buyerIds.includes(buyer.id));
    const travelEstimates = useMemo(
        () =>
            Object.fromEntries(
                visits.map((visit) => [
                    visit.id,
                    {
                        minutes:
                            visit.driveMinutes ??
                            Math.max(12, Math.round((visit.distanceKm ?? 5) * 2.4)),
                        distanceKm: visit.distanceKm,
                    },
                ]),
            ),
        [visits],
    );
    const localConflict = useMemo<ConflictResult>(
        () =>
            slot && item
                ? checkVisitConflicts(
                      {
                          startsAt: slot.startsAt,
                          endsAt: slot.endsAt,
                          buyerIds,
                          locality: item.property.locality,
                          slotId: slot.id,
                      },
                      visits,
                      travelEstimates,
                  )
                : { level: "clear", reasons: [] },
        [buyerIds, item, slot, travelEstimates, visits],
    );
    const conflict = apiConflict ?? localConflict;
    const hasBookingAccess = item
        ? item.propertySource === "own_listing" ||
          item.access === "accepted" ||
          slot?.visibility === "all_brokers"
        : false;
    const alternatives =
        item?.slots
            .filter(
                (candidate) =>
                    candidate.id !== slot?.id &&
                    candidate.status === "open" &&
                    candidate.bookedCount < candidate.capacity &&
                    (item.propertySource === "own_listing" ||
                        item.access === "accepted" ||
                        candidate.visibility === "all_brokers"),
            )
            .slice(0, 4) ?? [];

    useEffect(() => {
        if (!open) return;
        form.reset({
            buyerIds: preselectedBuyerId ? [preselectedBuyerId] : [],
            acceptTight: false,
        });
        setInlineError(undefined);
        setApiConflict(null);
    }, [form, open, preselectedBuyerId, slot?.id]);

    useEffect(() => {
        setApiConflict(null);
        setInlineError(undefined);
    }, [buyerIds, slot?.id]);

    if (!item || !slot) return null;
    const blocked =
        !hasBookingAccess ||
        Boolean(apiConflict) ||
        localConflict.level === "clash" ||
        (localConflict.level === "tight" && !acceptTight);

    const submit = form.handleSubmit(async (values) => {
        setInlineError(undefined);
        setApiConflict(null);
        try {
            const visit = await mutation.mutateAsync({
                item,
                slot,
                buyers: allBuyers.filter((buyer) => values.buyerIds.includes(buyer.id)),
            });
            toast.success(
                visit.status === "awaiting_owner" ? "Booking sent to owner" : "Visit booked",
            );
            onClose();
        } catch (error) {
            const fromApi = conflictFromApiError(error);
            if (fromApi) {
                setApiConflict(fromApi);
                onSlotTaken(item.property.id, fromApi.reasons[0]?.message ?? "Booking failed");
                return;
            }
            const message =
                error instanceof SlotTakenError
                    ? "This slot just got taken. Pick another time below."
                    : error instanceof Error
                      ? error.message
                      : "Booking failed. Check the details and try again.";
            setInlineError(message);
            onSlotTaken(item.property.id, message);
        }
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setInlineError(undefined);
                    setApiConflict(null);
                    onClose();
                }
            }}
        >
            <DialogPopup
                className="
              inset-s-0! inset-bs-auto! inset-be-0! flex translate-0! flex-col gap-0 overflow-hidden
              rounded-b-none p-0 inline-full max-block-[94dvh] max-inline-none
              sm:inset-s-auto! sm:inset-e-0! sm:inset-bs-0! sm:rounded-none sm:block-full
              sm:inline-[480px] sm:max-block-none sm:max-inline-[480px]
            "
            >
                <div
                    className="
                  mx-auto mbs-2 rounded-full bg-border-warm block-1 inline-12
                  sm:hidden
                "
                    aria-hidden
                />
                <div className="shrink-0 border-be border-border-warm p-5 pe-14">
                    <DialogHeader className="pe-0 text-start">
                        <DialogTitle className="h3 font-bold text-ink">Book this visit</DialogTitle>
                        <DialogDescription>
                            One screen. Your buyer, the timing, and any clash.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mbs-4 flex gap-3 rounded-inner bg-surface-muted p-3">
                        <div className="relative shrink-0 overflow-hidden rounded-[8px] block-14 inline-16">
                            <AppImage
                                src={item.property.coverUrl ?? "/properties/1.jpg"}
                                alt=""
                                fill
                                sizes="64px"
                            />
                        </div>
                        <div className="min-inline-0">
                            <p className="body-sm truncate font-bold text-ink">
                                {item.property.title}
                            </p>
                            <p className="body-xs flex items-center gap-1 text-ink-muted">
                                <MapPin aria-hidden className="block-3 inline-3" />
                                {item.property.locality} · Owner {item.owner.name}
                            </p>
                            <p className="body-sm tabular mbs-1 font-bold text-brand-text">
                                {formatVisitDate(slot.startsAt)} · {formatVisitTime(slot.startsAt)}–
                                {formatVisitTime(slot.endsAt)}
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    id="booking-form"
                    onSubmit={submit}
                    className="flex-1 space-y-5 overflow-y-auto p-5"
                >
                    {!hasBookingAccess ? (
                        <p
                            role="alert"
                            className="body-sm rounded-inner bg-urgent-soft px-3 py-2 font-semibold text-pending"
                        >
                            The owner must approve access before this time can be booked.
                        </p>
                    ) : null}
                    <BuyerPicker
                        buyers={allBuyers}
                        selected={buyerIds}
                        onChange={(ids) => form.setValue("buyerIds", ids, { shouldValidate: true })}
                        onBuyerCreated={(buyer) =>
                            setCreatedBuyers((current) => [
                                buyer,
                                ...current.filter((row) => row.id !== buyer.id),
                            ])
                        }
                    />
                    {form.formState.errors.buyerIds ? (
                        <p className="body-xs text-danger">
                            {form.formState.errors.buyerIds.message}
                        </p>
                    ) : null}
                    {buyerIds.length || apiConflict ? (
                        <ConflictPanel result={conflict} onOpenVisit={onOpenVisit} />
                    ) : null}
                    {localConflict.level === "tight" && !apiConflict ? (
                        <label className="flex cursor-pointer items-center gap-3 rounded-inner border border-pending/20 bg-urgent-soft px-3 text-pending min-block-11">
                            <Checkbox
                                checked={acceptTight}
                                onCheckedChange={(checked) => form.setValue("acceptTight", checked)}
                            />
                            <span className="body-sm font-semibold">I know, book anyway</span>
                        </label>
                    ) : null}
                    {inlineError ? (
                        <div role="alert" className="rounded-inner bg-danger-soft p-3 text-danger">
                            <p className="body-sm font-bold">{inlineError}</p>
                            {alternatives.length ? (
                                <div className="mbs-3 flex flex-wrap gap-2">
                                    {alternatives.map((candidate) => (
                                        <Button
                                            key={candidate.id}
                                            type="button"
                                            variant="surface"
                                            size="md"
                                            className="ring-2 ring-brand/20"
                                            onClick={() => onChooseAlternative(candidate.id)}
                                        >
                                            <CalendarClock aria-hidden />
                                            {formatVisitTime(candidate.startsAt)}
                                        </Button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {apiConflict && alternatives.length ? (
                        <div className="flex flex-wrap gap-2">
                            {alternatives.map((candidate) => (
                                <Button
                                    key={candidate.id}
                                    type="button"
                                    variant="surface"
                                    size="md"
                                    className="ring-2 ring-brand/20"
                                    onClick={() => onChooseAlternative(candidate.id)}
                                >
                                    <CalendarClock aria-hidden />
                                    {formatVisitTime(candidate.startsAt)}
                                </Button>
                            ))}
                        </div>
                    ) : null}
                </form>

                <footer className="sticky inset-be-0 flex shrink-0 items-center justify-between gap-4 border-bs border-border-warm bg-surface p-4">
                    <p className="body-xs text-ink-muted max-inline-48">
                        Cancelling within 2 hours is marked as a late cancel.
                    </p>
                    <Button
                        type="submit"
                        form="booking-form"
                        size="lg"
                        loading={mutation.isPending}
                        disabled={blocked || selectedBuyers.length === 0}
                    >
                        {item.propertySource === "own_listing" || slot.autoConfirm
                            ? "Confirm booking"
                            : "Send booking to owner"}
                    </Button>
                </footer>
            </DialogPopup>
        </Dialog>
    );
}
