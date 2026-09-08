"use client";

import { CalendarClock, Clock3, Lock, MapPin, MoreHorizontal, PhoneCall } from "lucide-react";

import { formatDurationUntil, formatShowingWhen } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    VISIT_IMMINENT_MINUTES,
    type VisitItem,
    type VisitViewer,
} from "@/features/site-visits/types";
import { VISIT_OUTCOME_META, VISIT_STATUS_META } from "@/features/site-visits/visit-meta";
import {
    isAwaitingOther,
    isDestructiveAction,
    needsActionFrom,
    type VisitAction,
    visitActionLabel,
    visitActions,
} from "@/features/site-visits/visit-permissions";

export type VisitCardHandlers = {
    onAction: (visitId: string, action: VisitAction) => void;
    onOpen: (visitId: string) => void;
};

type VisitCardProps = {
    visit: VisitItem;
    viewer: VisitViewer;
    handlers: VisitCardHandlers;
    isBusy?: boolean;
    now: Date;
    className?: string;
};

/**
 * One visit, as a row.
 *
 * The same component serves both portals. What changes between them is the
 * counterparty shown (an owner sees the broker, a broker sees the owner and
 * the buyer) and the action set, which comes from `visitActions` rather than
 * from any role check written here.
 */
export function VisitCard({
    visit,
    viewer,
    handlers,
    isBusy = false,
    now,
    className,
}: VisitCardProps) {
    const meta = VISIT_STATUS_META[visit.status];
    const StatusIcon = meta.icon;
    const scheduled = new Date(visit.scheduledAt);
    const actions = visitActions(visit, viewer, now);
    const awaitingOther = isAwaitingOther(visit, viewer);
    const needsAction = needsActionFrom(visit, viewer);

    const until = formatDurationUntil(scheduled, now);
    /** Confirmed and close enough that the broker should be leaving. */
    const isImminent =
        visit.status === "confirmed" &&
        !until.isPast &&
        until.minutesRemaining <= VISIT_IMMINENT_MINUTES;

    // The counterparty: whoever the viewer is not.
    const counterparty = viewer === "broker" ? visit.owner : visit.broker;
    const counterpartyRole = viewer === "broker" ? "Owner" : "Broker";
    const canCall = Boolean(counterparty.phoneDigits);

    return (
        <article
            className={cn(
                `
                  flex flex-col gap-3 rounded-card border-s-2 bg-surface p-4 transition-shadow
                  duration-160
                  hover:shadow-md
                  sm:p-5
                `,
                meta.accentClass,
                isBusy && "pointer-events-none opacity-60",
                className,
            )}
            aria-busy={isBusy || undefined}
        >
            <div className="flex items-start gap-3">
                <PropertyThumb src={visit.property.imageSrc} alt={visit.property.title} />

                <div className="flex flex-1 flex-col gap-1 min-inline-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => handlers.onOpen(visit.id)}
                            className="
                              body text-start font-semibold text-ink transition-colors duration-160
                              hover:text-brand
                            "
                        >
                            {visit.property.configLabel} · {visit.property.propertyTypeLabel}
                        </button>

                        <Badge variant={meta.badgeVariant}>
                            <StatusIcon aria-hidden />
                            {meta.label}
                        </Badge>
                    </div>

                    <p className="body-sm flex items-center gap-1 text-ink-muted">
                        <MapPin aria-hidden className="block-3.5 inline-3.5" />
                        {visit.property.locality}, {visit.property.city}
                    </p>

                    <Price
                        amountInr={visit.property.amountInr}
                        isRent={visit.property.isRent}
                        className="body-sm font-semibold"
                    />
                </div>
            </div>

            {/* When. The single most important line on the card, so it gets its
                own inset strip rather than competing with the property meta. */}
            <div
                className={cn(
                    `
                      flex flex-wrap items-center gap-x-3 gap-y-1 rounded-inner bg-surface-muted
                      px-3 py-2
                    `,
                    isImminent && "bg-urgent-soft",
                )}
            >
                <p
                    className={cn(
                        "body-sm tabular flex items-center gap-1.5 font-semibold text-ink",
                        isImminent && "text-urgent",
                    )}
                >
                    <CalendarClock aria-hidden className="block-4 inline-4" />
                    {formatShowingWhen(scheduled, now)}
                </p>

                <p className="body-xs flex items-center gap-1 text-ink-muted">
                    <Clock3 aria-hidden className="block-3 inline-3" />
                    {visit.durationMin} min
                </p>

                {isImminent ? (
                    <p className="body-xs font-semibold text-urgent">{until.label}</p>
                ) : null}
            </div>

            {/* Who. Broker-side shows the buyer too — an owner never sees it. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-center gap-2">
                    <UserAvatar
                        size="sm"
                        name={counterparty.name}
                        imageUrl={counterparty.avatarUrl}
                    />
                    <span className="flex flex-col">
                        <span className="body-xs text-ink-subtle">{counterpartyRole}</span>
                        <span className="body-sm font-medium text-ink">{counterparty.name}</span>
                    </span>
                </span>

                {visit.buyer ? (
                    <span className="flex flex-col">
                        <span className="body-xs text-ink-subtle">Buyer</span>
                        <span className="body-sm font-medium text-ink">{visit.buyer.name}</span>
                    </span>
                ) : null}
            </div>

            {visit.meetingNote ? (
                <p className="body-sm text-pretty text-ink-muted">{visit.meetingNote}</p>
            ) : null}

            {visit.outcome ? (
                <Badge
                    variant={VISIT_OUTCOME_META[visit.outcome].badgeVariant}
                    className="self-start"
                >
                    {VISIT_OUTCOME_META[visit.outcome].label}
                </Badge>
            ) : null}

            {/* Waiting on the other side is a state, not an action. Saying so
                stops the user hunting for a button that should not exist. */}
            {awaitingOther ? (
                <p className="body-sm text-ink-muted">
                    Waiting for {viewer === "broker" ? "the owner" : "the broker"} to reply.
                </p>
            ) : null}

            {(actions.primary || actions.secondary.length > 0 || actions.overflow.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions.primary ? (
                        <Button
                            size="sm"
                            variant={needsAction ? "default" : "outline"}
                            onClick={() => handlers.onAction(visit.id, actions.primary!)}
                        >
                            {visitActionLabel(actions.primary, viewer)}
                        </Button>
                    ) : null}

                    {actions.secondary.map((action) => (
                        <Button
                            key={action}
                            size="sm"
                            variant="outline"
                            onClick={() => handlers.onAction(visit.id, action)}
                        >
                            {visitActionLabel(action, viewer)}
                        </Button>
                    ))}

                    {canCall ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            render={<a href={`tel:+91${counterparty.phoneDigits}`} />}
                        >
                            <PhoneCall aria-hidden />
                            Call
                        </Button>
                    ) : (
                        <span className="body-xs flex items-center gap-1 text-ink-subtle">
                            <Lock aria-hidden className="block-3 inline-3" />
                            Number hidden
                        </span>
                    )}

                    {actions.overflow.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        aria-label="More visit actions"
                                    >
                                        <MoreHorizontal aria-hidden />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent align="end">
                                {actions.overflow.map((action) => (
                                    <DropdownMenuItem
                                        key={action}
                                        variant={
                                            isDestructiveAction(action) ? "destructive" : undefined
                                        }
                                        onClick={() => handlers.onAction(visit.id, action)}
                                    >
                                        {visitActionLabel(action, viewer)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </div>
            )}

            {canCall ? (
                <PhoneNumber
                    phoneDigits={counterparty.phoneDigits!}
                    className="body-xs text-ink-subtle"
                />
            ) : null}
        </article>
    );
}
