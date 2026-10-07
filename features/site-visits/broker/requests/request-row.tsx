"use client";

import { Clock3, MessageCircle, RotateCcw } from "lucide-react";

import { REQUEST_STATUS } from "@/lib/visits/status";
import { formatVisitDate, formatVisitTime, visitAge } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import type { TimeRequest } from "@/features/site-visits/broker/model";

function canNudge(request: TimeRequest) {
    return (
        !request.lastNudgedAt ||
        Date.now() - new Date(request.lastNudgedAt).getTime() >= 6 * 60 * 60_000
    );
}

export function RequestRow({
    request,
    busy,
    error,
    onWithdraw,
    onNudge,
    onAccept,
    onDecline,
    onRetry,
    onViewVisit,
}: {
    request: TimeRequest;
    busy: boolean;
    error?: string;
    onWithdraw: () => void;
    onNudge: () => void;
    onAccept: () => void;
    onDecline: () => void;
    onRetry: () => void;
    onViewVisit: () => void;
}) {
    const status = REQUEST_STATUS[request.status];
    const action = status.action;
    const buyer = request.buyers[0];
    return (
        <article className="rounded-card border border-border-warm bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-start">
                <div
                    className="
                  relative overflow-hidden rounded-[8px] bg-surface-muted block-14 inline-[72px]
                "
                >
                    <AppImage
                        src={request.property.coverUrl ?? "/properties/1.jpg"}
                        alt=""
                        fill
                        sizes="72px"
                    />
                </div>
                <div className="min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3
                            className="
                      h6 truncate text-ink
                    "
                        >
                            {request.property.title}
                        </h3>
                        <span
                            className={`
                      body-xs rounded-md px-2 py-1 font-semibold
                      ${status.tone}
                    `}
                        >
                            {status.label}
                        </span>
                    </div>
                    <div className="mbs-2 flex items-center gap-2">
                        <UserAvatar
                            name={buyer.name}
                            imageUrl={buyer.avatarUrl}
                            size="xs"
                            fallback="character"
                        />
                        <p
                            className="
                      body-xs text-ink
                    "
                        >
                            <span className="font-semibold">{buyer.name}</span>
                            <span
                                className="
                      text-ink-muted
                    "
                            >
                                {" "}
                                · {request.property.locality}
                            </span>
                        </p>
                    </div>
                    <p className="body-xs mbs-2 flex items-center gap-1.5 text-ink-muted">
                        <Clock3
                            aria-hidden
                            className="
                      block-3.5 inline-3.5
                    "
                        />
                        {visitAge(request.createdAt)} · expires at the requested time
                    </p>
                </div>
                <div className="sm:text-end">
                    <p className="body-xs text-ink-muted">You asked for</p>
                    <p
                        className="
                  tabular text-lg font-bold text-ink
                "
                    >
                        {formatVisitTime(request.preferredStartsAt)}
                    </p>
                    <p
                        className="
                  body-xs text-ink-muted
                "
                    >
                        {formatVisitDate(request.preferredStartsAt)}
                    </p>
                </div>
            </div>

            {error ? (
                <p
                    role="alert"
                    className="
              body-sm mbs-4 rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger
            "
                >
                    {error}
                </p>
            ) : null}

            {action === "counter" && request.counterOffer ? (
                <div
                    className="
              mbs-4 grid gap-3 rounded-inner bg-urgent-soft p-3
              md:grid-cols-[1fr_auto] md:items-center
            "
                >
                    <div>
                        <p className="body-xs font-semibold text-pending">Owner suggested</p>
                        <p
                            className="
              tabular text-2xl font-bold text-ink
            "
                        >
                            {formatVisitTime(request.counterOffer.startsAt)}
                        </p>
                        {request.counterOffer.ownerMessage ? (
                            <p
                                className="
              body-xs mbs-1 text-ink-muted
            "
                            >
                                “{request.counterOffer.ownerMessage}”
                            </p>
                        ) : null}
                    </div>
                    <div
                        className="
              flex flex-wrap gap-2
            "
                    >
                        <Button variant="surface" size="md" onClick={onDecline} disabled={busy}>
                            Decline
                        </Button>
                        <Button size="md" onClick={onAccept} loading={busy}>
                            Accept {formatVisitTime(request.counterOffer.startsAt)}
                        </Button>
                    </div>
                </div>
            ) : null}

            {action === "retry" && request.declineReason ? (
                <p
                    className="
              body-xs mbs-4 rounded-inner bg-surface-muted px-3 py-2 text-ink-muted
            "
                >
                    Owner’s reason: {request.declineReason}
                </p>
            ) : null}

            <footer
                className="
              mbs-4 flex flex-wrap justify-end gap-2 border-bs border-border-warm pbs-3
            "
            >
                {action === "pending" ? (
                    <>
                        <Button variant="ghost" size="md" onClick={onWithdraw} disabled={busy}>
                            Withdraw
                        </Button>
                        <Button
                            variant="surface"
                            size="md"
                            onClick={onNudge}
                            disabled={!canNudge(request) || busy}
                            title={
                                canNudge(request)
                                    ? "Send WhatsApp nudge"
                                    : "You can nudge this owner once every 6 hours"
                            }
                        >
                            <MessageCircle aria-hidden /> Nudge owner
                        </Button>
                    </>
                ) : null}
                {action === "accepted" && request.createdVisitId ? (
                    <Button variant="surface" size="md" onClick={onViewVisit}>
                        View visit
                    </Button>
                ) : null}
                {action === "retry" ? (
                    <Button variant="surface" size="md" onClick={onRetry}>
                        <RotateCcw aria-hidden /> Try another time
                    </Button>
                ) : null}
            </footer>
        </article>
    );
}
