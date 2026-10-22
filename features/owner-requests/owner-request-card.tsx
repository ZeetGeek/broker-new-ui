"use client";

import { useState } from "react";
import Link from "next/link";

import { Check, X } from "@/components/shared/icons";

import { cn } from "@/lib/utils";

import { OverlayPersonLine } from "@/components/shared/overlay-card";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useChat } from "@/features/chat/chat-provider";
import type { ChatPeer } from "@/features/chat/types";
import { ownerRequestDetailHref } from "@/features/owner-requests/map-owner-request";
import {
    OWNER_INVITE_PENDING_META,
    OWNER_REQUEST_STAGE_META,
} from "@/features/owner-requests/owner-request-stage-meta";
import {
    CLOSED_OWNER_REP_STATUSES,
    type OwnerRequestCardItem,
} from "@/features/owner-requests/types";
import { CancelledNote } from "@/features/properties/my-requests/cancelled-note";
import {
    DealCardPhotoToolbar,
    DealOverlayCard,
    DealOverlayFooter,
    dealSecondaryButtonClass,
} from "@/features/properties/my-requests/deal-card-chrome";
import { CancelRepresentationDialog } from "@/features/representation/cancel-representation-dialog";

type CardActions = "respond" | "withdraw" | "none";

function stageMetaFor(item: OwnerRequestCardItem, actions: CardActions) {
    if (actions === "withdraw" && item.status === "pending") {
        return OWNER_INVITE_PENDING_META;
    }
    // A rejected invitation was turned down by the broker, not by you.
    if (item.status === "rejected" && item.initiatedBy === "owner") {
        return { ...OWNER_REQUEST_STAGE_META.rejected, label: "Broker said no" };
    }
    return OWNER_REQUEST_STAGE_META[item.status];
}

function chatPeerFor(item: OwnerRequestCardItem): ChatPeer {
    return {
        id: item.id,
        name: item.brokerName,
        avatarUrl: item.brokerAvatarUrl,
        roleLabel: item.title,
        isOnline: item.status === "accepted",
        representationId: item.id,
        mySide: "owner",
        canSend: true,
        closed: CLOSED_OWNER_REP_STATUSES.includes(item.status),
    };
}

function BrokerOverlayStats({ item }: { item: OwnerRequestCardItem }) {
    const phoneHint = item.brokerPhoneDigits ? (
        <PhoneNumber phoneDigits={item.brokerPhoneDigits} className="text-inherit" />
    ) : undefined;

    return (
        <div className="flex flex-col gap-1.5 min-inline-0">
            <OverlayPersonLine
                label="Broker"
                name={item.brokerName}
                avatarUrl={item.brokerAvatarUrl}
                hint={phoneHint}
            />
            {item.commissionPercent > 0 ? (
                <p className="body-sm tracking-wide text-ink-muted tabular-nums">
                    {item.commissionPercent}% commission
                </p>
            ) : null}
        </div>
    );
}

function CardFooter({
    item,
    actions,
    onAccept,
    onReject,
    onWithdraw,
    isBusy,
}: {
    item: OwnerRequestCardItem;
    actions: CardActions;
    onAccept?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
    isBusy: boolean;
}) {
    const detailsHref = ownerRequestDetailHref(item.propertyId);
    const secondaryClass = dealSecondaryButtonClass();

    const viewDetails = (
        <Button
            size="md"
            variant="accent"
            nativeButton={false}
            className="flex-1 min-inline-0"
            render={<Link href={detailsHref} prefetch={false} />}
        >
            View property
        </Button>
    );

    if (actions === "respond") {
        return (
            <DealOverlayFooter>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={onReject}
                    className={cn("flex-1 min-inline-0", secondaryClass)}
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Cancel
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={onAccept}
                    className="flex-1 min-inline-0"
                >
                    <Check aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    Accept
                </Button>
            </DealOverlayFooter>
        );
    }

    if (actions === "withdraw") {
        return (
            <DealOverlayFooter>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={onWithdraw}
                    className={cn("flex-1 min-inline-0", secondaryClass)}
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    Cancel request
                </Button>
                {viewDetails}
            </DealOverlayFooter>
        );
    }

    return (
        <DealOverlayFooter>
            <Button
                size="md"
                variant="accent"
                nativeButton={false}
                className="inline-full"
                render={<Link href={detailsHref} prefetch={false} />}
            >
                View property
            </Button>
        </DealOverlayFooter>
    );
}

export function OwnerRequestCard({
    item,
    actions,
    onAccept,
    onReject,
    onWithdraw,
    onRemoved,
    isBusy = false,
}: {
    item: OwnerRequestCardItem;
    actions: CardActions;
    onAccept?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
    /** Accepted cards: offer "Remove broker"; called after it succeeds. */
    onRemoved?: () => void;
    isBusy?: boolean;
}) {
    const meta = stageMetaFor(item, actions);
    const detailHref = ownerRequestDetailHref(item.propertyId);
    const muted = CLOSED_OWNER_REP_STATUSES.includes(item.status);
    const { openChat } = useChat();
    const [isRemoveOpen, setIsRemoveOpen] = useState(false);
    const canRemove = Boolean(onRemoved) && item.status === "accepted";
    const isCancelled = item.status === "owner_cancelled" || item.status === "broker_cancelled";

    const cardMenu = (
        <DealCardPhotoToolbar
            listing={item}
            contact={{
                name: item.brokerName,
                phoneDigits: item.brokerPhoneDigits,
                onMessage: () => openChat(chatPeerFor(item)),
            }}
            onStopRepresenting={canRemove ? () => setIsRemoveOpen(true) : undefined}
            stopRepresentingLabel="Remove broker"
        />
    );

    return (
        <TooltipProvider>
            <DealOverlayCard
                listing={item}
                audience="owner"
                configLabel={item.configLabel}
                statusLabel={meta.label}
                statusTone={meta.tone}
                muted={muted}
                isBusy={isBusy}
                detailHref={detailHref}
                actions={cardMenu}
            >
                <BrokerOverlayStats item={item} />
                {isCancelled ? (
                    <CancelledNote
                        viewer="owner"
                        endedBy={item.status === "owner_cancelled" ? "owner" : "broker"}
                        reason={item.cancelReason}
                    />
                ) : null}
                <CardFooter
                    item={item}
                    actions={actions}
                    onAccept={onAccept}
                    onReject={onReject}
                    onWithdraw={onWithdraw}
                    isBusy={isBusy}
                />
            </DealOverlayCard>

            {canRemove ? (
                <CancelRepresentationDialog
                    open={isRemoveOpen}
                    onOpenChange={setIsRemoveOpen}
                    representationId={item.id}
                    side="owner"
                    propertyTitle={item.title}
                    counterpartName={item.brokerName}
                    onCancelled={onRemoved}
                />
            ) : null}
        </TooltipProvider>
    );
}
