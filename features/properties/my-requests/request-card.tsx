"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Bell, Ellipsis, Lock, Send, UserPlus } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { formatRelativePast } from "@/lib/format/date";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { OVERLAY_ICON_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import type { ChatPeer } from "@/features/chat/types";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { attemptActions } from "@/features/properties/my-requests/attempt-rules";
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
import { REQUEST_STAGE_META } from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import {
    REMINDER_LIMIT,
    type RequestItem,
    type RequestStage,
} from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

type CardTone = "light" | "overlay";

const STATUS_TONE: Record<RequestStage, DealStatusTone> = {
    pending: "waiting",
    approved: "success",
    declined: "danger",
    cancelled: "closed",
    locked: "closed",
};

function StageBadge({ item }: { item: RequestItem }) {
    const meta = REQUEST_STAGE_META[item.stage];

    return (
        <Badge
            className={cn(
                "body-xs border-0 font-semibold shadow-xs",
                item.stage === "approved" && "bg-brand-soft text-brand-text",
                item.stage === "pending" && "bg-surface/95 text-ink-muted",
                item.stage === "declined" && "bg-danger-soft text-danger",
                (item.stage === "cancelled" || item.stage === "locked") &&
                    "bg-surface/95 text-ink-muted",
            )}
        >
            {meta.label}
        </Badge>
    );
}

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

function RequestOwnerRow({ item }: { item: RequestItem }) {
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

function RequestMoreMenu({
    item,
    tone,
    onOpenTimeline,
    onWithdraw,
}: {
    item: RequestItem;
    tone: CardTone;
    onOpenTimeline: () => void;
    onWithdraw: (id: string) => void;
}) {
    const actions = attemptActions(item);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        type="button"
                        size={tone === "overlay" ? "icon" : "icon-sm"}
                        variant="ghost"
                        aria-label="More actions"
                        className={
                            tone === "overlay"
                                ? OVERLAY_ICON_BUTTON_CLASS
                                : "mbs-0.5 self-start text-ink-muted"
                        }
                    >
                        <Ellipsis aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </Button>
                }
            />
            <DropdownMenuContent align="end" className="min-inline-44">
                <DropdownMenuItem onClick={onOpenTimeline}>What happened</DropdownMenuItem>
                {actions.canCancel ? (
                    <DropdownMenuItem onClick={() => onWithdraw(item.id)} className="text-danger">
                        Cancel request
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function RequestCardFooter({
    item,
    tone,
    onNudge,
    onRetry,
    onAddBuyers,
    isBusy,
}: {
    item: RequestItem;
    tone: CardTone;
    onNudge: (id: string) => void;
    onRetry: (id: string) => void;
    onAddBuyers: () => void;
    isBusy: boolean;
}) {
    const actions = attemptActions(item);
    const secondaryClass = dealSecondaryButtonClass(tone);
    const Footer = tone === "overlay" ? DealOverlayFooter : DealCardFooter;

    // Card tap already opens the listing — footer only keeps the stage action.
    if (item.stage === "pending") {
        return (
            <Footer>
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
            </Footer>
        );
    }

    if (actions.canRetry) {
        return (
            <Footer>
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
            </Footer>
        );
    }

    if (item.stage === "approved") {
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

export function RequestCard({
    item,
    view,
    onNudge,
    onWithdraw,
    onRetry,
    onBuyersChanged,
    isBusy = false,
}: {
    item: RequestItem;
    view: RequestsView;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    onRetry: (id: string) => void;
    onBuyersChanged: () => void;
    isBusy?: boolean;
}) {
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
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

    const photoToolbar = (tone: CardTone) => (
        <DealCardPhotoToolbar
            listing={item}
            isSaved={isSaved}
            onToggleSave={() => void toggleSave()}
        >
            {tone === "overlay" ? moreMenu("overlay") : null}
            <ChatButton peer={chatPeerFor(item)} appearance="overlay" />
            {ownerPhoneDigits ? (
                <DealWhatsAppButton
                    name={item.ownerName}
                    phoneDigits={ownerPhoneDigits}
                    appearance="overlay"
                />
            ) : null}
        </DealCardPhotoToolbar>
    );

    const footer = (tone: CardTone) => (
        <RequestCardFooter
            item={item}
            tone={tone}
            onNudge={onNudge}
            onRetry={onRetry}
            onAddBuyers={() => setIsBuyersOpen(true)}
            isBusy={isBusy}
        />
    );

    const moreMenu = (tone: CardTone) => (
        <RequestMoreMenu
            item={item}
            tone={tone}
            onOpenTimeline={() => setIsTimelineOpen(true)}
            onWithdraw={onWithdraw}
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
                        {moreMenu("light")}
                    </div>

                    <RequestOwnerRow item={item} />

                    {item.stage === "approved" && item.attachedClients.length > 0 ? (
                        <DealAttachedBuyers
                            buyers={item.attachedClients}
                            onManage={() => setIsBuyersOpen(true)}
                        />
                    ) : null}

                    <div className="mbs-auto flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 min-inline-0">
                            <DealCardPrice listing={item} />
                            {item.stage === "locked" ? (
                                <Lock
                                    aria-hidden
                                    className="shrink-0 text-ink-muted block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            ) : null}
                        </div>
                        {footer("light")}
                    </div>
                </DealCardBody>
            </DealCardShell>
        ) : (
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={REQUEST_STAGE_META[item.stage].label}
                statusTone={STATUS_TONE[item.stage]}
                muted={item.stage !== "pending" && item.stage !== "approved" && !actions.canRetry}
                isBusy={isBusy}
                actions={photoToolbar("overlay")}
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
                {footer("overlay")}
            </DealOverlayCard>
        );

    return (
        <TooltipProvider>
            {card}

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
