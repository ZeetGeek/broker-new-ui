"use client";

import { memo } from "react";
import toast from "react-hot-toast";

import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { bhkFromConfigLabel, formatPropertyCardName } from "@/lib/format/property-card-name";
import { brokerOwnerListingDetailHref, brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { VISIT_STATUS } from "@/lib/visits/status";
import { durationMinutes, formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { PartyMeetRow } from "@/components/shared/attached-people-row";
import { HoldToConfirmMenuItem } from "@/components/shared/hold-to-confirm-menu-item";
import {
    Building2,
    CalendarDays,
    CallIcon,
    ChevronDown,
    Clock3,
    Copy,
    ExternalLink,
    MapPin,
    MoreHorizontal,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { BrokerSiteVisit, PersonSummary } from "@/features/site-visits/broker/model";

export const VisitCard = memo(function VisitCard({
    visit,
    onAction,
}: {
    visit: BrokerSiteVisit;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    const status = VISIT_STATUS[visit.status];
    const StatusIcon = status.icon;
    const cancelled =
        visit.status === "cancelled_by_broker" || visit.status === "cancelled_by_owner";
    const canCancel = ["awaiting_owner", "confirmed", "reschedule_pending"].includes(visit.status);
    const buyer = visit.buyers[0];
    const propertyHref =
        visit.propertySource === "own_listing"
            ? brokerPropertyDetailHref(visit.property.id)
            : brokerOwnerListingDetailHref(visit.property.id);
    const propertyName =
        formatPropertyCardName(visit.property.propertyType, visit.property.areaSqft, {
            bhk: bhkFromConfigLabel(visit.property.configLabel),
        }) || visit.property.configLabel;
    const when = `${formatVisitDate(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}`;
    const message = (person: PersonSummary) =>
        `Hi ${person.name}, this is about our site visit for ${visit.property.title} on ${when}.`;
    const openWhatsApp = (person: PersonSummary) => {
        if (person.phoneDigits)
            window.open(
                formatWhatsAppUrl(person.phoneDigits, message(person)),
                "_blank",
                "noopener,noreferrer",
            );
    };
    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(visit.property.address);
            toast.success("Address copied");
        } catch {
            toast.error("Could not copy the address. Please try again.");
        }
    };

    return (
        <article
            aria-label={`${visit.property.title}, ${when}, ${status.label}`}
            className={cn(
                "flex flex-col gap-3 rounded-[20px] border border-border-warm bg-surface p-4 shadow-sm block-full min-inline-0",
                cancelled && "bg-surface-muted",
            )}
        >
            <header className="flex items-center justify-between gap-2">
                <Badge
                    color={
                        cancelled || visit.status === "expired"
                            ? "stone"
                            : visit.status === "awaiting_owner" ||
                                visit.status === "reschedule_pending"
                              ? "amber"
                              : visit.status === "no_show"
                                ? "red"
                                : "emerald"
                    }
                >
                    <StatusIcon aria-hidden />
                    {status.label}
                </Badge>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-md"
                                className="shrink-0 rounded-full"
                                aria-label={`Actions for ${visit.property.title}, ${when}`}
                            >
                                <MoreHorizontal aria-hidden />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="min-inline-56">
                        <DropdownMenuItem onClick={() => void copyAddress()}>
                            <Copy aria-hidden />
                            Copy address
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                window.open(propertyHref, "_blank", "noopener,noreferrer")
                            }
                        >
                            <ExternalLink aria-hidden />
                            View property
                        </DropdownMenuItem>
                        {canCancel ? (
                            <>
                                <DropdownMenuSeparator />
                                <HoldToConfirmMenuItem
                                    icon="trash"
                                    label="Cancel visit"
                                    onComplete={() => onAction("withdraw", visit.id)}
                                />
                            </>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <div className="flex items-center gap-3 min-inline-0">
                <div className="relative aspect-square shrink-0 overflow-hidden rounded-xl bg-surface-muted block-20 inline-20">
                    {visit.property.coverUrl ? (
                        <AppImage
                            src={visit.property.coverUrl}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center text-ink-subtle block-full">
                            <Building2 aria-hidden className="block-6 inline-6" />
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-1 min-inline-0">
                    <PriceWithCommission
                        amountInr={visit.property.amountInr}
                        isRent={visit.property.purpose === "rent"}
                        commissionPercent={visit.property.commissionPercent}
                        commissionAmountInr={visit.property.commissionAmountInr}
                        audience="broker"
                        size="lg"
                    />
                    <h3 className="body-sm font-semibold text-ink">
                        <PropertyTitleLink href={propertyHref} className="line-clamp-2">
                            {propertyName}
                        </PropertyTitleLink>
                    </h3>
                    <p className="body-xs flex items-center gap-1 text-ink-muted">
                        <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                        <span className="truncate capitalize">
                            {visit.property.locality}, {visit.property.city}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-inner bg-surface-muted px-3 py-2.5">
                <p className="body-xs flex items-center gap-1.5 font-semibold text-ink">
                    <CalendarDays aria-hidden className="block-4 inline-4" />
                    <time dateTime={visit.startsAt}>{formatVisitDate(visit.startsAt)}</time>
                </p>
                <p className="body-xs flex items-center gap-1.5 text-ink-muted tabular-nums">
                    <Clock3 aria-hidden className="block-4 inline-4" />
                    {formatVisitTime(visit.startsAt)}
                    <span aria-hidden>·</span>
                    {durationMinutes(visit.startsAt, visit.endsAt)} min
                </p>
            </div>

            <PartyMeetRow
                highlightOnHover={false}
                left={{ name: visit.owner.name, avatarUrl: visit.owner.avatarUrl, role: "Owner" }}
                right={{
                    name: buyer?.name ?? "No client linked",
                    avatarUrl: buyer?.avatarUrl,
                    role: visit.buyers.length > 1 ? `Client +${visit.buyers.length - 1}` : "Client",
                }}
            />

            <footer className="mbs-auto flex gap-2">
                {(["whatsapp", "call"] as const).map((channel) => {
                    const isWhatsApp = channel === "whatsapp";
                    const ActionIcon = isWhatsApp ? WhatsAppIcon : CallIcon;
                    const actionLabel = isWhatsApp ? "WhatsApp" : "Call";
                    const contacts = [
                        { person: visit.owner, label: "Owner" },
                        ...visit.buyers.map((person) => ({ person, label: "Client" })),
                    ];
                    return (
                        <DropdownMenu key={channel}>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant={isWhatsApp ? "accent" : "outline"}
                                        size="md"
                                        className="flex-1 min-inline-0"
                                        aria-label={`${actionLabel} contacts for ${visit.property.title}`}
                                    >
                                        <ActionIcon aria-hidden />
                                        {actionLabel}
                                        <ChevronDown
                                            aria-hidden
                                            className="ms-auto block-3.5 inline-3.5"
                                        />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent
                                align={isWhatsApp ? "start" : "end"}
                                side="top"
                                className="min-inline-56"
                            >
                                {contacts.map(({ person, label }) => (
                                    <DropdownMenuItem
                                        key={`${label}-${person.id}`}
                                        disabled={!person.phoneDigits}
                                        onClick={() => {
                                            if (!person.phoneDigits) return;
                                            if (isWhatsApp) openWhatsApp(person);
                                            else
                                                window.location.href = formatTelUrl(
                                                    person.phoneDigits,
                                                );
                                        }}
                                    >
                                        <ActionIcon aria-hidden />
                                        <span className="flex flex-col min-inline-0">
                                            <span>
                                                {actionLabel} {label.toLowerCase()}
                                            </span>
                                            <span className="body-xs truncate text-ink-muted">
                                                {person.name}
                                                {!person.phoneDigits ? " ? No phone number" : ""}
                                            </span>
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                                {visit.buyers.length === 0 ? (
                                    <DropdownMenuItem disabled>
                                        <ActionIcon aria-hidden />
                                        No client linked
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                })}
            </footer>
        </article>
    );
});
