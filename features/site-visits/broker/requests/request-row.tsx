"use client";

import { memo } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import { CalendarClock, Clock3, MapPin, PanelRight, RotateCcw, Trash2 } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { REQUEST_STATUS } from "@/lib/visits/status";
import { formatVisitDate, formatVisitTime, visitAge } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";
import type { TimeRequest } from "@/features/site-visits/broker/model";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

const DOT = "\u00B7";

const REQUEST_BADGE_COLOR = {
    pending: "amber",
    counter_offered: "orange",
    accepted: "emerald",
    declined: "red",
    withdrawn: "stone",
    expired: "stone",
} as const satisfies Record<
    TimeRequest["status"],
    "amber" | "orange" | "emerald" | "red" | "stone"
>;

function canNudge(request: TimeRequest) {
    return (
        !request.lastNudgedAt ||
        Date.now() - new Date(request.lastNudgedAt).getTime() >= 6 * 60 * 60_000
    );
}

export const RequestRow = memo(function RequestRow({
    request,
    busy,
    error,
    onWithdraw,
    onNudge,
    onAccept,
    onDecline,
    onRetry,
    onViewVisit,
}: {
    request: TimeRequest;
    busy: boolean;
    error?: string;
    onWithdraw: () => void;
    onNudge: () => void;
    onAccept: () => void;
    onDecline: () => void;
    onRetry: () => void;
    onViewVisit: () => void;
}) {
    const status = REQUEST_STATUS[request.status];
    const action = status.action;
    const buyer = request.buyers[0];
    const buyerLabel =
        request.buyers.length > 1 ? `Buyers ${DOT} +${request.buyers.length - 1}` : "Buyer";
    const metaName = `${request.property.configLabel} ${DOT} ${formatAreaSqft(request.property.areaSqft)}`;
    const propertyHref = brokerOwnerListingDetailHref(request.property.id);
    const askedLabel = (() => {
        const age = visitAge(request.createdAt);
        return age.charAt(0).toUpperCase() + age.slice(1);
    })();
    const showFooter =
        action === "pending" ||
        action === "retry" ||
        (action === "accepted" && !request.createdVisitId);

    return (
        <article
            aria-label={`${request.property.title} ${DOT} ${formatVisitTime(request.preferredStartsAt)}`}
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
                        src={request.property.coverUrl ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="96px"
                    />
                </div>

                <div className="flex flex-col pbs-1! min-inline-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge color={REQUEST_BADGE_COLOR[request.status]}>{status.label}</Badge>
                        <Badge color="sky">
                            <Clock3 aria-hidden />
                            {formatVisitTime(request.preferredStartsAt)}
                            <span className="text-ink-subtle">{DOT}</span>
                            {formatVisitDate(request.preferredStartsAt)}
                        </Badge>
                    </div>

                    <PriceWithCommission
                        amountInr={request.property.amountInr}
                        isRent={request.property.purpose === "rent"}
                        commissionPercent={request.property.commissionPercent}
                        commissionAmountInr={request.property.commissionAmountInr}
                        audience="broker"
                        className="h5 mbs-3 mbe-0.5 leading-none font-semibold tracking-wide"
                    />

                    <p
                        className="
                          body-sm flex flex-wrap items-center gap-1.5 leading-none tracking-wide
                          min-inline-0
                        "
                    >
                        <PropertyTitleLink
                            href={propertyHref}
                            className="body-sm font-semibold tracking-wide capitalize"
                        >
                            {metaName}
                        </PropertyTitleLink>
                        <span className="text-ink-subtle" aria-hidden>
                            {DOT}
                        </span>
                        <span className="flex items-center gap-1 text-ink-muted min-inline-0">
                            <MapPin
                                aria-hidden
                                className="shrink-0 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            <span className="truncate capitalize">
                                {request.property.locality}, {request.property.city}
                            </span>
                        </span>
                        <span className="text-ink-subtle" aria-hidden>
                            {DOT}
                        </span>
                        <span className="truncate min-inline-0">
                            <span className="text-ink-subtle">{buyerLabel}</span>
                            <span className="text-ink-subtle/60"> </span>
                            <span className="font-semibold text-ink capitalize">{buyer.name}</span>
                        </span>
                        <span className="text-ink-subtle" aria-hidden>
                            {DOT}
                        </span>
                        <span className="truncate min-inline-0">
                            <span className="text-ink-subtle">Owner</span>
                            <span className="text-ink-subtle/60"> </span>
                            <span className="font-semibold text-ink capitalize">
                                {request.owner.name}
                            </span>
                        </span>
                    </p>
                </div>

                <div
                    className="
                      col-span-2 flex items-center justify-end gap-3
                      sm:col-span-1 sm:gap-4 sm:justify-self-end
                    "
                >
                    <div
                        className="
                          body-xs shrink-0 text-start text-ink-muted inline-44
                          sm:inline-48
                        "
                    >
                        <p className="flex items-center gap-1.5">
                            <CalendarClock
                                aria-hidden
                                className="shrink-0 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            <span className="truncate font-medium text-ink-muted">
                                {askedLabel}
                            </span>
                        </p>
                        <p className="mbs-0.5 truncate leading-snug">
                            Expires at the requested time
                        </p>
                    </div>
                    {action === "accepted" && request.createdVisitId ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={onViewVisit}
                            className="shrink-0"
                        >
                            <PanelRight aria-hidden />
                            View visit
                        </Button>
                    ) : null}
                    {action === "pending" ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={onNudge}
                            disabled={!canNudge(request) || busy}
                            title={
                                canNudge(request)
                                    ? "Send WhatsApp nudge"
                                    : "You can nudge this owner once every 6 hours"
                            }
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            <Icon
                                icon="bi:whatsapp"
                                width={16}
                                height={16}
                                className="block-4 inline-4"
                                aria-hidden
                            />
                            Nudge owner
                        </Button>
                    ) : null}
                    {action === "retry" ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={onRetry}
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            <RotateCcw aria-hidden />
                            Try another time
                        </Button>
                    ) : null}
                </div>
            </div>

            {error ? (
                <p
                    role="alert"
                    className="
                      body-sm mx-4 rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger
                      sm:mx-5
                    "
                >
                    {error}
                </p>
            ) : null}

            {action === "counter" && request.counterOffer ? (
                <div
                    className="
                      mx-4 grid gap-3 rounded-inner border border-pending/20 bg-urgent-soft p-3
                      sm:mx-5
                      md:grid-cols-[1fr_auto] md:items-center
                    "
                >
                    <div>
                        <p className="body-xs font-semibold text-pending">Owner suggested</p>
                        <p className="h5 mbs-1 leading-none text-ink tabular-nums">
                            {formatVisitTime(request.counterOffer.startsAt)}
                            <span className="body-sm ms-2 font-medium text-ink-muted">
                                {formatVisitDate(request.counterOffer.startsAt)}
                            </span>
                        </p>
                        {request.counterOffer.ownerMessage ? (
                            <p className="body-xs mbs-1.5 text-ink-muted">
                                “{request.counterOffer.ownerMessage}”
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="md" onClick={onDecline} disabled={busy}>
                            Decline
                        </Button>
                        <Button size="md" onClick={onAccept} loading={busy}>
                            Accept {formatVisitTime(request.counterOffer.startsAt)}
                        </Button>
                    </div>
                </div>
            ) : null}

            {action === "retry" && request.declineReason ? (
                <p
                    className="
                      body-xs mx-4 rounded-inner bg-surface-muted px-3 py-2 text-ink-muted
                      sm:mx-5
                    "
                >
                    Owner’s reason: {request.declineReason}
                </p>
            ) : null}

            {showFooter ? (
                <footer
                    className={cn(
                        "flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5",
                        action === "retry" && "sm:hidden",
                    )}
                >
                    {action === "pending" ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onWithdraw}
                                disabled={busy}
                            >
                                <Trash2 aria-hidden /> Withdraw
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onNudge}
                                disabled={!canNudge(request) || busy}
                                title={
                                    canNudge(request)
                                        ? "Send WhatsApp nudge"
                                        : "You can nudge this owner once every 6 hours"
                                }
                                className="sm:hidden"
                            >
                                <Icon
                                    icon="bi:whatsapp"
                                    width={16}
                                    height={16}
                                    className="block-4 inline-4"
                                    aria-hidden
                                />
                                Nudge owner
                            </Button>
                        </>
                    ) : null}
                    {action === "accepted" && !request.createdVisitId ? (
                        <p className="body-xs text-ink-muted">
                            Visit will appear in My visits shortly.
                        </p>
                    ) : null}
                    {action === "retry" ? (
                        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
                            <RotateCcw aria-hidden /> Try another time
                        </Button>
                    ) : null}
                </footer>
            ) : null}
        </article>
    );
});
