"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { addCollection, Icon } from "@iconify/react/offline";
import { Send } from "@/components/shared/icons";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { formatRelativePast } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import tablerMenuIcons from "@/components/shared/tabler-menu.json";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { CancelledNote } from "@/features/properties/my-requests/cancelled-note";
import { CancelRepresentationDialog } from "@/features/representation/cancel-representation-dialog";
import { attemptActions } from "@/features/properties/my-requests/attempt-rules";
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
import {
    endedStageLabel,
    REQUEST_STAGE_META,
} from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import {
    REMINDER_LIMIT,
    type RequestItem,
    type RequestStage,
} from "@/features/properties/my-requests/types";

addCollection(tablerMenuIcons as Parameters<typeof addCollection>[0]);
const STATUS_TONE: Record<RequestStage, DealStatusTone> = {
    pending: "waiting",
    approved: "success",
    declined: "danger",
    cancelled: "closed",
    locked: "closed",
    ended: "closed",
};

function chatPeerFor(item: RequestItem): ChatPeer {
    return {
        id: item.id,
        name: item.ownerName,
        avatarUrl: item.ownerAvatarUrl,
        roleLabel: item.title,
        isOnline: item.stage === "approved",
        representationId: item.id,
        mySide: "broker",
        // Chat opens once the broker has sent a request — approval not required.
        canSend: item.stage === "pending" || item.stage === "approved",
        closed: item.stage === "declined" || item.stage === "cancelled" || item.stage === "locked",
    };
}

/** The owner's number is shared only once they approve. */
function ownerPhoneFor(item: RequestItem): string | undefined {
    return item.stage === "approved" ? item.ownerPhoneDigits : undefined;
}

function RequestCardFooter({
    item,
    onWithdraw,
    onRetry,
    isBusy,
    pin = true,
}: {
    item: RequestItem;
    onWithdraw: (id: string) => void;
    onRetry: (id: string) => void;
    isBusy: boolean;
    pin?: boolean;
}) {
    const actions = attemptActions(item);
    const secondaryClass = dealSecondaryButtonClass();

    // Pending: match owner-listing request card — remind is in ⋯; footer is cancel.
    if (item.stage === "pending") {
        return (
            <DealOverlayFooter pin={pin}>
                <div className="flex flex-col gap-1.5 inline-full">
                    <p className="body-xs text-center font-medium tracking-wide text-ink-muted">
                        Waiting for the owner
                    </p>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="inline-flex inline-full">
                                    <Button
                                        size="md"
                                        variant="outline"
                                        disabled={isBusy}
                                        loading={isBusy}
                                        onClick={() => onWithdraw(item.id)}
                                        className={cn("inline-full", secondaryClass)}
                                    >
                                        {isBusy ? (
                                            "Cancelling…"
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="tabler:x"
                                                    width={16}
                                                    height={16}
                                                    className="shrink-0 block-4 inline-4"
                                                    aria-hidden
                                                />
                                                Cancel request
                                            </>
                                        )}
                                    </Button>
                                </span>
                            }
                        />
                        <TooltipContent>
                            Cancel this request. You can ask again later.
                        </TooltipContent>
                    </Tooltip>
                </div>
            </DealOverlayFooter>
        );
    }

    // Rejected / cancelled with attempts left — same CTA as a fresh owner listing.
    if (actions.canRetry) {
        return (
            <DealOverlayFooter pin={pin}>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={() => onRetry(item.id)}
                    className="inline-full"
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Ask to sell
                </Button>
            </DealOverlayFooter>
        );
    }

    // Approved: attach buyers lives on the Buyers row (link), not a footer CTA.
    if (item.stage === "approved") {
        return null;
    }

    // Locked / ended with no retry — no Find similar; card stays quiet.
    return null;
}

export function RequestCard({
    item,
    onNudge,
    onWithdraw,
    onRetry,
    onBuyersChanged,
    onRepresentationCancelled,
    isBusy = false,
}: {
    item: RequestItem;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    onRetry: (id: string) => void;
    onBuyersChanged: () => void;
    /** Approved deal ended from the ⋯ menu — refresh so the card leaves the tab. */
    onRepresentationCancelled?: () => void;
    isBusy?: boolean;
}) {
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [isStopOpen, setIsStopOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [unreadMessageCount, setUnreadMessageCount] = useState(item.unreadMessageCount ?? 0);
    const { openChat } = useChat();
    const actions = attemptActions(item);
    const ownerPhoneDigits = ownerPhoneFor(item);

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

    const canChat = item.stage === "pending" || item.stage === "approved";

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
            onRemind={item.stage === "pending" ? () => onNudge(item.id) : undefined}
            canRemind={item.stage === "pending" ? actions.canRemind : undefined}
            remindersUsed={item.stage === "pending" ? actions.remindersUsed : undefined}
            remindersLimit={item.stage === "pending" ? REMINDER_LIMIT : undefined}
            onAddBuyer={item.stage === "approved" ? () => setIsBuyersOpen(true) : undefined}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            onStopRepresenting={item.stage === "approved" ? () => setIsStopOpen(true) : undefined}
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
                        : REQUEST_STAGE_META[item.stage].label
                }
                statusTone={STATUS_TONE[item.stage]}
                muted={item.stage !== "pending" && item.stage !== "approved" && !actions.canRetry}
                isBusy={isBusy}
                actions={cardMenu}
            >
                <div className="flex flex-col gap-3.5 min-inline-0">
                    <DealOverlayStats
                        listing={item}
                        ownerName={item.ownerName}
                        ownerAvatarUrl={item.ownerAvatarUrl}
                        ownerPhoneDigits={ownerPhoneDigits}
                    />
                    {item.stage === "approved" ? (
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
                        <RequestCardFooter
                            item={item}
                            onWithdraw={onWithdraw}
                            onRetry={onRetry}
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
                    <RequestCardFooter
                        item={item}
                        onWithdraw={onWithdraw}
                        onRetry={onRetry}
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
                            Sent {formatRelativePast(new Date(item.requestedAt), new Date())}
                        </p>
                        <RequestTimeline steps={item.timeline} />
                    </div>
                </DialogPopup>
            </Dialog>

            {item.stage === "approved" ? (
                <>
                    <AttachBuyersModal
                        open={isBuyersOpen}
                        onOpenChange={setIsBuyersOpen}
                        request={item}
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
