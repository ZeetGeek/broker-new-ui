"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Check, UserPlus, X } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { formatRelativePast } from "@/lib/format/date";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
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
import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import type { RequestItem, RequestTimelineStep } from "@/features/properties/my-requests/types";
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
    onAddBuyers,
    isBusy,
    pin = true,
}: {
    item: InviteItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onAddBuyers: () => void;
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

    if (item.stage === "accepted") {
        // Buyers already on the card open the modal — no duplicate button.
        if (item.attachedClients.length > 0) return null;

        return (
            <DealOverlayFooter pin={pin}>
                <Button
                    size="md"
                    variant="accent"
                    type="button"
                    disabled={isBusy}
                    onClick={onAddBuyers}
                    className="inline-full"
                >
                    <UserPlus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Attach buyer
                </Button>
            </DealOverlayFooter>
        );
    }

    return (
        <DealOverlayFooter pin={pin}>
            <Button
                size="md"
                variant="outline"
                nativeButton={false}
                className={cn("inline-full", secondaryClass)}
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Find similar
            </Button>
        </DealOverlayFooter>
    );
}

export function InviteCard({
    item,
    onAccept,
    onDecline,
    onBuyersChanged,
    isBusy = false,
}: {
    item: InviteItem;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    onBuyersChanged: () => void;
    isBusy?: boolean;
}) {
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
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

    async function toggleSave() {
        const next = !isSaved;
        setIsSaved(next);
        try {
            if (next) {
                await propertiesApi.bookmark(item.propertyId);
            } else {
                await propertiesApi.unbookmark(item.propertyId);
            }
        } catch (error) {
            setIsSaved(!next);
            toast.error(error instanceof ApiError ? error.message : "Could not update save");
        }
    }

    const cardMenu = (
        <DealCardPhotoToolbar
            listing={item}
            isSaved={isSaved}
            onToggleSave={() => void toggleSave()}
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
            tone="overlay"
        />
    );

    return (
        <TooltipProvider>
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={INVITE_STAGE_META[item.stage].label}
                statusTone={STATUS_TONE[item.stage]}
                muted={item.stage === "declined" || item.stage === "expired"}
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
                    {item.stage === "accepted" && item.attachedClients.length > 0 ? (
                        <DealAttachedBuyers buyers={item.attachedClients} />
                    ) : null}
                </div>
                {ownerPhoneDigits ? (
                    <div className="mbs-auto flex flex-col gap-3 inline-full">
                        <InviteCardFooter
                            item={item}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onAddBuyers={() => setIsBuyersOpen(true)}
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
                        onAddBuyers={() => setIsBuyersOpen(true)}
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
