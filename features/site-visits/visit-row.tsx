"use client";

import type { ReactNode } from "react";

import { Clock3, Lock, MapPin, MoreHorizontal, PhoneCall, StickyNote } from "lucide-react";

import { formatDurationUntil, formatTimeIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    VISIT_IMMINENT_MINUTES,
    type VisitItem,
    type VisitViewer,
} from "@/features/site-visits/types";
import {
    VISIT_CANCEL_REASON_LABEL,
    VISIT_OUTCOME_META,
    VISIT_STATUS_HINT,
    VISIT_STATUS_META,
} from "@/features/site-visits/visit-meta";
import {
    isAwaitingOther,
    isDestructiveAction,
    needsActionFrom,
    type VisitAction,
    visitActionLabel,
    visitActions,
} from "@/features/site-visits/visit-permissions";

export type VisitRowHandlers = {
    onAction: (visitId: string, action: VisitAction) => void;
    onOpen: (visitId: string) => void;
};

type VisitRowProps = {
    visit: VisitItem;
    viewer: VisitViewer;
    handlers: VisitRowHandlers;
    isBusy?: boolean;
    now: Date;
    className?: string;
};

/**
 * Wraps anything in a tooltip. Every abbreviation and bare icon in this row
 * goes through it — "45m" and a padlock glyph are only obvious to whoever
 * wrote them, and this product's users are non-technical.
 */
function Hint({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

/**
 * One visit, as a task-list row.
 *
 * Laid out the way a to-do list is: the time leads in a fixed gutter so a
 * column of rows reads as a schedule, then what and where, then the people.
 *
 * Everything abbreviated for space carries a tooltip saying it in full, and
 * every value carries a word saying what it is — a bare "₹42 L" next to a
 * bare "30m" asks the reader to guess which is the rent and which is the
 * duration. The same component serves both portals; what changes is the
 * counterparty shown and the action set, both from `visitActions`.
 */
export function VisitRow({
    visit,
    viewer,
    handlers,
    isBusy = false,
    now,
    className,
}: VisitRowProps) {
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

    const endsAt = new Date(scheduled.getTime() + visit.durationMin * 60_000);
    const timeRangeLabel = `${formatTimeIn(scheduled)} to ${formatTimeIn(endsAt)}`;

    return (
        <article
            className={cn(
                `
                  group/row relative flex gap-3 border-be border-border-warm bg-surface px-3 py-3.5
                  transition-colors duration-160
                  hover:bg-surface-muted/50
                  sm:gap-4 sm:px-4
                `,
                // Waiting on this viewer: a tinted ground, so the rows that
                // need a decision are findable without reading every badge.
                needsAction && "bg-urgent-soft/40 hover:bg-urgent-soft/60",
                isBusy && "pointer-events-none opacity-60",
                className,
            )}
            aria-busy={isBusy || undefined}
        >
            {/* Time gutter. Fixed width so every row in a day lines up and the
                column reads as a schedule rather than as prose. */}
            <div className="flex shrink-0 flex-col items-start gap-1 inline-20 sm:inline-24">
                <Hint label={`Starts at ${formatTimeIn(scheduled)}`}>
                    <span
                        className={cn(
                            "body-sm tabular font-semibold text-ink",
                            isImminent && "text-urgent",
                        )}
                    >
                        {formatTimeIn(scheduled)}
                    </span>
                </Hint>

                <Hint label={`Lasts about ${visit.durationMin} minutes · ${timeRangeLabel}`}>
                    <span className="body-xs flex items-center gap-1 text-ink-subtle">
                        <Clock3 aria-hidden className="block-3 inline-3" />
                        {visit.durationMin} min
                    </span>
                </Hint>

                {isImminent ? (
                    <Hint label="This visit starts soon — time to leave">
                        <span className="body-xs font-semibold text-urgent">{until.label}</span>
                    </Hint>
                ) : null}
            </div>

            {/* Status rail. A thin bar rather than a tinted row — a whole row
                going coloured would fight the next one for attention. */}
            <span
                aria-hidden
                className={cn("shrink-0 self-stretch rounded-full inline-0.5", meta.dotClass)}
            />

            <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <Hint label="Open this visit for the full details and history">
                        <button
                            type="button"
                            onClick={() => handlers.onOpen(visit.id)}
                            className="
                              body text-start font-semibold text-ink underline-offset-4
                              transition-colors duration-160
                              hover:text-brand hover:underline
                            "
                        >
                            {visit.property.configLabel} · {visit.property.propertyTypeLabel}
                        </button>
                    </Hint>

                    {/* The badge word is short by necessity; the tooltip is
                        where it says what it actually means for this viewer. */}
                    <Hint label={VISIT_STATUS_HINT[visit.status][viewer]}>
                        <Badge variant={meta.badgeVariant}>
                            <StatusIcon aria-hidden />
                            {meta.label}
                        </Badge>
                    </Hint>
                </div>

                <div className="body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
                    <Hint label={`${visit.property.locality}, ${visit.property.city}`}>
                        <span className="flex items-center gap-1">
                            <MapPin aria-hidden className="block-3.5 inline-3.5" />
                            {visit.property.locality}, {visit.property.city}
                        </span>
                    </Hint>

                    <span aria-hidden className="text-ink-subtle">
                        ·
                    </span>

                    {/* Naming the number stops "₹42 L" reading as a fee or a
                        budget. Rent and sale prices look identical otherwise. */}
                    <Hint
                        label={
                            visit.property.isRent
                                ? "Monthly rent the owner is asking"
                                : "Asking price for this property"
                        }
                    >
                        <span className="flex items-center gap-1">
                            <span className="text-ink-subtle">
                                {visit.property.isRent ? "Rent" : "Asking"}
                            </span>
                            <Price
                                amountInr={visit.property.amountInr}
                                isRent={visit.property.isRent}
                                className="font-semibold"
                            />
                        </span>
                    </Hint>
                </div>

                <div className="body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted">
                    <Hint
                        label={
                            viewer === "broker"
                                ? "The owner of this property"
                                : "The broker bringing a buyer"
                        }
                    >
                        <span>
                            <span className="text-ink-subtle">{counterpartyRole}</span>{" "}
                            <span className="font-medium text-ink">{counterparty.name}</span>
                        </span>
                    </Hint>

                    {visit.buyer ? (
                        <>
                            <span aria-hidden className="text-ink-subtle">
                                ·
                            </span>
                            <Hint label="Your buyer being shown this property">
                                <span>
                                    <span className="text-ink-subtle">Buyer</span>{" "}
                                    <span className="font-medium text-ink">{visit.buyer.name}</span>
                                </span>
                            </Hint>
                        </>
                    ) : null}

                    {!canCall ? (
                        <>
                            <span aria-hidden className="text-ink-subtle">
                                ·
                            </span>
                            <Hint
                                label={
                                    viewer === "broker"
                                        ? "You can only call the owner while you represent this property"
                                        : "This number is not shared"
                                }
                            >
                                <span className="body-xs flex items-center gap-1 text-ink-subtle">
                                    <Lock aria-hidden className="block-3 inline-3" />
                                    Number hidden
                                </span>
                            </Hint>
                        </>
                    ) : null}
                </div>

                {visit.meetingNote ? (
                    <Hint label={visit.meetingNote}>
                        <span
                            className="
                              body-sm flex items-center gap-1.5 text-ink-muted
                            "
                        >
                            <StickyNote aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                            <span className="truncate">{visit.meetingNote}</span>
                        </span>
                    </Hint>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    {visit.outcome ? (
                        <Hint label="What the buyer thought after this visit">
                            <Badge variant={VISIT_OUTCOME_META[visit.outcome].badgeVariant}>
                                {VISIT_OUTCOME_META[visit.outcome].label}
                            </Badge>
                        </Hint>
                    ) : null}

                    {/* A cancelled row with no reason is the version that
                        damages the relationship — so the reason rides along. */}
                    {visit.cancelReason ? (
                        <span className="body-xs text-ink-subtle">
                            {VISIT_CANCEL_REASON_LABEL[visit.cancelReason]}
                        </span>
                    ) : null}

                    {/* Waiting on the other side is a state, not an action.
                        Saying so stops the user hunting for a missing button. */}
                    {awaitingOther ? (
                        <span className="body-xs text-ink-subtle">
                            Waiting for {viewer === "broker" ? "the owner" : "the broker"} to reply
                        </span>
                    ) : null}
                </div>
            </div>

            {/*
                Actions. The primary stays visible always — hiding "Confirm"
                behind a hover would bury the one thing the row exists for, and
                it is unreachable on a touch screen. The rest fade in on hover
                at desktop widths and stay put on mobile, which has no hover.
            */}
            <div className="flex shrink-0 items-start gap-1">
                {actions.primary ? (
                    <Button
                        size="sm"
                        variant={needsAction ? "default" : "outline"}
                        onClick={() => handlers.onAction(visit.id, actions.primary!)}
                    >
                        {visitActionLabel(actions.primary, viewer)}
                    </Button>
                ) : null}

                {canCall ? (
                    <Hint label={`Call ${counterparty.name}`}>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Call ${counterparty.name}`}
                            render={<a href={`tel:+91${counterparty.phoneDigits}`} />}
                            className="
                              lg:opacity-0 lg:transition-opacity lg:duration-160
                              lg:group-hover/row:opacity-100
                              lg:focus-visible:opacity-100
                            "
                        >
                            <PhoneCall aria-hidden />
                        </Button>
                    </Hint>
                ) : null}

                {actions.secondary.length + actions.overflow.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label="More actions for this visit"
                                    className="
                                      lg:opacity-0 lg:transition-opacity lg:duration-160
                                      lg:group-hover/row:opacity-100
                                      lg:focus-visible:opacity-100
                                      lg:aria-expanded:opacity-100
                                    "
                                >
                                    <MoreHorizontal aria-hidden />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            {[...actions.secondary, ...actions.overflow].map((action) => (
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

            {/* Thumbnail last in the DOM, first visually on wide screens: it is
                decoration here, so it should not lead the reading order. */}
            <PropertyThumb
                src={visit.property.imageSrc}
                alt={visit.property.title}
                className="order-first hidden shrink-0 sm:block"
            />
        </article>
    );
}
