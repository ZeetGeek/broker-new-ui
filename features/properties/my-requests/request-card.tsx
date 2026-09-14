"use client";

import { useState } from "react";
import Link from "next/link";

import { Bell, Ellipsis, Lock, Send, UserPlus } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { BROKER_OWNER_LISTINGS_HREF, brokerOwnerListingDetailHref } from "@/lib/routes/broker";
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
    DealCardPrice,
    DealCardShell,
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
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex flex-1">
                                <Button
                                    size="md"
                                    variant="outline"
                                    disabled={!actions.canRemind || isBusy}
                                    onClick={() => onNudge(item.id)}
                                    className={cn(secondaryClass, "inline-full")}
                                >
                                    <Bell
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {actions.canRemind ? "Remind owner" : "Reminders used"}
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
                {viewDetails}
            </Footer>
        );
    }

    if (actions.canRetry) {
        return (
            <Footer>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onRetry(item.id)}
                    className={cn("flex-1", secondaryClass)}
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Send again
                </Button>
                {viewDetails}
            </Footer>
        );
    }

    if (item.stage === "approved") {
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
    const actions = attemptActions(item);
    const ownerPhoneDigits = ownerPhoneFor(item);

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
                muted={
                    item.stage !== "pending" && item.stage !== "approved" && !actions.canRetry
                }
                isBusy={isBusy}
                actions={
                    <>
                        {moreMenu("overlay")}
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
