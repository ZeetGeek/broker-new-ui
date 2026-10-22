"use client";

import { memo } from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import {
    CalendarClock,
    CircleCheck,
    Clock3,
    Copy,
    ExternalLink,
    MapPin,
    MoreHorizontal,
    PanelRight,
    Phone,
    Route,
    Trash2,
} from "@/components/shared/icons";

import { bhkFromConfigLabel, formatPropertyCardName } from "@/lib/format/property-card-name";
import { brokerOwnerListingDetailHref, brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { isVisitCancelled, VISIT_STATUS, visitPrimaryAction } from "@/lib/visits/status";
import { durationMinutes, formatVisitDayHeading, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { APP_NAME } from "@/config";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";
import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { useAppSelector } from "@/store/hooks";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

const VISIT_BADGE_COLOR = {
    awaiting_owner: "amber",
    confirmed: "emerald",
    reschedule_pending: "amber",
    cancelled_by_broker: "stone",
    cancelled_by_owner: "red",
    completed: "emerald",
    no_show: "red",
    expired: "stone",
} as const satisfies Record<BrokerSiteVisit["status"], "amber" | "emerald" | "stone" | "red">;

const DOT = "\u00B7";
const EM_DASH = "\u2014";
const APOSTROPHE = "\u2019";

export const VisitCard = memo(function VisitCard({
    visit,
    onOpen,
    onAction,
}: {
    visit: BrokerSiteVisit;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    const status = VISIT_STATUS[visit.status];
    const StatusIcon = status.icon;
    const cancelled = isVisitCancelled(visit.status);
    const primary = visitPrimaryAction(visit.status, visit.startsAt, Boolean(visit.outcome));
    const primaryLabel =
        primary === "outcome"
            ? "Log outcome"
            : primary === "withdraw"
              ? "Cancel request"
              : "Reschedule";
    const PrimaryIcon =
        primary === "outcome" ? CircleCheck : primary === "withdraw" ? Trash2 : CalendarClock;
    const buyer = visit.buyers[0];
    const broker = useAppSelector((state) => state.auth.user);
    const brokerName = broker?.fullName?.trim() || broker?.email || "Your broker";
    const propertyHref =
        visit.propertySource === "own_listing"
            ? brokerPropertyDetailHref(visit.property.id)
            : brokerOwnerListingDetailHref(visit.property.id);
    const hasTravel = visit.distanceKm != null || visit.driveMinutes != null;
    const mapHref =
        visit.property.latitude && visit.property.longitude
            ? `https://www.openstreetmap.org/directions?to=${visit.property.latitude},${visit.property.longitude}`
            : `https://www.openstreetmap.org/search?query=${encodeURIComponent(visit.property.address)}`;
    const whatsAppText = encodeURIComponent(
        `Hi ${buyer.name}, your site visit for ${visit.property.title}, ${visit.property.locality} is confirmed for ${formatVisitDayHeading(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}. Address: ${visit.property.address}. I${APOSTROPHE}ll meet you there. ${EM_DASH} ${brokerName}, ${APP_NAME}`,
    );
    const buyerLabel =
        visit.buyers.length > 1 ? `Buyers ${DOT} +${visit.buyers.length - 1}` : "Buyer";
    const duration = durationMinutes(visit.startsAt, visit.endsAt);
    const metaName =
        formatPropertyCardName(visit.property.propertyType, visit.property.areaSqft, {
            bhk: bhkFromConfigLabel(visit.property.configLabel),
        }) || visit.property.configLabel;

    return (
        <article
            aria-label={`${visit.property.title} ${DOT} ${formatVisitTime(visit.startsAt)}`}
            className={cn(
                "overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm",
                cancelled && "opacity-90",
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
                        src={visit.property.coverUrl ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="96px"
                    />
                </div>

                <div className="flex flex-col pbs-1! min-inline-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge color={VISIT_BADGE_COLOR[visit.status]}>
                            <StatusIcon aria-hidden />
                            {status.label}
                        </Badge>
                        <Badge variant="neutral">
                            <Clock3 aria-hidden />
                            {formatVisitTime(visit.startsAt)}
                            <span className="text-ink-subtle">{DOT}</span>
                            {duration} min
                        </Badge>
                    </div>

                    <PriceWithCommission
                        amountInr={visit.property.amountInr}
                        isRent={visit.property.purpose === "rent"}
                        commissionPercent={visit.property.commissionPercent}
                        commissionAmountInr={visit.property.commissionAmountInr}
                        audience="broker"
                        size="lg"
                        showEmptyTip
                        className="mbs-3 mbe-0.5 leading-none"
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
                                {visit.property.locality}, {visit.property.city}
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
                                {visit.owner.name}
                            </span>
                        </span>
                    </p>

                    {hasTravel ? (
                        <p className="body-xs mbs-1.5 flex items-center gap-1.5 text-ink-muted">
                            <Route
                                aria-hidden
                                className="shrink-0 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            <span>
                                {visit.distanceKm != null
                                    ? `${visit.distanceKm.toFixed(1)} km`
                                    : EM_DASH}
                                {` ${DOT} `}
                                {visit.driveMinutes != null
                                    ? `${visit.driveMinutes} min`
                                    : EM_DASH}{" "}
                                from your last stop
                                {visit.distanceApproximate ? ` ${DOT} approx` : ""}
                            </span>
                        </p>
                    ) : null}
                </div>

                <div
                    className="
                      col-span-2 flex items-center justify-end gap-2
                      sm:col-span-1 sm:justify-self-end
                    "
                >
                    {primary ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() => onAction(primary, visit.id)}
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            <PrimaryIcon aria-hidden />
                            {primaryLabel}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() => onOpen(visit.id)}
                            className="hidden shrink-0 sm:inline-flex"
                        >
                            <PanelRight aria-hidden />
                            View visit
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-md"
                                    aria-label="More visit actions"
                                >
                                    <MoreHorizontal aria-hidden />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    void navigator.clipboard.writeText(visit.property.address);
                                }}
                            >
                                <Copy aria-hidden /> Copy address
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    window.open(propertyHref, "_blank", "noopener,noreferrer");
                                }}
                            >
                                <ExternalLink aria-hidden /> View property
                            </DropdownMenuItem>
                            {!cancelled ? (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => onAction("withdraw", visit.id)}
                                >
                                    <Trash2 aria-hidden /> Cancel visit
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div aria-hidden className="mx-4 border-bs border-border-warm sm:mx-5" />
            <footer className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
                {buyer.phoneDigits ? (
                    <>
                        <Button
                            nativeButton={false}
                            render={<a href={`tel:+91${buyer.phoneDigits}`} />}
                            variant="ghost"
                            size="sm"
                        >
                            <Phone aria-hidden /> Call buyer
                        </Button>
                        <Button
                            nativeButton={false}
                            render={
                                <a
                                    href={`https://wa.me/91${buyer.phoneDigits}?text=${whatsAppText}`}
                                    target="_blank"
                                    rel="noreferrer"
                                />
                            }
                            variant="ghost"
                            size="sm"
                        >
                            <Icon
                                icon="bi:whatsapp"
                                width={16}
                                height={16}
                                className="block-4 inline-4"
                                aria-hidden
                            />
                            WhatsApp
                        </Button>
                    </>
                ) : null}
                {!cancelled ? (
                    <Button
                        nativeButton={false}
                        render={<a href={mapHref} target="_blank" rel="noreferrer" />}
                        variant="ghost"
                        size="sm"
                    >
                        <Route aria-hidden /> Navigate
                    </Button>
                ) : null}
                {primary ? (
                    <Button
                        type="button"
                        size="sm"
                        variant={cancelled ? "outline" : "default"}
                        onClick={() => onAction(primary, visit.id)}
                        className="ms-auto sm:hidden"
                    >
                        {primaryLabel}
                    </Button>
                ) : null}
            </footer>
        </article>
    );
});
