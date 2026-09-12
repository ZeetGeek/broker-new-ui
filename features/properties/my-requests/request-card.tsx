"use client";

import { useState } from "react";
import Link from "next/link";

import { Bell, Ellipsis, Lock, Send, UserPlus } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { BROKER_OWNER_LISTINGS_HREF, brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

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
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { attemptActions } from "@/features/properties/my-requests/attempt-rules";
import {
    DealCardBody,
    DealCardFooter,
    DealCardMeta,
    DealCardPhoto,
    DealCardPrice,
    DealCardShell,
    DealWhatsAppButton,
} from "@/features/properties/my-requests/deal-card-chrome";
import { REQUEST_STAGE_META } from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import { REMINDER_LIMIT, type RequestItem } from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

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

function RequestOwnerRow({ item }: { item: RequestItem }) {
    const phoneDigits = item.stage === "approved" ? item.ownerPhoneDigits : undefined;

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
                <ChatButton
                    peer={{
                        id: item.id,
                        name: item.ownerName,
                        avatarUrl: item.ownerAvatarUrl,
                        roleLabel: item.title,
                        isOnline: item.stage === "approved",
                        representationId: item.id,
                        mySide: "broker",
                        canSend: true,
                        closed:
                            item.stage === "declined" ||
                            item.stage === "cancelled" ||
                            item.stage === "locked",
                    }}
                />
                {phoneDigits ? (
                    <DealWhatsAppButton name={item.ownerName} phoneDigits={phoneDigits} />
                ) : null}
            </div>
        </div>
    );
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
    const detailsHref = brokerOwnerListingDetailHref(item.propertyId);

    if (item.stage === "pending") {
        return (
            <DealCardFooter>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex flex-1">
                                <Button
                                    size="md"
                                    variant="outline"
                                    disabled={!actions.canRemind || isBusy}
                                    onClick={() => onNudge(item.id)}
                                    className="border-border-warm inline-full"
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
                <Button
                    size="md"
                    variant="accent"
                    nativeButton={false}
                    className="flex-[1.4]"
                    render={<Link href={detailsHref} prefetch={false} />}
                >
                    View details
                </Button>
            </DealCardFooter>
        );
    }

    if (actions.canRetry) {
        return (
            <DealCardFooter>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onRetry(item.id)}
                    className="flex-1 border-border-warm"
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Send again
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    nativeButton={false}
                    className="flex-[1.4]"
                    render={<Link href={detailsHref} prefetch={false} />}
                >
                    View details
                </Button>
            </DealCardFooter>
        );
    }

    if (item.stage === "approved") {
        return (
            <DealCardFooter>
                <Button
                    size="md"
                    variant="outline"
                    type="button"
                    disabled={isBusy}
                    onClick={onAddBuyers}
                    className="flex-1 border-border-warm"
                >
                    <UserPlus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    {item.clientsAttached === 0 ? "Add buyer" : "See buyers"}
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    nativeButton={false}
                    className="flex-[1.4]"
                    render={<Link href={detailsHref} prefetch={false} />}
                >
                    View details
                </Button>
            </DealCardFooter>
        );
    }

    return (
        <DealCardFooter>
            <Button
                size="md"
                variant="outline"
                nativeButton={false}
                className="flex-1 border-border-warm"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Find similar
            </Button>
            <Button
                size="md"
                variant="accent"
                nativeButton={false}
                className="flex-[1.4]"
                render={<Link href={detailsHref} prefetch={false} />}
            >
                View details
            </Button>
        </DealCardFooter>
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

    return (
        <TooltipProvider>
            <DealCardShell view={view} isBusy={isBusy}>
                <DealCardPhoto listing={item} view={view} stageBadge={<StageBadge item={item} />} />

                <DealCardBody view={view}>
                    <div className="flex items-start gap-2">
                        <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                            <DealCardMeta listing={item} />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant="ghost"
                                        aria-label="More actions"
                                        className="mbs-0.5 self-start text-ink-muted"
                                    >
                                        <Ellipsis
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end" className="min-inline-44">
                                <DropdownMenuItem onClick={() => setIsTimelineOpen(true)}>
                                    What happened
                                </DropdownMenuItem>
                                {actions.canCancel ? (
                                    <DropdownMenuItem
                                        onClick={() => onWithdraw(item.id)}
                                        className="text-danger"
                                    >
                                        Cancel request
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                        <RequestCardFooter
                            item={item}
                            onNudge={onNudge}
                            onRetry={onRetry}
                            onAddBuyers={() => setIsBuyersOpen(true)}
                            isBusy={isBusy}
                        />
                    </div>
                </DealCardBody>
            </DealCardShell>

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
