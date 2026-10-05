"use client";

import Link from "next/link";

import {
    Building2,
    Check,
    Clock,
    HandCoins,
    Images,
    MapPin,
    MessageCircle,
    Move3d,
    Phone,
    StickyNote,
    X,
} from "lucide-react";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import { parseInr } from "@/lib/format/inr";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

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

function PartyCell({ name, role }: { name: string; role: string }) {
    return (
        <div className="flex items-center gap-2.5 min-inline-0">
            <UserAvatar name={name} size="xs" fallback="character" className="shrink-0" />
            <div className="flex flex-col min-inline-0">
                <span className="body-xs text-ink-subtle">{role}</span>
                <span className="body-sm truncate font-semibold text-ink">{name}</span>
            </div>
        </div>
    );
}

const actionButtonClass = `
  body-sm flex flex-1 items-center justify-center gap-2 rounded-control border
  border-border-warm bg-surface font-medium text-ink block-control-lg
  hover:border-ink/25 hover:bg-surface-muted
`;

/**
 * Owner-side lead card. Laid out like the broker's pipeline list card
 * (DealCardRich) — stage pill, property, price, the two people on the deal,
 * then actions — so both portals read a deal the same way.
 */
export function OwnerLeadCard({
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
    const now = new Date();
    const isFinished = isFinishedLead(lead);
    // A sold or lost deal cannot take an offer, whatever the offer row says.
    const pendingOffer = lead.offerStatus === "pending" && !isFinished;
    const facts = leadPropertyFacts(lead);
    const brokerName = leadBrokerLabel(lead);
    const clientName = leadClientLabel(lead);
    const propertyLabel = leadPropertyLabel(lead);
    const location = [facts.locality, facts.city === facts.locality ? null : facts.city]
        .filter(Boolean)
        .join(", ");
    const offerAmount = parseInr(lead.offerAmount);
    const updatedAt = lead.updatedAt || lead.createdAt;
    const when = updatedAt ? parseApiInstant(updatedAt) : null;
    const brokerPhone = lead.broker?.phone?.trim();
    const notes = lead.notes?.trim();

    return (
        <article
            aria-label={`${brokerName} on ${propertyLabel}`}
            className={cn(
                `
                  flex flex-col overflow-hidden rounded-card border border-border-warm shadow-sm
                  hover:border-ink/25
                `,
                busy && "pointer-events-none opacity-60",
                isFinished ? "bg-surface-muted/40" : "bg-surface",
            )}
        >
            <div className="relative block-52">
                {facts.imageSrc ? (
                    <AppImage
                        src={facts.imageSrc}
                        alt={propertyLabel}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                    />
                ) : (
                    // Designed empty state, never a broken image — docs/DESIGN.md §4.5.
                    <div
                        className="
                          flex flex-col items-center justify-center gap-1 bg-surface-muted
                          block-full
                        "
                    >
                        <Images
                            aria-hidden
                            className="text-ink-subtle block-6 inline-6"
                            strokeWidth={1.5}
                        />
                        <p className="body-xs text-ink-subtle">No photos yet</p>
                    </div>
                )}

                <div
                    className="absolute inset-bs-0 flex items-start justify-between p-3 inline-full"
                >
                    <StagePill stage={lead.stage} />
                    {facts.photoCount > 1 ? (
                        <span
                            className="
                              body-xs flex items-center gap-1 rounded-control bg-ink/60 px-2 py-1
                              font-medium text-white
                            "
                        >
                            <Images aria-hidden className="block-3 inline-3" strokeWidth={2} />
                            {facts.photoCount}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="h6 truncate text-ink">
                        <Link
                            href={ownerPropertyDetailHref(lead.propertyId)}
                            className="underline-offset-4 hover:underline"
                        >
                            {propertyLabel}
                        </Link>
                    </h2>

                    <div
                        className="
                          body-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted
                        "
                    >
                        {location ? (
                            <span className="flex items-center gap-1.5 min-inline-0">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate">{location}</span>
                            </span>
                        ) : null}
                        {facts.areaSqft || facts.configLabel ? (
                            <>
                                {location ? (
                                    <span aria-hidden className="text-border-warm">
                                        |
                                    </span>
                                ) : null}
                                <span className="flex items-center gap-1.5">
                                    <Move3d
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {[
                                        facts.areaSqft ? formatAreaSqft(facts.areaSqft) : null,
                                        facts.configLabel,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    {facts.askingInr != null ? (
                        <Price
                            amountInr={facts.askingInr}
                            isRent={facts.isRent}
                            className="h5 text-brand"
                        />
                    ) : (
                        <span />
                    )}
                    <OfferStatusPill
                        status={
                            isFinished && lead.offerStatus === "pending" ? null : lead.offerStatus
                        }
                    />
                </div>

                <div className="body-sm flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {offerAmount != null ? (
                        <span className="flex items-center gap-1.5 text-ink">
                            <HandCoins
                                aria-hidden
                                className="text-ink-muted block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            Buyer offered{" "}
                            <Price
                                amountInr={offerAmount}
                                isRent={facts.isRent}
                                className="font-semibold text-ink"
                            />
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-ink-muted">
                            <HandCoins
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            No offer yet
                        </span>
                    )}
                    {when ? (
                        <span className="flex items-center gap-1.5 text-ink-muted">
                            <Clock aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Updated {formatRelativePast(when, now)}
                        </span>
                    ) : null}
                </div>

                <div
                    className="
                      grid grid-cols-2 items-center gap-3 divide-x divide-border-warm rounded-inner
                      bg-surface-muted p-3
                    "
                >
                    <PartyCell name={brokerName} role="Broker" />
                    <div className="ps-3 min-inline-0">
                        <PartyCell name={clientName} role="Buyer" />
                    </div>
                </div>

                {notes ? (
                    <p className="body-sm flex items-start gap-1.5 text-ink-muted">
                        <StickyNote
                            aria-hidden
                            className="mbs-0.5 shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="line-clamp-2">{notes}</span>
                    </p>
                ) : null}

                <div className="flex items-center gap-2">
                    {brokerPhone ? (
                        <>
                            <a href={formatTelUrl(brokerPhone)} className={actionButtonClass}>
                                <Phone
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                Call
                            </a>
                            <a
                                href={formatWhatsAppUrl(brokerPhone, leadWhatsappMessage(lead))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={actionButtonClass}
                            >
                                <MessageCircle
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                WhatsApp
                            </a>
                        </>
                    ) : null}
                    <Link
                        href={ownerPropertyDetailHref(lead.propertyId)}
                        className={actionButtonClass}
                    >
                        <Building2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Property
                    </Link>
                </div>

                {pendingOffer ? (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={busy}
                            onClick={onReject}
                            className="flex-1"
                        >
                            <X aria-hidden strokeWidth={2} />
                            Reject
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            size="lg"
                            disabled={busy}
                            loading={busy}
                            onClick={onAccept}
                            className="flex-1"
                        >
                            <Check aria-hidden strokeWidth={2} />
                            Accept offer
                        </Button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
