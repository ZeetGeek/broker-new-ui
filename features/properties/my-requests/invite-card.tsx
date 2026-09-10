"use client";

import { useState } from "react";
import Link from "next/link";

import { Check, MapPin, Maximize2, MessageCircle, Quote, UserPlus, X } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { INVITE_STAGE_META } from "@/features/properties/my-requests/invite-stage-meta";
import type { InviteItem } from "@/features/properties/my-requests/invite-types";
import type { RequestItem } from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

/**
 * The buyers modal is written against a request. An invite carries the same
 * fields it reads, so adapt rather than duplicate the picker.
 */
function asRequestShape(item: InviteItem): RequestItem {
    return {
        id: item.id,
        propertyId: item.propertyId,
        stage: "approved",
        title: item.title,
        configLabel: item.configLabel,
        propertyTypeLabel: item.propertyTypeLabel,
        locality: item.locality,
        city: item.city,
        areaSqft: item.areaSqft,
        bhk: item.bhk,
        amountInr: item.amountInr,
        isRent: item.isRent,
        commissionPercent: item.commissionPercent,
        ownerName: item.ownerName,
        ownerPhoneDigits: item.ownerPhoneDigits,
        ownerSeen: true,
        requestedAt: item.invitedAt,
        resolvedAt: item.respondedAt,
        daysWaiting: 0,
        clientsAttached: item.clientsAttached,
        attachedClients: item.attachedClients,
        brokerSlotsOpen: item.brokerSlotsOpen,
        brokerSlotsTotal: item.brokerSlotsTotal,
        attemptNumber: 1,
        reminderCount: 0,
        reminderUsed: false,
        nudgedAt: null,
        imageSrc: item.imageSrc,
        timeline: [],
    };
}

function statusLine(item: InviteItem): { text: string; tone: "urgent" | "muted" | "success" } {
    if (item.stage === "pending") {
        return {
            text:
                item.daysWaiting <= 1
                    ? "An owner picked you. Say yes or no."
                    : `An owner picked you ${item.daysWaiting} days ago. They are still waiting.`,
            tone: "urgent",
        };
    }

    if (item.stage === "accepted") {
        return item.clientsAttached === 0
            ? { text: "You accepted. Add a buyer to get started.", tone: "urgent" }
            : { text: "You accepted. You can sell this property.", tone: "success" };
    }

    if (item.stage === "declined") {
        return { text: "You turned this invite down.", tone: "muted" };
    }

    return { text: "You did not answer in time, so the invite closed.", tone: "muted" };
}

function InviteCardActions({
    item,
    onAccept,
    onDecline,
    onAddBuyers,
    isBusy,
}: {
    item: InviteItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onAddBuyers: () => void;
    isBusy: boolean;
}) {
    if (item.stage === "pending") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button size="sm" disabled={isBusy} onClick={() => onAccept(item.id)}>
                                <Check aria-hidden className="block-4 inline-4" strokeWidth={2} />
                                Yes, I will sell it
                            </Button>
                        }
                    />
                    <TooltipContent>
                        Accept the invite. You will get the owner&apos;s number straight away.
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => onDecline(item.id)}
                                className="text-ink-muted hover:text-danger"
                            >
                                <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                                No thanks
                            </Button>
                        }
                    />
                    <TooltipContent>
                        Turn this down. The owner can then ask another broker.
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    if (item.stage === "accepted") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button size="sm" disabled={isBusy} onClick={onAddBuyers}>
                                <UserPlus
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {item.clientsAttached === 0 ? "Add buyer" : "See buyers"}
                            </Button>
                        }
                    />
                    <TooltipContent>
                        {item.clientsAttached === 0
                            ? "Pick which buyers you will show this property to."
                            : "Change the buyers you added for this property."}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-border-warm"
                                render={
                                    <Link href={brokerOwnerListingDetailHref(item.propertyId)} />
                                }
                            >
                                View details
                            </Button>
                        }
                    />
                    <TooltipContent>See photos, price and full property details.</TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-border-warm"
                        render={<Link href="/broker/owner-listings" />}
                    >
                        Find similar
                    </Button>
                }
            />
            <TooltipContent>Find other properties you can send a request for.</TooltipContent>
        </Tooltip>
    );
}

export function InviteCard({
    item,
    view,
    onAccept,
    onDecline,
    onBuyersChanged,
    isBusy = false,
}: {
    item: InviteItem;
    view: RequestsView;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onBuyersChanged: () => void;
    isBusy?: boolean;
}) {
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);

    const meta = INVITE_STAGE_META[item.stage];
    const StageIcon = meta.icon;
    const status = statusLine(item);
    const isList = view === "list";
    const phoneDigits = item.stage === "accepted" ? item.ownerPhoneDigits : undefined;

    return (
        <TooltipProvider>
            <li
                className={cn(
                    `
                      group flex flex-col gap-4 rounded-card border bg-surface p-4
                      transition-[box-shadow,border-color] duration-160
                      hover:border-ink/15 hover:shadow-md
                    `,
                    // A pending invite is the only card here the broker must act on.
                    item.stage === "pending" ? "border-urgent/40" : "border-border-warm",
                    isBusy && "pointer-events-none opacity-60",
                )}
            >
                <div className={cn("flex gap-4", isList ? "flex-col sm:flex-row" : "flex-col")}>
                    <Link
                        href={brokerOwnerListingDetailHref(item.propertyId)}
                        className={cn(
                            `
                              relative shrink-0 overflow-hidden rounded-inner bg-surface-muted
                              focus-visible:ring-2 focus-visible:ring-ring/40
                              focus-visible:outline-none
                            `,
                            isList
                                ? "aspect-4/3 inline-full sm:inline-44 md:inline-52"
                                : "aspect-4/3 inline-full",
                        )}
                    >
                        <AppImage
                            src={item.imageSrc}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 13rem"
                            className="object-cover"
                        />
                    </Link>

                    <div className="flex flex-1 flex-col gap-3 min-inline-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-inline-0">
                                <Link
                                    href={brokerOwnerListingDetailHref(item.propertyId)}
                                    className="
                                      body font-semibold text-ink transition-colors duration-160
                                      hover:text-brand
                                      focus-visible:underline focus-visible:outline-none
                                    "
                                >
                                    {item.title}
                                </Link>
                                <p className="body-sm flex items-center gap-1 text-ink-muted">
                                    <MapPin
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={1.75}
                                    />
                                    {item.locality}, {item.city}
                                </p>
                            </div>

                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Badge variant={meta.badgeVariant}>
                                            <StageIcon aria-hidden strokeWidth={2} />
                                            {meta.label}
                                        </Badge>
                                    }
                                />
                                <TooltipContent>{meta.hint}</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Price
                                amountInr={item.amountInr}
                                isRent={item.isRent}
                                className="body font-semibold"
                            />
                            <span aria-hidden className="text-border-warm">
                                ·
                            </span>
                            <span className="body-sm flex items-center gap-1 text-ink-muted">
                                <Maximize2
                                    aria-hidden
                                    className="block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                {formatAreaSqft(item.areaSqft)}
                            </span>
                            {item.commissionPercent > 0 ? (
                                <>
                                    <span aria-hidden className="text-border-warm">
                                        ·
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="body-sm tabular text-ink-muted">
                                                    {item.commissionPercent}% commission
                                                </span>
                                            }
                                        />
                                        <TooltipContent>
                                            What you earn if this property sells.
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            ) : null}
                        </div>

                        <p
                            className={cn(
                                "body-sm",
                                status.tone === "urgent" && "font-medium text-urgent",
                                status.tone === "success" && "text-success",
                                status.tone === "muted" && "text-ink-muted",
                            )}
                        >
                            {status.text}
                        </p>

                        {item.message ? (
                            <blockquote
                                className="
                                  flex gap-2 rounded-inner border border-border-warm
                                  bg-surface-muted/50 p-3
                                "
                            >
                                <Quote
                                    aria-hidden
                                    className="shrink-0 text-ink-subtle block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <p className="body-sm text-ink">{item.message}</p>
                            </blockquote>
                        ) : null}

                        {item.attachedClients.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <AvatarStack people={item.attachedClients} />
                                <button
                                    type="button"
                                    onClick={() => setIsBuyersOpen(true)}
                                    className="
                                      body-xs font-medium text-ink-muted transition-colors
                                      duration-160
                                      hover:text-ink
                                      focus-visible:underline focus-visible:outline-none
                                    "
                                >
                                    {item.attachedClients.length === 1
                                        ? "1 buyer added"
                                        : `${item.attachedClients.length} buyers added`}
                                </button>
                            </div>
                        ) : null}

                        <div
                            className={cn(
                                "flex flex-wrap items-center justify-between gap-3",
                                phoneDigits &&
                                    `
                                      rounded-inner border border-border-warm bg-surface-muted/50
                                      p-3
                                    `,
                            )}
                        >
                            <div className="flex items-center gap-2.5 min-inline-0">
                                <UserAvatar
                                    name={item.ownerName}
                                    imageUrl={item.ownerAvatarUrl}
                                    size="sm"
                                />
                                <div className="min-inline-0">
                                    <span
                                        className={cn(
                                            "body-sm truncate",
                                            phoneDigits ? "font-medium text-ink" : "text-ink-muted",
                                        )}
                                    >
                                        {item.ownerName}
                                    </span>
                                    {phoneDigits ? (
                                        <PhoneNumber
                                            phoneDigits={phoneDigits}
                                            className="body-xs block text-ink-muted"
                                        />
                                    ) : (
                                        <span className="body-xs block text-ink-muted">Owner</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <ChatButton
                                    peer={{
                                        id: item.id,
                                        name: item.ownerName,
                                        avatarUrl: item.ownerAvatarUrl,
                                        roleLabel: item.title,
                                        isOnline: item.stage === "accepted",
                                        representationId: item.id,
                                        mySide: "broker",
                                        canSend: true,
                                        closed:
                                            item.stage === "declined" || item.stage === "expired",
                                    }}
                                />

                                {phoneDigits ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    nativeButton={false}
                                                    className="
                                                      shrink-0 border-border-warm text-brand
                                                    "
                                                    render={
                                                        <a
                                                            href={formatWhatsAppUrl(phoneDigits)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`Message ${item.ownerName} on WhatsApp`}
                                                        />
                                                    }
                                                >
                                                    <MessageCircle aria-hidden strokeWidth={1.75} />
                                                </Button>
                                            }
                                        />
                                        <TooltipContent>
                                            Message {item.ownerName} on WhatsApp.
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}

                                <span className="body-xs text-ink-muted">
                                    Sent {formatRelativePast(new Date(item.invitedAt), new Date())}
                                </span>
                            </div>
                        </div>

                        <InviteCardActions
                            item={item}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onAddBuyers={() => setIsBuyersOpen(true)}
                            isBusy={isBusy}
                        />
                    </div>
                </div>

                {item.stage === "accepted" ? (
                    <AttachBuyersModal
                        open={isBuyersOpen}
                        onOpenChange={setIsBuyersOpen}
                        request={asRequestShape(item)}
                        onSaved={onBuyersChanged}
                    />
                ) : null}
            </li>
        </TooltipProvider>
    );
}
