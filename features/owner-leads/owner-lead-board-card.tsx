"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Building2, MapPin, Maximize2, MessageCircle, Phone } from "lucide-react";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import { parseInr } from "@/lib/format/inr";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    isFinishedLead,
    leadBrokerLabel,
    leadClientLabel,
    leadPropertyFacts,
    leadPropertyLabel,
    leadWhatsappMessage,
    OfferStatusPill,
    StagePill,
} from "@/features/owner-leads/owner-lead-meta";

const footerActionClass = `
  flex items-center justify-center rounded-control text-ink-muted block-control-sm
  inline-control-sm
  hover:bg-surface-muted hover:text-ink
`;

function FooterAction({
    href,
    label,
    external = false,
    children,
}: {
    href: string;
    label: string;
    external?: boolean;
    children: ReactNode;
}) {
    const trigger = external ? (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={footerActionClass}
        >
            {children}
        </a>
    ) : href.startsWith("tel:") ? (
        <a href={href} aria-label={label} className={footerActionClass}>
            {children}
        </a>
    ) : (
        <Link href={href} aria-label={label} className={footerActionClass}>
            {children}
        </Link>
    );

    return (
        <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
    );
}

function PartyRow({ name, role }: { name: string; role: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <UserAvatar name={name} size="2xs" fallback="character" className="shrink-0" />
            <span className="body-sm truncate font-semibold text-ink">{name}</span>
            <span className="body-xs ms-auto shrink-0 text-ink-subtle">{role}</span>
        </div>
    );
}

/**
 * Compact lead card for the owner's Board view. Mirrors the broker's board
 * card (DealCard): title and price on one line, the two people on the deal,
 * then a footer of icon actions with the one decision on the right.
 */
export function OwnerLeadBoardCard({
    lead,
    busy,
    onAccept,
    onReject,
}: {
    lead: PropertyLead;
    busy: boolean;
    onAccept: () => void;
    onReject: () => void;
}) {
    const isFinished = isFinishedLead(lead);
    // A sold or lost deal cannot take an offer, whatever the offer row says.
    const pendingOffer = lead.offerStatus === "pending" && !isFinished;
    const propertyLabel = leadPropertyLabel(lead);
    const brokerName = leadBrokerLabel(lead);
    const facts = leadPropertyFacts(lead);
    const offerAmount = parseInr(lead.offerAmount);
    const updatedAt = lead.updatedAt || lead.createdAt;
    const when = updatedAt ? parseApiInstant(updatedAt) : null;
    const brokerPhone = lead.broker?.phone?.trim();
    const offerStatus = <OfferStatusPill status={lead.offerStatus} />;

    return (
        <article
            aria-label={`${brokerName} on ${propertyLabel}`}
            className={cn(
                `
                  flex flex-col justify-between gap-2 rounded-card border border-border-warm p-4
                  shadow-sm
                  hover:border-ink/25
                `,
                busy && "pointer-events-none opacity-60",
                isFinished ? "bg-surface-muted/40" : "bg-surface",
            )}
        >
            <div className="flex flex-col gap-4 min-block-0">
                <PropertyThumb
                    src={facts.imageSrc}
                    alt={propertyLabel}
                    className="border border-border-warm"
                    sizeClassName="aspect-[4/3] inline-full"
                    sizes="(max-width: 1024px) 288px, 320px"
                    iconClassName="block-8 inline-8"
                    hoverScale={false}
                />

                <div className="flex flex-col gap-1.5 min-inline-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <Link
                            href={ownerPropertyDetailHref(lead.propertyId)}
                            className="
                              body-sm truncate font-semibold text-ink underline-offset-4
                              hover:underline
                            "
                        >
                            {propertyLabel}
                        </Link>
                        {facts.askingInr != null ? (
                            <Price
                                amountInr={facts.askingInr}
                                isRent={facts.isRent}
                                className="body-sm shrink-0 font-semibold text-brand"
                            />
                        ) : null}
                    </div>

                    <p
                        className="
                          body-xs flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold
                          text-ink-muted min-inline-0
                        "
                    >
                        {facts.locality ? (
                            <span className="flex items-center gap-1 min-inline-0">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3 inline-3"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate">{facts.locality}</span>
                            </span>
                        ) : null}
                        {facts.areaSqft || facts.configLabel ? (
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <Maximize2
                                    aria-hidden
                                    className="shrink-0 block-3 inline-3"
                                    strokeWidth={1.75}
                                />
                                {[
                                    facts.areaSqft ? formatAreaSqft(facts.areaSqft) : null,
                                    facts.configLabel,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        ) : null}
                    </p>
                </div>

                <div className="flex flex-col gap-2.5">
                    <PartyRow name={brokerName} role="Broker" />
                    <PartyRow name={leadClientLabel(lead)} role="Buyer" />
                </div>

                <div className="flex flex-col gap-2 font-medium">
                    {isFinished ? (
                        <div className="flex flex-wrap gap-1.5">
                            <StagePill stage={lead.stage} />
                            {lead.offerStatus === "pending" ? null : offerStatus}
                        </div>
                    ) : lead.offerStatus ? (
                        <div className="flex">{offerStatus}</div>
                    ) : null}

                    <p className="body-xs text-ink">
                        {offerAmount != null ? (
                            <>
                                Offer{" "}
                                <Price
                                    amountInr={offerAmount}
                                    isRent={facts.isRent}
                                    className="font-semibold text-ink"
                                />
                            </>
                        ) : (
                            "No offer yet"
                        )}
                        {when ? (
                            <span className="text-ink-muted">
                                {" "}
                                · Updated {formatRelativePast(when, new Date())}
                            </span>
                        ) : null}
                    </p>
                </div>

                {/* Its own full-width row: squeezed into the footer beside
                    three icons, the two buttons overflowed a 270px column. */}
                {pendingOffer ? (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={onReject}
                            className="flex-1"
                        >
                            Reject
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={busy}
                            loading={busy}
                            onClick={onAccept}
                            className="flex-1"
                        >
                            Accept
                        </Button>
                    </div>
                ) : null}
            </div>

            <div className="mbs-2 flex items-center gap-1 border-bs border-border-warm pbs-3">
                <div className="flex items-center gap-1">
                    {brokerPhone ? (
                        <>
                            <FooterAction href={formatTelUrl(brokerPhone)} label="Call broker">
                                <Phone
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            </FooterAction>
                            <FooterAction
                                href={formatWhatsAppUrl(brokerPhone, leadWhatsappMessage(lead))}
                                label="WhatsApp broker"
                                external
                            >
                                <MessageCircle
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            </FooterAction>
                        </>
                    ) : null}
                    <FooterAction
                        href={ownerPropertyDetailHref(lead.propertyId)}
                        label="View property"
                    >
                        <Building2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </FooterAction>
                </div>
            </div>
        </article>
    );
}
