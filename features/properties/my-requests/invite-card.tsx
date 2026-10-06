"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Check, UserPlus } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import {
    DealCardBody,
    DealCardFooter,
    DealCardMeta,
    DealCardPhoto,
    DealCardPhotoToolbar,
    DealCardPrice,
    DealCardShell,
    DealAttachedBuyers,
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
    const secondaryClass = dealSecondaryButtonClass(tone);
    const Footer = tone === "overlay" ? DealOverlayFooter : DealCardFooter;

    // Card tap already opens the listing — footer only keeps the stage action.
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
            </Footer>
        );
    }

    if (item.stage === "accepted") {
        // Buyers already on the card open the modal — no duplicate button.
        if (item.attachedClients.length > 0) return null;

        return (
            <Footer>
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
            </Footer>
        );
    }

    return (
        <Footer>
            <Button
                size="md"
                variant="outline"
                nativeButton={false}
                className={cn("inline-full", secondaryClass)}
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Find similar
            </Button>
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

    const cardMenu = (tone: CardTone) => (
        <DealCardPhotoToolbar
            listing={item}
            isSaved={isSaved}
            onToggleSave={() => void toggleSave()}
            contact={{
                name: item.ownerName,
                phoneDigits: ownerPhoneDigits,
                onMessage: () => openChat(chatPeerFor(item)),
            }}
            tone={tone === "overlay" ? "overlay" : "plain"}
        />
    );

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
                    <div className="flex items-start gap-2">
                        <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                            <DealCardMeta listing={item} />
                        </div>
                        {cardMenu("light")}
                    </div>
                    {item.message ? (
                        <p className="body-sm line-clamp-2 text-ink-muted">“{item.message}”</p>
                    ) : null}
                    <InviteOwnerRow item={item} />
                    {item.stage === "accepted" && item.attachedClients.length > 0 ? (
                        <DealAttachedBuyers
                            buyers={item.attachedClients}
                            onManage={() => setIsBuyersOpen(true)}
                        />
                    ) : null}
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
                actions={cardMenu("overlay")}
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
