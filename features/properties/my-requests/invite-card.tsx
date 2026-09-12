"use client";

import { useState } from "react";
import Link from "next/link";

import { Check, UserPlus, X } from "lucide-react";

import { BROKER_OWNER_LISTINGS_HREF, brokerOwnerListingDetailHref } from "@/lib/routes/broker";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import {
    DealCardBody,
    DealCardFooter,
    DealCardMeta,
    DealCardPhoto,
    DealCardPrice,
    DealCardShell,
    DealWhatsAppButton,
} from "@/features/properties/my-requests/deal-card-chrome";
import { INVITE_STAGE_META } from "@/features/properties/my-requests/invite-stage-meta";
import type { InviteItem } from "@/features/properties/my-requests/invite-types";
import type { RequestItem } from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

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

function InviteOwnerRow({ item }: { item: InviteItem }) {
    const phoneDigits = item.stage === "accepted" ? item.ownerPhoneDigits : undefined;

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
                        isOnline: item.stage === "accepted",
                        representationId: item.id,
                        mySide: "broker",
                        canSend: true,
                        closed: item.stage === "declined" || item.stage === "expired",
                    }}
                />
                {phoneDigits ? (
                    <DealWhatsAppButton name={item.ownerName} phoneDigits={phoneDigits} />
                ) : null}
            </div>
        </div>
    );
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
    const detailsHref = brokerOwnerListingDetailHref(item.propertyId);

    if (item.stage === "pending") {
        return (
            <DealCardFooter>
                <Button
                    size="md"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onDecline(item.id)}
                    className="flex-1 border-border-warm"
                >
                    <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
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
                    Accept
                </Button>
            </DealCardFooter>
        );
    }

    if (item.stage === "accepted") {
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

    return (
        <TooltipProvider>
            <DealCardShell view={view} isBusy={isBusy}>
                <DealCardPhoto listing={item} view={view} stageBadge={<StageBadge item={item} />} />

                <DealCardBody view={view}>
                    <DealCardMeta listing={item} />
                    {item.message ? (
                        <p className="body-sm line-clamp-2 text-ink-muted">“{item.message}”</p>
                    ) : null}
                    <InviteOwnerRow item={item} />
                    <div className="mbs-auto flex flex-col gap-2.5">
                        <DealCardPrice listing={item} />
                        <InviteCardFooter
                            item={item}
                            onAccept={onAccept}
                            onDecline={onDecline}
                            onAddBuyers={() => setIsBuyersOpen(true)}
                            isBusy={isBusy}
                        />
                    </div>
                </DealCardBody>
            </DealCardShell>

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
