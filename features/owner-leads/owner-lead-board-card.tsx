"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { addCollection, Icon } from "@iconify/react/offline";
import { Building2, Check, Eye, MapPin, MoreHorizontal, Phone, X } from "lucide-react";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import { parseInr } from "@/lib/format/inr";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr } from "@/lib/format/price";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { PartyMeetRow } from "@/components/shared/attached-people-row";
import { OverlayCardActions, OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    isFinishedLead,
    leadBrokerLabel,
    leadClientLabel,
    leadPropertyFacts,
    leadPropertyLabel,
    leadWhatsappMessage,
    LEAD_STAGE_TO_DEAL_STAGE,
    OfferStatusPill,
} from "@/features/owner-leads/owner-lead-meta";
import { DEAL_OUTCOME_META, DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

function formatCardArea(areaSqft: number): string {
    return `${Math.round(areaSqft).toLocaleString("en-IN")} Sqft`;
}

const CHROME_ICON_BUTTON_CLASS = `
  flex shrink-0 items-center justify-center rounded-full border border-border-warm bg-surface
  text-ink-muted block-control-sm inline-control-sm
  hover:border-ink/20 hover:bg-surface-muted hover:text-ink
`;

const DEAL_MENU_SURFACE_CLASS = `
  t-dropdown t-profile-menu animate-none! min-inline-56 rounded-inner border border-border-warm
  bg-surface p-3 text-ink shadow-lg ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted!
  **:data-[slot$=-item]:focus:text-ink!
`;

const DEAL_MENU_ITEM_CLASS = `
  body-sm h-9 cursor-pointer gap-2.5 rounded-inner px-3 font-medium text-ink
  focus:bg-surface-muted! focus:text-ink!
  data-highlighted:bg-surface-muted! data-highlighted:text-ink!
`;

const DEAL_MENU_ICON_CLASS = "menu-stroke-icon shrink-0 block-4 inline-4 text-ink!";

function LeadCoverImage({
    imageSrc,
    title,
    photoCount,
    muted = false,
}: {
    imageSrc: string | null;
    title: string;
    photoCount: number;
    muted?: boolean;
}) {
    const extraCount = photoCount > 1 ? photoCount - 1 : 0;

    return (
        <div
            className="
              relative shrink-0 overflow-hidden rounded-[8px] bg-surface-muted aspect-square
              inline-24
            "
            aria-hidden={!imageSrc}
        >
            {imageSrc ? (
                <AppImage
                    src={imageSrc}
                    alt={title}
                    fill
                    sizes="96px"
                    className={cn("object-cover", muted && "grayscale-60")}
                />
            ) : (
                <div className="flex items-center justify-center text-ink-subtle block-full inline-full">
                    <Building2 className="block-6 inline-6" strokeWidth={1.5} />
                </div>
            )}
            {extraCount > 0 ? (
                <span
                    className="
                      absolute inset-e-1 inset-be-1 rounded-full bg-ink/65 px-1.5 py-0.5 body-xs
                      font-semibold tabular-nums text-surface
                    "
                >
                    +{extraCount}
                </span>
            ) : null}
        </div>
    );
}

function OfferBlock({ lead }: { lead: PropertyLead }) {
    const facts = leadPropertyFacts(lead);
    const offerAmount = parseInr(lead.offerAmount);
    const updatedAt = lead.updatedAt || lead.createdAt;
    const when = updatedAt ? parseApiInstant(updatedAt) : null;
    const ask = facts.askingInr;

    if (offerAmount == null) {
        return (
            <p className="body-xs text-ink">
                No offer yet
                {when ? (
                    <span className="text-ink-muted">
                        {" "}
                        · Updated {formatRelativePast(when, new Date())}
                    </span>
                ) : null}
            </p>
        );
    }

    const gap =
        ask != null && ask > 0
            ? (() => {
                  const delta = offerAmount - ask;
                  const abs = formatPriceInr(Math.abs(delta));
                  if (delta === 0) return { text: "matches ask", isGap: false };
                  return {
                      text: delta > 0 ? `${abs} over ask` : `${abs} under ask`,
                      isGap: true,
                  };
              })()
            : null;

    return (
        <div className="flex flex-col gap-0.5">
            <p className="body-xs text-ink">
                Offer <span className="tabular font-semibold">{formatPriceInr(offerAmount)}</span>
                {gap ? (
                    <>
                        {" · "}
                        <span
                            className={gap.isGap ? "tabular font-medium text-urgent" : "text-ink"}
                        >
                            {gap.text}
                        </span>
                    </>
                ) : null}
            </p>
            <OfferStatusPill
                status={
                    isFinishedLead(lead) && lead.offerStatus === "pending" ? null : lead.offerStatus
                }
            />
        </div>
    );
}

/** Compact, read-only counterpart to the broker Pipeline deal card. */
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
    const router = useRouter();
    const isFinished = isFinishedLead(lead);
    const pendingOffer = lead.offerStatus === "pending" && !isFinished;
    const propertyLabel = leadPropertyLabel(lead);
    const brokerName = leadBrokerLabel(lead);
    const buyerName = leadClientLabel(lead);
    const facts = leadPropertyFacts(lead);
    const brokerPhone = lead.broker?.phone?.trim();
    const detailHref = ownerPropertyDetailHref(lead.propertyId);
    const dealStage = lead.stage ? LEAD_STAGE_TO_DEAL_STAGE[lead.stage] : null;
    const stageMeta = dealStage ? DEAL_STAGE_META[dealStage] : null;
    const outcome =
        lead.stage === "closed_won"
            ? DEAL_OUTCOME_META.closed
            : lead.stage === "closed_lost"
              ? DEAL_OUTCOME_META.lost
              : null;
    const OutcomeIcon = outcome?.icon;
    const headline = [facts.configLabel, facts.areaSqft ? formatCardArea(facts.areaSqft) : null]
        .filter(Boolean)
        .join(" · ");
    const locationLabel = [facts.locality, facts.city].filter(Boolean).join(", ");

    return (
        <article
            aria-label={`${brokerName} on ${propertyLabel}`}
            className={cn(
                `
                  group/marquee relative isolate flex transform-gpu flex-col overflow-hidden
                  rounded-card border border-border-warm bg-surface shadow-md
                  transition-[box-shadow,border-color] duration-160 inline-full
                  hover:shadow-lg
                `,
                busy && "pointer-events-none opacity-60",
                isFinished && "bg-surface-muted/40",
            )}
        >
            <div
                className="
                  pointer-events-none relative z-10 flex flex-1 flex-col gap-2.5 px-4 py-4 text-ink
                  [&_a]:pointer-events-auto [&_button]:pointer-events-auto
                "
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
                        {stageMeta ? (
                            <span
                                className={cn(
                                    `
                                      body-xs inline-flex items-center gap-1.5 rounded-full px-2.5
                                      py-1 font-semibold tracking-wide
                                    `,
                                    stageMeta.pillClass,
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "rounded-full block-1.5 inline-1.5",
                                        stageMeta.dotClass,
                                    )}
                                />
                                {stageMeta.label}
                            </span>
                        ) : outcome && OutcomeIcon ? (
                            <span
                                className="
                                  body-xs inline-flex items-center gap-1.5 rounded-full
                                  bg-surface-muted px-2.5 py-1 font-semibold tracking-wide text-ink
                                "
                            >
                                <OutcomeIcon
                                    aria-hidden
                                    className="block-3 inline-3"
                                    strokeWidth={2}
                                />
                                {outcome.label}
                            </span>
                        ) : null}
                        <span
                            className={cn(
                                `
                                  body-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                                  font-semibold tracking-wide
                                `,
                                facts.isRent
                                    ? "bg-urgent-soft text-urgent"
                                    : "bg-brand-soft text-brand-text",
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "rounded-full block-1.5 inline-1.5",
                                    facts.isRent ? "bg-urgent-mid" : "bg-success-mid",
                                )}
                            />
                            {facts.isRent ? "For rent" : "For sale"}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={busy}
                                    aria-label={`More actions for ${propertyLabel}`}
                                    className={CHROME_ICON_BUTTON_CLASS}
                                />
                            }
                        >
                            <MoreHorizontal
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className={DEAL_MENU_SURFACE_CLASS}
                        >
                            <DropdownMenuItem
                                className={DEAL_MENU_ITEM_CLASS}
                                onClick={() => router.push(detailHref)}
                            >
                                <Eye
                                    aria-hidden
                                    className={DEAL_MENU_ICON_CLASS}
                                    strokeWidth={1.75}
                                />
                                View property
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 min-inline-0">
                    <LeadCoverImage
                        imageSrc={facts.imageSrc}
                        title={propertyLabel}
                        photoCount={facts.photoCount}
                        muted={isFinished}
                    />

                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                        {facts.askingInr != null ? (
                            <Price
                                amountInr={facts.askingInr}
                                isRent={facts.isRent}
                                className="h5 font-semibold tracking-wide"
                            />
                        ) : null}
                        <h3 className="body truncate font-semibold tracking-wide text-ink capitalize">
                            {headline || propertyLabel}
                        </h3>
                        {locationLabel ? (
                            <p
                                className="
                                  body-sm flex items-center gap-1.5 tracking-wide text-ink-muted
                                  min-inline-0
                                "
                            >
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate capitalize">{locationLabel}</span>
                            </p>
                        ) : null}
                        {lead.property?.propertyType || lead.property?.subtype ? (
                            <p className="body-sm tracking-wide text-ink-muted capitalize">
                                {(lead.property.subtype ?? lead.property.propertyType)?.replace(
                                    /_/g,
                                    " ",
                                )}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <OfferBlock lead={lead} />
                </div>

                <PartyMeetRow
                    left={{
                        name: brokerName,
                        role: "Broker",
                    }}
                    right={{
                        name: buyerName,
                        role: "Buyer",
                    }}
                />

                {!isFinished ? (
                    <OverlayCardActions className="flex-col gap-2">
                        {brokerPhone ? (
                            <div className="flex gap-2">
                                <Button
                                    size="md"
                                    variant="outline"
                                    nativeButton={false}
                                    className={cn("flex-1", OVERLAY_GLASS_BUTTON_CLASS)}
                                    render={<a href={formatTelUrl(brokerPhone)} />}
                                >
                                    <Phone
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    Call
                                </Button>
                                <Button
                                    size="md"
                                    variant="outline"
                                    nativeButton={false}
                                    className={cn("flex-1", OVERLAY_GLASS_BUTTON_CLASS)}
                                    render={
                                        <a
                                            href={formatWhatsAppUrl(
                                                brokerPhone,
                                                leadWhatsappMessage(lead),
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        />
                                    }
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
                            </div>
                        ) : null}

                        {pendingOffer ? (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    disabled={busy}
                                    onClick={onReject}
                                    className={cn("flex-1", OVERLAY_GLASS_BUTTON_CLASS)}
                                >
                                    <X aria-hidden className="block-4 inline-4" strokeWidth={2} />
                                    Reject
                                </Button>
                                <Button
                                    type="button"
                                    variant="accent"
                                    size="md"
                                    disabled={busy}
                                    loading={busy}
                                    onClick={onAccept}
                                    className="flex-[1.4] font-semibold"
                                >
                                    <Check
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={2}
                                    />
                                    Accept offer
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="accent"
                                size="md"
                                nativeButton={false}
                                className="inline-full font-semibold"
                                render={<Link href={detailHref} prefetch={false} />}
                            >
                                View property
                            </Button>
                        )}
                    </OverlayCardActions>
                ) : null}
            </div>
        </article>
    );
}
