"use client";

import { useState } from "react";
import Link from "next/link";

import {
    Bell,
    ChevronDown,
    Eye,
    EyeOff,
    Lock,
    MapPin,
    Maximize2,
    MessageCircle,
    Send,
    TriangleAlert,
    UserPlus,
    X,
} from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import { attemptActions, attemptLabel } from "@/features/properties/my-requests/attempt-rules";
import { needsFollowUp } from "@/features/properties/my-requests/filter-requests";
import { REQUEST_STAGE_META } from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import {
    ATTEMPT_LIMIT,
    REMINDER_LIMIT,
    type RequestItem,
} from "@/features/properties/my-requests/types";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

function dayLabel(days: number): string {
    return `${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * The one line that tells the broker what to do next, in the plainest words
 * that still say something true. Ordered by urgency — only the most pressing
 * signal shows, so the card never nags twice.
 */
function statusLine(item: RequestItem): { text: string; tone: "urgent" | "muted" | "success" } {
    if (item.stage === "pending") {
        if (!item.ownerSeen) {
            return {
                text: `The owner has not opened your request yet. Sent ${dayLabel(item.daysWaiting)} ago.`,
                tone: "muted",
            };
        }
        return {
            text: `The owner opened your request ${dayLabel(item.daysWaiting)} ago, but has not replied.`,
            tone: "muted",
        };
    }

    if (item.stage === "approved") {
        if (needsFollowUp(item)) {
            // The badge already says the request was accepted, so this line
            // spends its words on the next action instead of repeating it.
            return { text: "Add a buyer to get started.", tone: "urgent" };
        }
        // Accepted with buyers attached needs no sentence at all — the badge
        // and the avatar stack below already say everything true about it.
        return { text: "", tone: "success" };
    }

    if (item.stage === "declined") {
        const { attemptsLeft } = attemptActions(item);
        const reason = item.declineReason
            ? `Reason: ${item.declineReason.toLowerCase()}.`
            : "The owner gave no reason.";

        return {
            text:
                attemptsLeft > 0
                    ? `${reason} You have ${attemptsLeft} of ${ATTEMPT_LIMIT} attempts left.`
                    : `${reason} You have no attempts left.`,
            tone: "muted",
        };
    }

    if (item.stage === "locked") {
        return {
            text: "You have used all 3 attempts and the owner never replied. The owner can still contact you.",
            tone: "muted",
        };
    }

    const { attemptsLeft } = attemptActions(item);
    return {
        text:
            attemptsLeft > 0
                ? `You cancelled this attempt. ${attemptsLeft} of ${ATTEMPT_LIMIT} attempts left.`
                : "You cancelled your last attempt.",
        tone: "muted",
    };
}

function RequestCardActions({
    item,
    onNudge,
    onWithdraw,
    onRetry,
    onAddBuyers,
    isBusy,
}: {
    item: RequestItem;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    onRetry: (id: string) => void;
    onAddBuyers: () => void;
    isBusy: boolean;
}) {
    const actions = attemptActions(item);

    if (item.stage === "pending") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!actions.canRemind || isBusy}
                                    onClick={() => onNudge(item.id)}
                                    className="border-border-warm"
                                >
                                    <Bell
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {actions.canRemind
                                        ? actions.remindersUsed > 0
                                            ? `Remind again (${actions.remindersLeft} left)`
                                            : "Remind owner"
                                        : "Reminders used"}
                                </Button>
                            </span>
                        }
                    />
                    <TooltipContent>
                        {actions.canRemind
                            ? `Send the owner a reminder (${actions.remindersLeft} of ${REMINDER_LIMIT} left on this attempt).`
                            : `You already used both reminders for this attempt.`}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={isBusy}
                                onClick={() => onWithdraw(item.id)}
                                className="text-ink-muted hover:text-danger"
                            >
                                <X aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                                Cancel
                            </Button>
                        }
                    />
                    <TooltipContent>
                        {actions.attemptsLeft > 0
                            ? `Close this attempt. You will have ${actions.attemptsLeft} of ${ATTEMPT_LIMIT} attempts left.`
                            : "Close this attempt. It is your last one for this property."}
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    // Cancelled and rejected both end an attempt, so both offer the next one.
    if (actions.canRetry) {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => onRetry(item.id)}
                            className="border-border-warm"
                        >
                            <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Send request again
                        </Button>
                    }
                />
                <TooltipContent>
                    Start attempt {Math.min(item.attemptNumber + 1, ATTEMPT_LIMIT)} of{" "}
                    {ATTEMPT_LIMIT} for this property.
                </TooltipContent>
            </Tooltip>
        );
    }

    if (item.stage === "locked") {
        return (
            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Lock aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                No attempts left. The owner can still contact you.
            </p>
        );
    }

    if (item.stage === "approved") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button size="sm" disabled={isBusy} onClick={onAddBuyers}>
                                <UserPlus
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {item.clientsAttached === 0 ? "Add buyer" : "See buyers"}
                            </Button>
                        }
                    />
                    <TooltipContent>
                        {item.clientsAttached === 0
                            ? "Pick which buyers you will show this property to."
                            : "Change the buyers you added for this property."}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-border-warm"
                                render={
                                    <Link href={brokerOwnerListingDetailHref(item.propertyId)} />
                                }
                            >
                                View details
                            </Button>
                        }
                    />
                    <TooltipContent>See photos, price and full property details.</TooltipContent>
                </Tooltip>
            </div>
        );
    }

    // Rejected with no attempts left is a dead end — say so, then send the
    // broker back to the pool rather than stranding them on a row.
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-border-warm"
                            render={<Link href="/broker/owner-listings" />}
                        >
                            Find similar
                        </Button>
                    }
                />
                <TooltipContent>Find other properties you can send a request for.</TooltipContent>
            </Tooltip>

            {actions.attemptsLeft === 0 ? (
                <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                    <Lock
                        aria-hidden
                        className="shrink-0 block-3.5 inline-3.5"
                        strokeWidth={1.75}
                    />
                    No attempts left for this property.
                </p>
            ) : null}
        </div>
    );
}

/**
 * Who the broker is dealing with. Once the owner approves, their phone number
 * arrives from the API and this becomes a contact card — the whole point of
 * getting approved. Before approval there is no number to show.
 */
function RequestOwnerBlock({ item }: { item: RequestItem }) {
    const isApproved = item.stage === "approved";
    const phoneDigits = isApproved ? item.ownerPhoneDigits : undefined;
    const sentAgo = formatRelativePast(new Date(item.requestedAt), new Date());

    return (
        <div
            className={cn(
                "flex flex-wrap items-center justify-between gap-3",
                phoneDigits && "rounded-inner border border-border-warm bg-surface-muted/50 p-3",
            )}
        >
            <div className="flex items-center gap-2.5 min-inline-0">
                <UserAvatar name={item.ownerName} imageUrl={item.ownerAvatarUrl} size="sm" />

                <div className="min-inline-0">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "body-sm truncate",
                                phoneDigits ? "font-medium text-ink" : "text-ink-muted",
                            )}
                        >
                            {item.ownerName}
                        </span>

                        {item.stage === "pending" ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="flex items-center text-ink-muted">
                                            {item.ownerSeen ? (
                                                <Eye
                                                    aria-hidden
                                                    className="block-3.5 inline-3.5"
                                                    strokeWidth={1.75}
                                                />
                                            ) : (
                                                <EyeOff
                                                    aria-hidden
                                                    className="block-3.5 inline-3.5"
                                                    strokeWidth={1.75}
                                                />
                                            )}
                                        </span>
                                    }
                                />
                                <TooltipContent>
                                    {item.ownerSeen
                                        ? "The owner has opened your request."
                                        : "The owner has not opened your request yet."}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>

                    {phoneDigits ? (
                        <PhoneNumber phoneDigits={phoneDigits} className="body-xs text-ink-muted" />
                    ) : (
                        <span className="body-xs text-ink-muted">Owner</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {phoneDigits ? (
                    <>
                        <ChatButton
                            peer={{
                                id: item.id,
                                name: item.ownerName,
                                avatarUrl: item.ownerAvatarUrl,
                                roleLabel: "Owner",
                                isOnline: true,
                            }}
                        />

                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        className="shrink-0 border-border-warm text-brand"
                                        render={
                                            <a
                                                href={formatWhatsAppUrl(phoneDigits)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Message ${item.ownerName} on WhatsApp`}
                                            />
                                        }
                                    >
                                        <MessageCircle aria-hidden strokeWidth={1.75} />
                                    </Button>
                                }
                            />
                            <TooltipContent>Message {item.ownerName} on WhatsApp.</TooltipContent>
                        </Tooltip>
                    </>
                ) : null}

                <Tooltip>
                    <TooltipTrigger
                        render={<span className="body-xs text-ink-muted">Sent {sentAgo}</span>}
                    />
                    <TooltipContent>You sent this request {sentAgo}.</TooltipContent>
                </Tooltip>
            </div>
        </div>
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
    const [showTimeline, setShowTimeline] = useState(false);
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);

    const meta = REQUEST_STAGE_META[item.stage];
    const StageIcon = meta.icon;
    const status = statusLine(item);
    // Attempt count only matters while the broker still has moves to make —
    // and only once it is not the first try. "Attempt 1 of 3" on every fresh
    // request was noise on a card that already carries a stage badge.
    const showAttempts =
        item.attemptNumber > 1 &&
        (item.stage === "pending" || item.stage === "cancelled" || item.stage === "declined");
    const isList = view === "list";

    return (
        <TooltipProvider>
            <li
                className={cn(
                    `
                      group flex flex-col gap-4 rounded-card border border-border-warm bg-surface
                      p-5 transition-[box-shadow,border-color] duration-160
                      hover:border-ink/15 hover:shadow-md
                    `,
                    isBusy && "pointer-events-none opacity-60",
                )}
            >
                <div className={cn("flex gap-4", isList ? "flex-col sm:flex-row" : "flex-col")}>
                    <Link
                        href={brokerOwnerListingDetailHref(item.propertyId)}
                        className={cn(
                            `
                              relative shrink-0 overflow-hidden rounded-inner bg-surface-muted
                              focus-visible:ring-2 focus-visible:ring-ring/40
                              focus-visible:outline-none
                            `,
                            isList
                                ? "aspect-4/3 inline-full sm:inline-44 md:inline-52"
                                : `aspect-4/3 inline-full`,
                        )}
                    >
                        <AppImage
                            src={item.imageSrc}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, 13rem"
                            className="object-cover"
                        />
                    </Link>

                    <div className="flex flex-1 flex-col gap-3 min-inline-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-inline-0">
                                <Link
                                    href={brokerOwnerListingDetailHref(item.propertyId)}
                                    className="
                                      body font-semibold text-ink transition-colors duration-160
                                      hover:text-brand
                                      focus-visible:underline focus-visible:outline-none
                                    "
                                >
                                    {item.title}
                                </Link>
                                <p className="body-sm flex items-center gap-1 text-ink-muted">
                                    <MapPin
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={1.75}
                                    />
                                    {item.locality}, {item.city}
                                </p>
                            </div>

                            <div
                                className="
                              flex shrink-0 flex-wrap items-center justify-end gap-1.5
                            "
                            >
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Badge variant={meta.badgeVariant}>
                                                <StageIcon aria-hidden strokeWidth={2} />
                                                {meta.label}
                                            </Badge>
                                        }
                                    />
                                    <TooltipContent>{meta.hint}</TooltipContent>
                                </Tooltip>

                                {showAttempts ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Badge variant="outline" className="bg-surface">
                                                    {attemptLabel(item)}
                                                </Badge>
                                            }
                                        />
                                        <TooltipContent>
                                            You get {ATTEMPT_LIMIT} attempts per property. Each
                                            attempt is one request plus up to {REMINDER_LIMIT}{" "}
                                            reminders.
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Price
                                amountInr={item.amountInr}
                                isRent={item.isRent}
                                className="body font-semibold"
                            />
                            <span aria-hidden className="text-border-warm">
                                ·
                            </span>
                            <span className="body-sm flex items-center gap-1 text-ink-muted">
                                <Maximize2
                                    aria-hidden
                                    className="block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                {formatAreaSqft(item.areaSqft)}
                            </span>
                            {item.commissionPercent > 0 ? (
                                <>
                                    <span aria-hidden className="text-border-warm">
                                        ·
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="body-sm tabular text-ink-muted">
                                                    {item.commissionPercent}% commission
                                                </span>
                                            }
                                        />
                                        <TooltipContent>
                                            What you earn if this property sells.
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            ) : null}
                        </div>

                        {status.text ? (
                            <p
                                className={cn(
                                    "body-sm flex items-center gap-1.5",
                                    status.tone === "urgent" && "font-medium text-urgent",
                                    status.tone === "success" && "text-success",
                                    status.tone === "muted" && "text-ink-muted",
                                )}
                            >
                                {status.tone === "urgent" ? (
                                    <TriangleAlert
                                        aria-hidden
                                        className="shrink-0 block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                ) : null}
                                {status.text}
                            </p>
                        ) : null}

                        {item.attachedClients.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <AvatarStack people={item.attachedClients} />
                                <button
                                    type="button"
                                    onClick={() => setIsBuyersOpen(true)}
                                    className="
                                      body-xs font-medium text-ink-muted transition-colors
                                      duration-160
                                      hover:text-ink
                                      focus-visible:underline focus-visible:outline-none
                                    "
                                >
                                    {item.attachedClients.length === 1
                                        ? "1 buyer added"
                                        : `${item.attachedClients.length} buyers added`}
                                </button>

                                {item.attachedClients.length === 1 ? (
                                    <ChatButton
                                        size="icon-xs"
                                        peer={{
                                            id: `client-${item.attachedClients[0].id}`,
                                            name: item.attachedClients[0].name,
                                            avatarUrl: item.attachedClients[0].avatarUrl,
                                            roleLabel: "Buyer",
                                        }}
                                    />
                                ) : null}
                            </div>
                        ) : null}

                        <RequestOwnerBlock item={item} />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <RequestCardActions
                                item={item}
                                onNudge={onNudge}
                                onWithdraw={onWithdraw}
                                onRetry={onRetry}
                                onAddBuyers={() => setIsBuyersOpen(true)}
                                isBusy={isBusy}
                            />

                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            onClick={() => setShowTimeline((prev) => !prev)}
                                            aria-expanded={showTimeline}
                                            className="
                                              body-xs flex items-center gap-1 font-medium
                                              text-ink-muted transition-colors duration-160
                                              hover:text-ink
                                              focus-visible:underline focus-visible:outline-none
                                            "
                                        >
                                            {showTimeline ? "Hide steps" : "What happened"}
                                            <ChevronDown
                                                aria-hidden
                                                className={cn(
                                                    `
                                                      transition-transform duration-160 block-3.5
                                                      inline-3.5
                                                    `,
                                                    showTimeline && "rotate-180",
                                                )}
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    }
                                />
                                <TooltipContent>
                                    See every step, from when you sent this request until now.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {showTimeline ? <RequestTimeline steps={item.timeline} /> : null}

                {item.stage === "approved" ? (
                    <AttachBuyersModal
                        open={isBuyersOpen}
                        onOpenChange={setIsBuyersOpen}
                        request={item}
                        onSaved={onBuyersChanged}
                    />
                ) : null}
            </li>
        </TooltipProvider>
    );
}
