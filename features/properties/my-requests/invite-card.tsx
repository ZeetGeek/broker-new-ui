"use client";

import { useState } from "react";
import Link from "next/link";

import { Check, UserPlus, X } from "lucide-react";

import { BROKER_OWNER_LISTINGS_HREF, brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import {
    DealCardBody,
    DealCardFooter,
    DealCardMeta,
    DealCardPhoto,
    DealCardPrice,
    DealCardShell,
    DealOverlayCard,
    DealOverlayFooter,
    DealOverlayStats,
    dealSecondaryButtonClass,
    type DealStatusTone,
    DealWhatsAppButton,
} from "@/features/properties/my-requests/deal-card-chrome";
import { INVITE_STAGE_META } from "@/features/properties/my-requests/invite-stage-meta";
import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";
import type { RequestItem } from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

type CardTone = "light" | "overlay";

const STATUS_TONE: Record<InviteStage, DealStatusTone> = {
    // The owner is waiting on the broker — the one state here that needs action.
    pending: "action",
    accepted: "success",
    declined: "closed",
    expired: "closed",
};

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

function StageBadge({ item }: { item: InviteItem }) {
    const meta = INVITE_STAGE_META[item.stage];

    return (
        <Badge
            className={
                item.stage === "accepted"
                    ? "body-xs border-0 bg-brand-soft font-semibold text-brand-text shadow-xs"
                    : item.stage === "pending"
                      ? "body-xs border-0 bg-urgent-soft font-semibold text-urgent shadow-xs"
                      : "body-xs border-0 bg-surface/95 font-semibold text-ink-muted shadow-xs"
            }
        >
            {meta.label}
        </Badge>
    );
}

function chatPeerFor(item: InviteItem): ChatPeer {
    return {
        id: item.id,
        name: item.ownerName,
        avatarUrl: item.ownerAvatarUrl,
        roleLabel: item.title,
        isOnline: item.stage === "accepted",
        representationId: item.id,
        mySide: "broker",
        canSend: true,
        closed: item.stage === "declined" || item.stage === "expired",
    };
}

/** The owner's number is shared only once the broker accepts. */
function ownerPhoneFor(item: InviteItem): string | undefined {
    return item.stage === "accepted" ? item.ownerPhoneDigits : undefined;
}

function InviteOwnerRow({ item }: { item: InviteItem }) {
    const phoneDigits = ownerPhoneFor(item);

    return (
        <div className="flex items-center gap-2 py-1.5 min-inline-0">
            <UserAvatar
                name={item.ownerName}
                imageUrl={item.ownerAvatarUrl}
                size="sm"
                className="shrink-0"
            />
            <div className="flex flex-1 flex-col min-inline-0">
                <p className="body-sm truncate font-medium tracking-wide text-ink capitalize">
                    {item.ownerName}
                </p>
                {phoneDigits ? (
                    <PhoneNumber phoneDigits={phoneDigits} className="body-xs text-ink-muted" />
                ) : (
                    <p className="body-xs text-ink-muted">Owner</p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
                <ChatButton peer={chatPeerFor(item)} />
                {phoneDigits ? (
                    <DealWhatsAppButton name={item.ownerName} phoneDigits={phoneDigits} />
                ) : null}
            </div>
        </div>
    );
}

function InviteCardFooter({
    item,
    tone,
    onAccept,
    onDecline,
    onAddBuyers,
    isBusy,
}: {
    item: InviteItem;
    tone: CardTone;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onAddBuyers: () => void;
    isBusy: boolean;
}) {
    const detailsHref = brokerOwnerListingDetailHref(item.propertyId);
    const secondaryClass = dealSecondaryButtonClass(tone);
    const Footer = tone === "overlay" ? DealOverlayFooter : DealCardFooter;

    const viewDetails = (
        <Button
            size="md"
            variant="accent"
            nativeButton={false}
            className="flex-[1.4]"
            render={<Link href={detailsHref} prefetch={false} />}
        >
            View details
        </Button>
    );

    if (item.stage === "pending") {
        return (
            <Footer>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onDecline(item.id)}
                    className={cn("flex-1", secondaryClass)}
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Decline
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={() => onAccept(item.id)}
                    className="flex-[1.4]"
                >
                    <Check aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    Accept
                </Button>
            </Footer>
        );
    }

    if (item.stage === "accepted") {
        return (
            <Footer>
                <Button
                    size="md"
                    variant="outline"
                    type="button"
                    disabled={isBusy}
                    onClick={onAddBuyers}
                    className={cn("flex-1", secondaryClass)}
                >
                    <UserPlus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    {item.clientsAttached === 0 ? "Add buyer" : "See buyers"}
                </Button>
                {viewDetails}
            </Footer>
        );
    }

    return (
        <Footer>
            <Button
                size="md"
                variant="outline"
                nativeButton={false}
                className={cn("flex-1", secondaryClass)}
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Find similar
            </Button>
            {viewDetails}
        </Footer>
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
    const ownerPhoneDigits = ownerPhoneFor(item);

    const footer = (tone: CardTone) => (
        <InviteCardFooter
            item={item}
            tone={tone}
            onAccept={onAccept}
            onDecline={onDecline}
            onAddBuyers={() => setIsBuyersOpen(true)}
            isBusy={isBusy}
        />
    );

    const card =
        view === "list" ? (
            <DealCardShell view={view} isBusy={isBusy}>
                <DealCardPhoto listing={item} view={view} stageBadge={<StageBadge item={item} />} />

                <DealCardBody view={view}>
                    <DealCardMeta listing={item} />
                    {item.message ? (
                        <p className="body-sm line-clamp-2 text-ink-muted">“{item.message}”</p>
                    ) : null}
                    <InviteOwnerRow item={item} />
                    <div className="mbs-auto flex flex-col gap-2.5">
                        <DealCardPrice listing={item} />
                        {footer("light")}
                    </div>
                </DealCardBody>
            </DealCardShell>
        ) : (
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={INVITE_STAGE_META[item.stage].label}
                statusTone={STATUS_TONE[item.stage]}
                muted={item.stage === "declined" || item.stage === "expired"}
                isBusy={isBusy}
                actions={
                    <>
                        <ChatButton peer={chatPeerFor(item)} appearance="overlay" />
                        {ownerPhoneDigits ? (
                            <DealWhatsAppButton
                                name={item.ownerName}
                                phoneDigits={ownerPhoneDigits}
                                appearance="overlay"
                            />
                        ) : null}
                    </>
                }
            >
                {item.message ? (
                    <p className="body-sm line-clamp-2 tracking-wide text-surface/85 italic">
                        “{item.message}”
                    </p>
                ) : null}
                <DealOverlayStats
                    listing={item}
                    ownerName={item.ownerName}
                    ownerPhoneDigits={ownerPhoneDigits}
                />
                {footer("overlay")}
            </DealOverlayCard>
        );

    return (
        <TooltipProvider>
            {card}

            {item.stage === "accepted" ? (
                <AttachBuyersModal
                    open={isBuyersOpen}
                    onOpenChange={setIsBuyersOpen}
                    request={asRequestShape(item)}
                    onSaved={onBuyersChanged}
                />
            ) : null}
        </TooltipProvider>
    );
}
