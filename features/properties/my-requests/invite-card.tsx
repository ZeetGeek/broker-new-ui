"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Check, UserPlus } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import {
    DealCardPhotoToolbar,
    DealAttachedBuyers,
    DealOverlayCard,
    DealOverlayFooter,
    DealOverlayStats,
    dealSecondaryButtonClass,
    type DealStatusTone,
} from "@/features/properties/my-requests/deal-card-chrome";
import { INVITE_STAGE_META } from "@/features/properties/my-requests/invite-stage-meta";
import type { InviteItem, InviteStage } from "@/features/properties/my-requests/invite-types";
import type { RequestItem } from "@/features/properties/my-requests/types";
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

function InviteCardFooter({
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
    const secondaryClass = dealSecondaryButtonClass();

    // Card tap already opens the listing — footer only keeps the stage action.
    if (item.stage === "pending") {
        return (
            <DealOverlayFooter>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onDecline(item.id)}
                    className={cn("flex-1", secondaryClass)}
                >
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
                    Accept invite
                </Button>
            </DealOverlayFooter>
        );
    }

    if (item.stage === "accepted") {
        // Buyers already on the card open the modal — no duplicate button.
        if (item.attachedClients.length > 0) return null;

        return (
            <DealOverlayFooter>
                <Button
                    size="md"
                    variant="accent"
                    type="button"
                    disabled={isBusy}
                    onClick={onAddBuyers}
                    className="inline-full"
                >
                    <UserPlus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Add buyer
                </Button>
            </DealOverlayFooter>
        );
    }

    return (
        <DealOverlayFooter>
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
    const [isSaved, setIsSaved] = useState(false);
    const { openChat } = useChat();
    const ownerPhoneDigits = ownerPhoneFor(item);

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
            contact={{
                name: item.ownerName,
                phoneDigits: ownerPhoneDigits,
                onMessage: () => openChat(chatPeerFor(item)),
            }}
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
                <DealOverlayStats
                    listing={item}
                    ownerName={item.ownerName}
                    ownerPhoneDigits={ownerPhoneDigits}
                />
                {item.stage === "accepted" && item.attachedClients.length > 0 ? (
                    <DealAttachedBuyers
                        buyers={item.attachedClients}
                        onManage={() => setIsBuyersOpen(true)}
                    />
                ) : null}
                <InviteCardFooter
                    item={item}
                    onAccept={onAccept}
                    onDecline={onDecline}
                    onAddBuyers={() => setIsBuyersOpen(true)}
                    isBusy={isBusy}
                />
            </DealOverlayCard>

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
