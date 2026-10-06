"use client";

import Link from "next/link";

import { Check, X } from "lucide-react";

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
import type { OwnerRequestCardItem } from "@/features/owner-requests/types";
import {
    DealCardPhotoToolbar,
    DealOverlayCard,
    DealOverlayFooter,
    dealSecondaryButtonClass,
} from "@/features/properties/my-requests/deal-card-chrome";

type CardActions = "respond" | "withdraw" | "none";

function stageMetaFor(item: OwnerRequestCardItem, actions: CardActions) {
    if (actions === "withdraw" && item.status === "pending") {
        return OWNER_INVITE_PENDING_META;
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
        closed:
            item.status === "rejected" || item.status === "withdrawn" || item.status === "revoked",
    };
}

function BrokerOverlayStats({ item }: { item: OwnerRequestCardItem }) {
    const phoneHint = item.brokerPhoneDigits ? (
        <PhoneNumber phoneDigits={item.brokerPhoneDigits} className="text-inherit" />
    ) : undefined;

    return (
        <div className="flex flex-col gap-1 min-inline-0">
            <OverlayPersonLine label="Broker" name={item.brokerName} hint={phoneHint} />
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
            className="flex-[1.4]"
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
                    className={cn("flex-1", secondaryClass)}
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Decline
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    disabled={isBusy}
                    onClick={onAccept}
                    className="flex-[1.4]"
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
                    className={cn("flex-1", secondaryClass)}
                >
                    Withdraw
                </Button>
                {viewDetails}
            </DealOverlayFooter>
        );
    }

    return <DealOverlayFooter>{viewDetails}</DealOverlayFooter>;
}

export function OwnerRequestCard({
    item,
    actions,
    onAccept,
    onReject,
    onWithdraw,
    isBusy = false,
}: {
    item: OwnerRequestCardItem;
    actions: CardActions;
    onAccept?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
    isBusy?: boolean;
}) {
    const meta = stageMetaFor(item, actions);
    const detailHref = ownerRequestDetailHref(item.propertyId);
    const muted =
        item.status === "rejected" || item.status === "withdrawn" || item.status === "revoked";
    const { openChat } = useChat();

    const cardMenu = (
        <DealCardPhotoToolbar
            listing={item}
            contact={{
                name: item.brokerName,
                phoneDigits: item.brokerPhoneDigits,
                onMessage: () => openChat(chatPeerFor(item)),
            }}
        />
    );

    return (
        <TooltipProvider>
            <DealOverlayCard
                listing={item}
                configLabel={item.configLabel}
                statusLabel={meta.label}
                statusTone={meta.tone}
                muted={muted}
                isBusy={isBusy}
                detailHref={detailHref}
                actions={cardMenu}
            >
                {item.message ? (
                    <p className="body-sm line-clamp-2 tracking-wide text-ink-muted italic">
                        “{item.message}”
                    </p>
                ) : null}
                <BrokerOverlayStats item={item} />
                <CardFooter
                    item={item}
                    actions={actions}
                    onAccept={onAccept}
                    onReject={onReject}
                    onWithdraw={onWithdraw}
                    isBusy={isBusy}
                />
            </DealOverlayCard>
        </TooltipProvider>
    );
}
