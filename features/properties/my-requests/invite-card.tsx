"use client";

import { useEffect, useState } from "react";

import { Check, Send, X } from "@/components/shared/icons";

import { formatRelativePast } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { CancelRepresentationDialog } from "@/features/representation/cancel-representation-dialog";
import {
    DealCardPhotoToolbar,
    DealAttachedBuyers,
    DealContactSplitBar,
    DealOverlayCard,
    DealOverlayFooter,
    DealOverlayStats,
    dealSecondaryButtonClass,
    type DealStatusTone,
} from "@/features/properties/my-requests/deal-card-chrome";
import { INVITE_STAGE_META } from "@/features/properties/my-requests/invite-stage-meta";
import { CancelledNote } from "@/features/properties/my-requests/cancelled-note";
import { endedStageLabel } from "@/features/properties/my-requests/request-stage-meta";
import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import type { RequestItem, RequestTimelineStep } from "@/features/properties/my-requests/types";
const STATUS_TONE: Record<InviteStage, DealStatusTone> = {
    // The owner is waiting on the broker — the one state here that needs action.
    pending: "action",
    accepted: "success",
    declined: "closed",
    expired: "closed",
    ended: "closed",
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
        bathrooms: item.bathrooms,
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
        unreadMessageCount: item.unreadMessageCount,
    };
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
        // Chat opens once the owner has invited — broker need not accept first.
        canSend: item.stage === "pending" || item.stage === "accepted",
        closed: item.stage === "declined" || item.stage === "expired",
    };
}

/** The owner's number is shared only once the broker accepts. */
function ownerPhoneFor(item: InviteItem): string | undefined {
    return item.stage === "accepted" ? item.ownerPhoneDigits : undefined;
}

function inviteTimeline(item: InviteItem): RequestTimelineStep[] {
    const steps: RequestTimelineStep[] = [
        {
            key: "sent",
            label: "Owner invited you",
            at: item.invitedAt,
        },
    ];

    if (item.stage === "accepted" && item.respondedAt) {
        steps.push({
            key: "approved",
            label: "You accepted the invite",
            at: item.respondedAt,
        });
    } else if (item.stage === "declined" && item.respondedAt) {
        steps.push({
            key: "declined",
            label: "You declined the invite",
            at: item.respondedAt,
        });
    } else if (item.stage === "expired") {
        steps.push({
            key: "cancelled",
            label: "Invite expired",
            at: item.respondedAt ?? item.invitedAt,
        });
    }

    return steps;
}

function InviteCardFooter({
    item,
    onAccept,
    onDecline,
    onAskToSell,
    isBusy,
    pin = true,
}: {
    item: InviteItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    /** Declined / expired — reset to the same Ask to sell CTA as owner listings. */
    onAskToSell?: (propertyId: string) => void;
    isBusy: boolean;
    pin?: boolean;
}) {
    const secondaryClass = dealSecondaryButtonClass();

    // Card tap already opens the listing — footer only keeps the stage action.
    if (item.stage === "pending") {
        return (
            <DealOverlayFooter pin={pin}>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onDecline(item.id)}
                    className={cn("flex-1 min-inline-0", secondaryClass)}
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    Cancel
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={() => onAccept(item.id)}
                    className="flex-1 min-inline-0"
                >
                    <Check aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    Accept
                </Button>
            </DealOverlayFooter>
        );
    }

    // Accepted: attach buyers lives on the Buyers row (link), not a footer CTA.
    if (item.stage === "accepted") {
        return null;
    }

    // Declined / expired — same reset card as owner listings (no Find similar).
    if (onAskToSell) {
        return (
            <DealOverlayFooter pin={pin}>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={() => onAskToSell(item.propertyId)}
                    className="inline-full"
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Ask to sell
                </Button>
            </DealOverlayFooter>
        );
    }

    return null;
}

export function InviteCard({
    item,
    onAccept,
    onDecline,
    onAskToSell,
    onBuyersChanged,
    onRepresentationCancelled,
    isBusy = false,
}: {
    item: InviteItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onAskToSell?: (propertyId: string) => void;
    onBuyersChanged: () => void;
    /** Accepted deal ended from the ⋯ menu — refresh so the card leaves the tab. */
    onRepresentationCancelled?: () => void;
    isBusy?: boolean;
}) {
    const isResetCard = item.stage === "declined" || item.stage === "expired";
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [isStopOpen, setIsStopOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [unreadMessageCount, setUnreadMessageCount] = useState(item.unreadMessageCount ?? 0);
    const { openChat } = useChat();
    const ownerPhoneDigits = ownerPhoneFor(item);
    const canChat = item.stage === "pending" || item.stage === "accepted";

    useEffect(() => {
        setUnreadMessageCount(item.unreadMessageCount ?? 0);
    }, [item.id, item.unreadMessageCount]);

    function openOwnerChat() {
        setUnreadMessageCount(0);
        openChat(chatPeerFor(item));
    }

    const cardMenu = (
        <DealCardPhotoToolbar
            listing={item}
            contact={
                canChat
                    ? {
                          name: item.ownerName,
                          phoneDigits: ownerPhoneDigits,
                          onMessage: openOwnerChat,
                      }
                    : undefined
            }
            onAddBuyer={item.stage === "accepted" ? () => setIsBuyersOpen(true) : undefined}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            onStopRepresenting={item.stage === "accepted" ? () => setIsStopOpen(true) : undefined}
            tone="overlay"
        />
    );

    return (
        <TooltipProvider>
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={
                    item.stage === "ended"
                        ? endedStageLabel(item.endedBy)
                        : INVITE_STAGE_META[item.stage].label
                }
                statusTone={STATUS_TONE[item.stage]}
                muted={
                    item.stage === "declined" || item.stage === "expired" || item.stage === "ended"
                }
                isBusy={isBusy}
                actions={cardMenu}
            >
                {item.message ? (
                    <p className="body-sm line-clamp-2 tracking-wide text-ink-muted italic">
                        “{item.message}”
                    </p>
                ) : null}
                <div className="flex flex-col gap-3.5 min-inline-0">
                    <DealOverlayStats
                        listing={item}
                        ownerName={item.ownerName}
                        ownerAvatarUrl={item.ownerAvatarUrl}
                        ownerPhoneDigits={ownerPhoneDigits}
                    />
                    {item.stage === "accepted" ? (
                        <DealAttachedBuyers
                            buyers={item.attachedClients}
                            onAttach={() => setIsBuyersOpen(true)}
                        />
                    ) : null}
                    {item.stage === "ended" ? (
                        <CancelledNote endedBy={item.endedBy} reason={item.cancelReason} />
                    ) : null}
                </div>
                {ownerPhoneDigits ? (
                    <div className="mbs-auto flex flex-col gap-3 inline-full">
                        <InviteCardFooter
                            item={item}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onAskToSell={onAskToSell}
                            isBusy={isBusy}
                            pin={false}
                        />
                        <DealContactSplitBar
                            ownerName={item.ownerName}
                            ownerPhoneDigits={ownerPhoneDigits}
                            unreadMessageCount={unreadMessageCount}
                            onChat={openOwnerChat}
                        />
                    </div>
                ) : (
                    <InviteCardFooter
                        item={item}
                        onAccept={onAccept}
                        onDecline={onDecline}
                        onAskToSell={onAskToSell}
                        isBusy={isBusy}
                    />
                )}
            </DealOverlayCard>

            <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
                <DialogPopup className="gap-0 p-0 max-inline-md">
                    <DialogHeader className="border-be border-border-warm px-5 py-4">
                        <DialogTitle>Request timeline</DialogTitle>
                        <DialogClose />
                    </DialogHeader>
                    <div className="px-5 py-4">
                        <p className="body-xs text-ink-muted">
                            Invited {formatRelativePast(new Date(item.invitedAt), new Date())}
                        </p>
                        <RequestTimeline steps={inviteTimeline(item)} />
                    </div>
                </DialogPopup>
            </Dialog>

            {item.stage === "accepted" ? (
                <>
                    <AttachBuyersModal
                        open={isBuyersOpen}
                        onOpenChange={setIsBuyersOpen}
                        request={asRequestShape(item)}
                        onSaved={onBuyersChanged}
                    />
                    <CancelRepresentationDialog
                        open={isStopOpen}
                        onOpenChange={setIsStopOpen}
                        representationId={item.id}
                        side="broker"
                        propertyTitle={item.title}
                        counterpartName={item.ownerName}
                        onCancelled={onRepresentationCancelled ?? onBuyersChanged}
                    />
                </>
            ) : null}
        </TooltipProvider>
    );
}
