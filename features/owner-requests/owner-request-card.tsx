"use client";

import Link from "next/link";

import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    OverlayStat,
    OverlayStatsRow,
} from "@/components/shared/overlay-card";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import type { ChatPeer } from "@/features/chat/types";
import { ownerRequestDetailHref } from "@/features/owner-requests/map-owner-request";
import {
    OWNER_INVITE_PENDING_META,
    OWNER_REQUEST_STAGE_META,
} from "@/features/owner-requests/owner-request-stage-meta";
import type { OwnerRequestCardItem } from "@/features/owner-requests/types";
import type { OwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    DealCardBody,
    DealCardFooter,
    DealCardMeta,
    DealCardPhoto,
    DealCardPrice,
    DealCardShell,
    DealOverlayCard,
    DealOverlayFooter,
    dealSecondaryButtonClass,
    DealWhatsAppButton,
} from "@/features/properties/my-requests/deal-card-chrome";

type CardTone = "light" | "overlay";
type CardActions = "respond" | "withdraw" | "none";

function stageMetaFor(item: OwnerRequestCardItem, actions: CardActions) {
    if (actions === "withdraw" && item.status === "pending") {
        return OWNER_INVITE_PENDING_META;
    }
    return OWNER_REQUEST_STAGE_META[item.status];
}

function StageBadge({
    item,
    actions,
}: {
    item: OwnerRequestCardItem;
    actions: CardActions;
}) {
    const meta = stageMetaFor(item, actions);

    return (
        <Badge
            className={cn(
                "body-xs border-0 font-semibold shadow-xs",
                item.status === "accepted" && "bg-brand-soft text-brand-text",
                item.status === "pending" &&
                    actions === "respond" &&
                    "bg-urgent-soft text-urgent",
                item.status === "pending" &&
                    actions !== "respond" &&
                    "bg-surface/95 text-ink-muted",
                item.status === "rejected" && "bg-danger-soft text-danger",
                (item.status === "withdrawn" ||
                    item.status === "revoked" ||
                    item.status === "unknown") &&
                    "bg-surface/95 text-ink-muted",
            )}
        >
            {meta.label}
        </Badge>
    );
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
            item.status === "rejected" ||
            item.status === "withdrawn" ||
            item.status === "revoked",
    };
}

function BrokerRow({ item }: { item: OwnerRequestCardItem }) {
    const phoneDigits = item.brokerPhoneDigits;

    return (
        <div className="flex items-center gap-2 py-1.5 min-inline-0">
            <UserAvatar
                name={item.brokerName}
                imageUrl={item.brokerAvatarUrl}
                size="sm"
                className="shrink-0"
            />
            <div className="flex flex-1 flex-col min-inline-0">
                <p className="body-sm truncate font-medium tracking-wide text-ink capitalize">
                    {item.brokerName}
                </p>
                {phoneDigits ? (
                    <PhoneNumber phoneDigits={phoneDigits} className="body-xs text-ink-muted" />
                ) : (
                    <p className="body-xs text-ink-muted">
                        {item.brokerOrgName?.trim() || "Broker"}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
                <ChatButton peer={chatPeerFor(item)} />
                {phoneDigits ? (
                    <DealWhatsAppButton name={item.brokerName} phoneDigits={phoneDigits} />
                ) : null}
            </div>
        </div>
    );
}

function BrokerOverlayStats({ item }: { item: OwnerRequestCardItem }) {
    return (
        <OverlayStatsRow>
            {item.commissionPercent > 0 ? (
                <OverlayStat label="Commission">{item.commissionPercent}%</OverlayStat>
            ) : null}
            <OverlayStat
                label="Broker"
                hint={
                    item.brokerPhoneDigits ? (
                        <PhoneNumber
                            phoneDigits={item.brokerPhoneDigits}
                            className="text-inherit"
                        />
                    ) : undefined
                }
            >
                <span className="capitalize">{item.brokerName}</span>
            </OverlayStat>
        </OverlayStatsRow>
    );
}

function CardFooter({
    item,
    tone,
    actions,
    onAccept,
    onReject,
    onWithdraw,
    isBusy,
}: {
    item: OwnerRequestCardItem;
    tone: CardTone;
    actions: CardActions;
    onAccept?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
    isBusy: boolean;
}) {
    const detailsHref = ownerRequestDetailHref(item.propertyId);
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
            View property
        </Button>
    );

    if (actions === "respond") {
        return (
            <Footer>
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
            </Footer>
        );
    }

    if (actions === "withdraw") {
        return (
            <Footer>
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
            </Footer>
        );
    }

    return <Footer>{viewDetails}</Footer>;
}

export function OwnerRequestCard({
    item,
    view,
    actions,
    onAccept,
    onReject,
    onWithdraw,
    isBusy = false,
}: {
    item: OwnerRequestCardItem;
    view: OwnerRequestsView;
    actions: CardActions;
    onAccept?: () => void;
    onReject?: () => void;
    onWithdraw?: () => void;
    isBusy?: boolean;
}) {
    const meta = stageMetaFor(item, actions);
    const detailHref = ownerRequestDetailHref(item.propertyId);
    const muted =
        item.status === "rejected" ||
        item.status === "withdrawn" ||
        item.status === "revoked";

    const footer = (tone: CardTone) => (
        <CardFooter
            item={item}
            tone={tone}
            actions={actions}
            onAccept={onAccept}
            onReject={onReject}
            onWithdraw={onWithdraw}
            isBusy={isBusy}
        />
    );

    const card =
        view === "list" ? (
            <DealCardShell view={view} isBusy={isBusy}>
                <DealCardPhoto
                    listing={item}
                    view={view}
                    detailHref={detailHref}
                    stageBadge={<StageBadge item={item} actions={actions} />}
                />
                <DealCardBody view={view}>
                    <DealCardMeta listing={item} detailHref={detailHref} />
                    {item.message ? (
                        <p className="body-sm line-clamp-2 text-ink-muted">“{item.message}”</p>
                    ) : null}
                    <BrokerRow item={item} />
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
                statusLabel={meta.label}
                statusTone={meta.tone}
                muted={muted}
                isBusy={isBusy}
                detailHref={detailHref}
                actions={
                    <>
                        <ChatButton peer={chatPeerFor(item)} appearance="overlay" />
                        {item.brokerPhoneDigits ? (
                            <DealWhatsAppButton
                                name={item.brokerName}
                                phoneDigits={item.brokerPhoneDigits}
                                appearance="overlay"
                            />
                        ) : null}
                    </>
                }
            >
                {item.message ? (
                    <p className="body-sm line-clamp-2 tracking-wide text-surface/85 italic">
                        “{item.message}”
                    </p>
                ) : null}
                <BrokerOverlayStats item={item} />
                {footer("overlay")}
            </DealOverlayCard>
        );

    return <TooltipProvider>{card}</TooltipProvider>;
}
