"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Bell, Send, UserPlus } from "lucide-react";

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { attemptActions } from "@/features/properties/my-requests/attempt-rules";
import {
    DealCardPhotoToolbar,
    DealAttachedBuyers,
    DealOverlayCard,
    DealOverlayFooter,
    DealOverlayStats,
    dealSecondaryButtonClass,
    type DealStatusTone,
} from "@/features/properties/my-requests/deal-card-chrome";
import { REQUEST_STAGE_META } from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import {
    REMINDER_LIMIT,
    type RequestItem,
    type RequestStage,
} from "@/features/properties/my-requests/types";
const STATUS_TONE: Record<RequestStage, DealStatusTone> = {
    pending: "waiting",
    approved: "success",
    declined: "danger",
    cancelled: "closed",
    locked: "closed",
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
        canSend: true,
        closed: item.stage === "declined" || item.stage === "cancelled" || item.stage === "locked",
    };
}

/** The owner's number is shared only once they approve. */
function ownerPhoneFor(item: RequestItem): string | undefined {
    return item.stage === "approved" ? item.ownerPhoneDigits : undefined;
}

function RequestCardFooter({
    item,
    onNudge,
    onRetry,
    onAddBuyers,
    isBusy,
}: {
    item: RequestItem;
    onNudge: (id: string) => void;
    onRetry: (id: string) => void;
    onAddBuyers: () => void;
    isBusy: boolean;
}) {
    const actions = attemptActions(item);
    const secondaryClass = dealSecondaryButtonClass();

    // Card tap already opens the listing — footer only keeps the stage action.
    if (item.stage === "pending") {
        return (
            <DealOverlayFooter>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex inline-full">
                                <Button
                                    size="md"
                                    variant={actions.canRemind ? "accent" : "outline"}
                                    disabled={!actions.canRemind || isBusy}
                                    onClick={() => onNudge(item.id)}
                                    className={cn(
                                        "inline-full",
                                        !actions.canRemind && secondaryClass,
                                    )}
                                >
                                    <Bell
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {actions.canRemind ? "Send reminder" : "Reminders used"}
                                </Button>
                            </span>
                        }
                    />
                    <TooltipContent>
                        {actions.canRemind
                            ? `Send the owner a reminder (${actions.remindersLeft} of ${REMINDER_LIMIT} left).`
                            : "You already used both reminders for this attempt."}
                    </TooltipContent>
                </Tooltip>
            </DealOverlayFooter>
        );
    }

    if (actions.canRetry) {
        return (
            <DealOverlayFooter>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={() => onRetry(item.id)}
                    className="inline-full"
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Ask again
                </Button>
            </DealOverlayFooter>
        );
    }

    if (item.stage === "approved") {
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

export function RequestCard({
    item,
    onNudge,
    onWithdraw,
    onRetry,
    onBuyersChanged,
    isBusy = false,
}: {
    item: RequestItem;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    onRetry: (id: string) => void;
    onBuyersChanged: () => void;
    isBusy?: boolean;
}) {
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const { openChat } = useChat();
    const actions = attemptActions(item);
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
            onOpenTimeline={() => setIsTimelineOpen(true)}
            onCancelRequest={actions.canCancel ? () => onWithdraw(item.id) : undefined}
            tone="overlay"
        />
    );

    return (
        <TooltipProvider>
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={REQUEST_STAGE_META[item.stage].label}
                statusTone={STATUS_TONE[item.stage]}
                muted={item.stage !== "pending" && item.stage !== "approved" && !actions.canRetry}
                isBusy={isBusy}
                actions={cardMenu}
            >
                <DealOverlayStats
                    listing={item}
                    ownerName={item.ownerName}
                    ownerPhoneDigits={ownerPhoneDigits}
                />
                {item.stage === "approved" && item.attachedClients.length > 0 ? (
                    <DealAttachedBuyers
                        buyers={item.attachedClients}
                        onManage={() => setIsBuyersOpen(true)}
                    />
                ) : null}
                <RequestCardFooter
                    item={item}
                    onNudge={onNudge}
                    onRetry={onRetry}
                    onAddBuyers={() => setIsBuyersOpen(true)}
                    isBusy={isBusy}
                />
            </DealOverlayCard>

            <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
                <DialogPopup className="gap-0 p-0 max-inline-md">
                    <DialogHeader className="border-be border-border-warm px-5 py-4">
                        <DialogTitle>What happened</DialogTitle>
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
                <AttachBuyersModal
                    open={isBuyersOpen}
                    onOpenChange={setIsBuyersOpen}
                    request={item}
                    onSaved={onBuyersChanged}
                />
            ) : null}
        </TooltipProvider>
    );
}
