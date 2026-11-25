"use client";

import { memo, useRef, useState } from "react";

import { formatPersonName } from "@/lib/format/person-name";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { bhkFromConfigLabel, formatPropertyCardName } from "@/lib/format/property-card-name";
import { brokerOwnerListingDetailHref, brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { VISIT_STATUS } from "@/lib/visits/status";
import { durationMinutes, formatVisitDate, formatVisitTime } from "@/lib/visits/time";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { PartyMeetRow } from "@/components/shared/attached-people-row";
import { CardLink } from "@/components/shared/card-link";
import { DangerMenuItem } from "@/components/shared/danger-menu-item";
import { IconButton } from "@/components/shared/icon-button";
import {
    CalendarDays,
    CallIcon,
    MapPin,
    MoreHorizontal,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { BrokerSiteVisit, PersonSummary } from "@/features/site-visits/broker/model";

function VisitContactMenu({
    channel,
    propertyTitle,
    contacts,
    onSelect,
}: {
    channel: "call" | "whatsapp";
    propertyTitle: string;
    contacts: { person: PersonSummary; label: string }[];
    onSelect: (person: PersonSummary) => void;
}) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const isWhatsApp = channel === "whatsapp";
    const ActionIcon = isWhatsApp ? WhatsAppIcon : CallIcon;
    const actionLabel = isWhatsApp ? "WhatsApp" : "Call";
    const trigger = (
        <Button
            type="button"
            variant={isWhatsApp ? "accent" : "outline"}
            size="md"
            className="flex-1 min-inline-0"
            aria-label={`${actionLabel} clients for ${propertyTitle}`}
        >
            <ActionIcon aria-hidden />
            {actionLabel}
        </Button>
    );

    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                title={actionLabel}
                description={propertyTitle}
                trigger={trigger}
            >
                {contacts.map(({ person, label }) => (
                    <button
                        key={`${label}-${person.id}`}
                        type="button"
                        disabled={!person.phoneDigits}
                        className={mobileActionClass}
                        onClick={() => {
                            if (!person.phoneDigits) return;
                            setOpen(false);
                            onSelect(person);
                        }}
                    >
                        <ActionIcon aria-hidden />
                        <span className="flex flex-col text-start min-inline-0">
                            <span>
                                {actionLabel} {label.toLowerCase()}
                            </span>
                            <span className="body-xs truncate text-ink-muted">
                                {formatPersonName(person.name)}
                                {!person.phoneDigits ? " · No phone number" : ""}
                            </span>
                        </span>
                    </button>
                ))}
            </MobileActionDrawer>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={trigger} />
            <DropdownMenuContent
                align={isWhatsApp ? "end" : "start"}
                side="top"
                className="min-inline-56"
            >
                {contacts.map(({ person, label }) => (
                    <DropdownMenuItem
                        key={`${label}-${person.id}`}
                        disabled={!person.phoneDigits}
                        onClick={() => person.phoneDigits && onSelect(person)}
                    >
                        <ActionIcon aria-hidden />
                        <span className="flex flex-col min-inline-0">
                            <span>
                                {actionLabel} {label.toLowerCase()}
                            </span>
                            <span className="body-xs truncate text-ink-muted">
                                {formatPersonName(person.name)}
                                {!person.phoneDigits ? " · No phone number" : ""}
                            </span>
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const VisitCard = memo(function VisitCard({
    visit,
    onAction,
}: {
    visit: BrokerSiteVisit;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    const mobile = useMobileMenu();
    const [actionsOpen, setActionsOpen] = useState(false);
    const afterClose = useRef<null | (() => void)>(null);
    const status = VISIT_STATUS[visit.status];
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
    const actionTrigger = (
        <IconButton
            type="button"
            size="sm"
            className="shrink-0"
            aria-label={`Actions for ${visit.property.title}, ${when}`}
        >
            <MoreHorizontal aria-hidden className="block-4 inline-4" />
        </IconButton>
    );

    return (
        <article
            data-linked-card
            aria-label={`${visit.property.title}, ${when}, ${status.label}`}
            className={cn(
                "flex flex-col gap-3 rounded-[20px] border border-border-warm bg-surface p-4 shadow-sm block-full min-inline-0",
                cancelled && "bg-surface-muted",
            )}
        >
            <CardLink href={propertyHref} label={`Open ${visit.property.title}`} />
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
                    {status.label}
                </Badge>
                {canCancel ? (
                    mobile ? (
                        <MobileActionDrawer
                            open={actionsOpen}
                            onOpenChange={setActionsOpen}
                            onOpenChangeComplete={(nextOpen) => {
                                if (nextOpen) return;
                                const action = afterClose.current;
                                afterClose.current = null;
                                action?.();
                            }}
                            title="Visit actions"
                            description={when}
                            trigger={actionTrigger}
                        >
                            <button
                                type="button"
                                className={cn(mobileActionClass, "text-danger")}
                                onClick={() => {
                                    afterClose.current = () => onAction("withdraw", visit.id);
                                    setActionsOpen(false);
                                }}
                            >
                                Cancel visit
                            </button>
                        </MobileActionDrawer>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger render={actionTrigger} />
                            <DropdownMenuContent align="end" className="min-inline-56">
                                <DangerMenuItem
                                    icon="trash"
                                    label="Cancel visit"
                                    onSelect={() => onAction("withdraw", visit.id)}
                                />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                ) : null}
            </header>

            <div className="flex items-center gap-3 min-inline-0">
                <PropertyCoverImage src={visit.property.coverUrl} alt="" size={80}>
                    {visit.property.coverUrl && (visit.property.photoCount ?? 0) > 1 ? (
                        <span className="body-xs absolute inset-e-1 inset-be-1 rounded-full bg-ink/65 px-1.5 py-0.5 font-semibold text-surface tabular-nums">
                            +{visit.property.photoCount! - 1}
                        </span>
                    ) : null}
                </PropertyCoverImage>
                <div className="flex flex-1 flex-col gap-1 min-inline-0">
                    <PriceWithCommission
                        amountInr={visit.property.amountInr}
                        isRent={visit.property.purpose === "rent"}
                        commissionPercent={visit.property.commissionPercent}
                        commissionAmountInr={visit.property.commissionAmountInr}
                        audience="broker"
                        size="lg"
                    />
                    <h3
                        data-card-title
                        className="body truncate font-semibold tracking-wide text-ink capitalize"
                    >
                        <Link
                            href={propertyHref}
                            prefetch={false}
                            className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            {propertyName}
                        </Link>
                    </h3>
                    <p className="body-sm flex items-center gap-1.5 tracking-wide text-ink-muted min-inline-0">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span className="truncate capitalize">
                            {visit.property.locality}, {visit.property.city}
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-inner border border-emerald-300 bg-emerald-50 p-3">
                <div className="flex items-center gap-2.5 min-inline-0">
                    <span className="flex shrink-0 items-center justify-center text-brand-text">
                        <CalendarDays aria-hidden className="block-4.5 inline-4.5" />
                    </span>
                    <div className="space-y-0.5 min-inline-0">
                        <p className="body-sm font-semibold text-ink">
                            <time dateTime={visit.startsAt}>{formatVisitDate(visit.startsAt)}</time>
                        </p>
                        <p className="body-xs font-medium text-ink-muted">
                            {durationMinutes(visit.startsAt, visit.endsAt)} min visit
                        </p>
                    </div>
                </div>
                <div className="shrink-0 space-y-0.5 text-end tabular-nums">
                    <p className="body-sm font-bold text-ink">
                        <time dateTime={visit.startsAt}>{formatVisitTime(visit.startsAt)}</time>
                    </p>
                    <p className="body-xs font-medium text-ink-muted">
                        Until <time dateTime={visit.endsAt}>{formatVisitTime(visit.endsAt)}</time>
                    </p>
                </div>
            </div>

            <PartyMeetRow
                highlightOnHover={false}
                left={{
                    id: visit.owner.id,
                    contactType: "owner",
                    name: visit.owner.name,
                    avatarUrl: visit.owner.avatarUrl,
                    role: "Owner",
                }}
                right={{
                    name: buyer?.name ?? "No client linked",
                    avatarUrl: buyer?.avatarUrl,
                    role: "Client",
                    people: visit.buyers,
                }}
            />

            <footer className="mbs-auto flex gap-2">
                {(["call", "whatsapp"] as const).map((channel) => {
                    const contacts = [
                        { person: visit.owner, label: "Owner" },
                        ...visit.buyers.map((person) => ({ person, label: "Client" })),
                    ];
                    return (
                        <VisitContactMenu
                            key={channel}
                            channel={channel}
                            propertyTitle={visit.property.title}
                            contacts={contacts}
                            onSelect={(person) => {
                                if (channel === "whatsapp") openWhatsApp(person);
                                else if (person.phoneDigits) {
                                    window.location.href = formatTelUrl(person.phoneDigits);
                                }
                            }}
                        />
                    );
                })}
            </footer>
        </article>
    );
});
