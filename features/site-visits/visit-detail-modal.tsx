"use client";

import Link from "next/link";

import { CalendarClock, Clock3, Lock, MapPin, PhoneCall, StickyNote } from "lucide-react";

import { formatRelativePast, formatShowingWhen } from "@/lib/format/date";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { VisitItem, VisitViewer } from "@/features/site-visits/types";
import {
    actorLabel,
    VISIT_CANCEL_REASON_LABEL,
    VISIT_OUTCOME_META,
    VISIT_STATUS_HINT,
    VISIT_STATUS_META,
} from "@/features/site-visits/visit-meta";
import {
    isDestructiveAction,
    type VisitAction,
    visitActionLabel,
    visitActions,
} from "@/features/site-visits/visit-permissions";

type VisitDetailModalProps = {
    visit: VisitItem | null;
    viewer: VisitViewer;
    open: boolean;
    now: Date;
    isBusy: boolean;
    onOpenChange: (open: boolean) => void;
    onAction: (visitId: string, action: VisitAction) => void;
    onAcceptAlternative: (visitId: string, slotIso: string) => void;
};

/**
 * Everything about one visit, including the parts a card cannot hold: the
 * meeting instructions, the private note, the alternative slots, and the
 * history of who did what.
 *
 * The history matters more here than it looks. With no chat in the product,
 * this list *is* the conversation between the two sides — it is how an owner
 * sees that they were the one who moved the time last week.
 */
export function VisitDetailModal({
    visit,
    viewer,
    open,
    now,
    isBusy,
    onOpenChange,
    onAction,
    onAcceptAlternative,
}: VisitDetailModalProps) {
    if (!visit) return null;

    const meta = VISIT_STATUS_META[visit.status];
    const StatusIcon = meta.icon;
    const scheduled = new Date(visit.scheduledAt);
    const actions = visitActions(visit, viewer, now);
    const counterparty = viewer === "broker" ? visit.owner : visit.broker;
    const counterpartyRole = viewer === "broker" ? "Owner" : "Broker";
    const canCall = Boolean(counterparty.phoneDigits);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title={`${visit.property.configLabel} in ${visit.property.locality}`}
            description={VISIT_STATUS_HINT[visit.status][viewer]}
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                    <Badge variant={meta.badgeVariant}>
                        <StatusIcon aria-hidden />
                        {meta.label}
                    </Badge>

                    {visit.outcome ? (
                        <Badge variant={VISIT_OUTCOME_META[visit.outcome].badgeVariant}>
                            {VISIT_OUTCOME_META[visit.outcome].label}
                        </Badge>
                    ) : null}
                </div>

                {/* When and where. */}
                <div className="flex flex-col gap-2 rounded-inner bg-surface-muted p-4">
                    <p className="h5 tabular flex items-center gap-2 text-ink">
                        <CalendarClock aria-hidden className="block-5 inline-5" />
                        {formatShowingWhen(scheduled, now)}
                    </p>
                    <p className="body-sm flex items-center gap-1.5 text-ink-muted">
                        <Clock3 aria-hidden className="block-3.5 inline-3.5" />
                        {visit.durationMin} minutes
                    </p>
                    <p className="body-sm flex items-center gap-1.5 text-ink-muted">
                        <MapPin aria-hidden className="block-3.5 inline-3.5" />
                        {visit.property.locality}, {visit.property.city}
                    </p>
                </div>

                {/* The property. */}
                <div className="flex items-start gap-3">
                    {viewer === "broker" ? (
                        <Link
                            href={brokerOwnerListingDetailHref(visit.property.id)}
                            prefetch={false}
                            className="
                              shrink-0 rounded-inner
                              focus-visible:outline-2 focus-visible:outline-brand
                            "
                            aria-label={`Open ${visit.property.title}`}
                        >
                            <PropertyThumb
                                src={visit.property.imageSrc}
                                alt={visit.property.title}
                            />
                        </Link>
                    ) : (
                        <PropertyThumb src={visit.property.imageSrc} alt={visit.property.title} />
                    )}
                    <div className="flex flex-col gap-1 min-inline-0">
                        {viewer === "broker" ? (
                            <PropertyTitleLink
                                href={brokerOwnerListingDetailHref(visit.property.id)}
                                className="body font-semibold"
                            >
                                {visit.property.title}
                            </PropertyTitleLink>
                        ) : (
                            <p className="body font-semibold text-ink">{visit.property.title}</p>
                        )}
                        <Price
                            amountInr={visit.property.amountInr}
                            isRent={visit.property.isRent}
                            className="body-sm font-semibold"
                        />
                        <p className="body-sm text-ink-muted">
                            {visit.property.areaSqft.toLocaleString("en-IN")} sq ft
                        </p>
                    </div>
                </div>

                {/* Who. */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5">
                            <UserAvatar
                                name={counterparty.name}
                                imageUrl={counterparty.avatarUrl}
                            />
                            <span className="flex flex-col">
                                <span className="body-xs text-ink-subtle">{counterpartyRole}</span>
                                <span className="body-sm font-medium text-ink">
                                    {counterparty.name}
                                </span>
                            </span>
                        </span>

                        {canCall ? (
                            <Button
                                size="sm"
                                variant="outline"
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
                    </div>

                    {canCall ? (
                        <PhoneNumber
                            phoneDigits={counterparty.phoneDigits!}
                            className="body-xs text-ink-subtle"
                        />
                    ) : null}

                    {visit.buyer ? (
                        <div className="flex items-center gap-2.5">
                            <UserAvatar size="sm" name={visit.buyer.name} />
                            <span className="flex flex-col">
                                <span className="body-xs text-ink-subtle">Buyer</span>
                                <span className="body-sm font-medium text-ink">
                                    {visit.buyer.name}
                                </span>
                            </span>
                        </div>
                    ) : null}
                </div>

                {visit.meetingNote ? (
                    <div className="flex flex-col gap-1">
                        <p className="eyebrow">Meeting instructions</p>
                        <p className="body-sm text-pretty text-ink">{visit.meetingNote}</p>
                    </div>
                ) : null}

                {/* Broker's own note. The API never sends this to an owner, but
                    the guard stays so a future shape change cannot leak it. */}
                {viewer === "broker" && visit.brokerNote ? (
                    <div
                        className="
                          flex flex-col gap-1 rounded-inner border border-dashed border-border-warm
                          p-3
                        "
                    >
                        <p className="eyebrow flex items-center gap-1.5">
                            <StickyNote aria-hidden className="block-3 inline-3" />
                            Your private note
                        </p>
                        <p className="body-sm text-pretty text-ink">{visit.brokerNote}</p>
                    </div>
                ) : null}

                {visit.cancelReason ? (
                    <p className="body-sm text-ink-muted">
                        {actorLabel(visit.cancelledBy ?? "broker", viewer)} said:{" "}
                        {VISIT_CANCEL_REASON_LABEL[visit.cancelReason].toLowerCase()}.
                    </p>
                ) : null}

                {/* Alternative slots. With no chat, the proposal has to carry
                    its own negotiation — so these are one tap, not a message. */}
                {visit.alternativeSlots.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <p className="eyebrow">Other times offered</p>
                        <div className="flex flex-wrap gap-2">
                            {visit.alternativeSlots.map((slot) => (
                                <Button
                                    key={slot}
                                    size="sm"
                                    variant="outline"
                                    disabled={isBusy}
                                    onClick={() => onAcceptAlternative(visit.id, slot)}
                                >
                                    {formatShowingWhen(new Date(slot), now)}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* History — the conversation, in the absence of a chat. */}
                <div className="flex flex-col gap-2">
                    <p className="eyebrow">History</p>
                    <VirtualListBox
                        items={visit.history}
                        getKey={(event) => event.id}
                        estimateItemHeight={64}
                        gap={0}
                        ariaLabel="Visit history"
                        className="max-block-96"
                        renderItem={(event, index) => {
                            const isLast = index === visit.history.length - 1;
                            return (
                                <div className="flex gap-3">
                                    <span
                                        aria-hidden
                                        className="flex flex-col items-center gap-1 pbs-1"
                                    >
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full block-2 inline-2",
                                                isLast ? "bg-brand" : "bg-border-warm",
                                            )}
                                        />
                                        {!isLast ? (
                                            <span className="flex-1 bg-border-warm inline-px" />
                                        ) : null}
                                    </span>

                                    <span className="flex flex-col gap-0.5 pbe-1">
                                        <span className="body-sm text-ink">{event.label}</span>
                                        <span className="body-xs text-ink-subtle">
                                            {actorLabel(event.actor, viewer)} ·{" "}
                                            {formatRelativePast(new Date(event.at), now)}
                                        </span>
                                    </span>
                                </div>
                            );
                        }}
                    />
                </div>

                {(actions.primary ||
                    actions.secondary.length > 0 ||
                    actions.overflow.length > 0) && (
                    <div className="flex flex-wrap gap-2 border-bs border-border-warm pbs-4">
                        {actions.primary ? (
                            <Button
                                size="lg"
                                loading={isBusy}
                                onClick={() => onAction(visit.id, actions.primary!)}
                            >
                                {visitActionLabel(actions.primary, viewer)}
                            </Button>
                        ) : null}

                        {[...actions.secondary, ...actions.overflow].map((action) => (
                            <Button
                                key={action}
                                size="lg"
                                variant={isDestructiveAction(action) ? "destructive" : "outline"}
                                disabled={isBusy}
                                onClick={() => onAction(visit.id, action)}
                            >
                                {visitActionLabel(action, viewer)}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppModal>
    );
}
