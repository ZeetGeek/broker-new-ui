"use client";

import { useState } from "react";
import Link from "next/link";

import {
    Bell,
    ChevronDown,
    Eye,
    EyeOff,
    MapPin,
    Maximize2,
    MessageCircle,
    Timer,
    TriangleAlert,
    UserPlus,
    X,
} from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { isExpiringSoon, needsFollowUp } from "@/features/properties/my-requests/filter-requests";
import { expiryCountdown, reminderState } from "@/features/properties/my-requests/reminder-rules";
import { REQUEST_STAGE_META } from "@/features/properties/my-requests/request-stage-meta";
import { RequestTimeline } from "@/features/properties/my-requests/request-timeline";
import { REMINDER_LIMIT, type RequestItem } from "@/features/properties/my-requests/types";
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
        // The countdown badge already shows the time left, so this line says
        // what to do about it rather than repeating the number.
        if (isExpiringSoon(item)) {
            const reminders = reminderState(item);
            return {
                text: reminders.canRemind
                    ? "Closing soon. Send a reminder before it does."
                    : reminders.reason === "limit_reached"
                      ? "Closing soon. You have used all your reminders."
                      : `Closing soon. You can remind again in ${reminders.hoursUntilNext}h.`,
                tone: "urgent",
            };
        }
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
            return {
                text: "Your request was accepted. Add a buyer to get started.",
                tone: "urgent",
            };
        }
        return {
            text: `Request accepted. ${item.clientsAttached === 1 ? "1 buyer" : `${item.clientsAttached} buyers`} added so far.`,
            tone: "success",
        };
    }

    if (item.stage === "declined") {
        return {
            text: item.declineReason
                ? `Your request was rejected. Reason: ${item.declineReason.toLowerCase()}.`
                : "Your request was rejected by the owner.",
            tone: "muted",
        };
    }

    if (item.stage === "expired") {
        return {
            text: "Your request expired without a reply. You can send a new one.",
            tone: "muted",
        };
    }

    return { text: "You cancelled this request yourself.", tone: "muted" };
}

function RequestCardActions({
    item,
    onNudge,
    onWithdraw,
    isBusy,
}: {
    item: RequestItem;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    isBusy: boolean;
}) {
    if (item.stage === "pending") {
        const reminders = reminderState(item);
        const usedLabel = `${item.remindersSent} of ${REMINDER_LIMIT} reminders used`;

        const nudgeHint = reminders.canRemind
            ? `Send the owner a reminder. ${usedLabel}.`
            : reminders.reason === "limit_reached"
              ? `You have used all ${REMINDER_LIMIT} reminders on this request.`
              : `You reminded them recently. You can remind again in ${reminders.hoursUntilNext}h. ${usedLabel}.`;

        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!reminders.canRemind || isBusy}
                                    onClick={() => onNudge(item.id)}
                                    className="border-border-warm"
                                >
                                    <Bell
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    Remind owner
                                    <span className="tabular text-ink-muted">
                                        {item.remindersSent}/{REMINDER_LIMIT}
                                    </span>
                                </Button>
                            </span>
                        }
                    />
                    <TooltipContent>{nudgeHint}</TooltipContent>
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
                        Cancel this request. It frees up one of your weekly requests.
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    if (item.stage === "approved") {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                render={
                                    <Link href={`/broker/clients?property=${item.propertyId}`} />
                                }
                            >
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
                            ? "Add a buyer for this property so it shows up in your deals."
                            : "See the buyers you added for this property."}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-border-warm"
                                render={<Link href={brokerPropertyDetailHref(item.propertyId)} />}
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

    // Declined, expired and withdrawn all dead-end — send the broker back to
    // the pool rather than leaving them on a row they cannot act on.
    return (
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
    isBusy = false,
}: {
    item: RequestItem;
    view: RequestsView;
    onNudge: (id: string) => void;
    onWithdraw: (id: string) => void;
    isBusy?: boolean;
}) {
    const [showTimeline, setShowTimeline] = useState(false);

    const meta = REQUEST_STAGE_META[item.stage];
    const StageIcon = meta.icon;
    const status = statusLine(item);
    const countdown = expiryCountdown(item);
    const isList = view === "list";

    return (
        <TooltipProvider>
            <li
                className={cn(
                    `
                      group flex flex-col gap-4 rounded-card border border-border-warm bg-surface
                      p-4 transition-[box-shadow,border-color] duration-160
                      hover:border-ink/15 hover:shadow-md
                    `,
                    isBusy && "pointer-events-none opacity-60",
                )}
            >
                <div className={cn("flex gap-4", isList ? "flex-col sm:flex-row" : "flex-col")}>
                    <Link
                        href={brokerPropertyDetailHref(item.propertyId)}
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
                                    href={brokerPropertyDetailHref(item.propertyId)}
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

                            <div className="
                              flex shrink-0 flex-wrap items-center justify-end gap-1.5
                            ">
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

                                {countdown ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <Badge
                                                    variant={
                                                        countdown.isUrgent ? "urgent" : "outline"
                                                    }
                                                    className={cn(
                                                        !countdown.isUrgent && "bg-surface",
                                                    )}
                                                >
                                                    <Timer aria-hidden strokeWidth={2} />
                                                    {countdown.label}
                                                </Badge>
                                            }
                                        />
                                        <TooltipContent>
                                            {countdown.isExpired
                                                ? "This request has closed. Refresh to see its final status."
                                                : `If the owner does not reply, this request closes on its own in ${countdown.label.replace(" left", "")}.`}
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

                        <RequestOwnerBlock item={item} />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <RequestCardActions
                                item={item}
                                onNudge={onNudge}
                                onWithdraw={onWithdraw}
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
            </li>
        </TooltipProvider>
    );
}
