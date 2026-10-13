"use client";

import Link from "next/link";

import { Check, Handshake, Inbox, X } from "lucide-react";

import type { DashboardOwnerBrokerRequest } from "@/lib/api/dashboard";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import { OWNER_REQUESTS_HREF, ownerBrokersHref, ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import { DigitPopIn } from "./digit-pop-in";

const REQUESTS_INFO = "Brokers asking to represent one of your properties.";

export type PendingRequestsCardProps = {
    requests: DashboardOwnerBrokerRequest[];
    pendingCount: number;
    busyId: string | null;
    onRespond: (id: string, status: "accepted" | "rejected") => void;
    className?: string;
};

function PendingRequestRow({
    request,
    busy,
    onRespond,
}: {
    request: DashboardOwnerBrokerRequest;
    busy: boolean;
    onRespond: (status: "accepted" | "rejected") => void;
}) {
    const createdAt = request.createdAt ? parseApiInstant(request.createdAt) : null;
    const brokerLabel = request.brokerDisplayName || request.brokerName || "Broker";

    return (
        <li className="flex flex-col gap-2 py-2">
            <div className="flex items-start gap-3 min-inline-0">
                <Handshake
                    aria-hidden
                    className="mbs-0.5 shrink-0 text-brand block-4 inline-4"
                    strokeWidth={1.75}
                />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="body font-semibold text-ink truncate">{brokerLabel}</p>
                        {request.brokerVerified ? (
                            <Badge variant="brand" className="shrink-0">
                                Verified
                            </Badge>
                        ) : null}
                        {request.brokerIsAgency ? (
                            <Badge variant="outline" className="shrink-0 bg-surface">
                                Agency
                            </Badge>
                        ) : null}
                    </div>
                    <Link
                        href={ownerPropertyDetailHref(request.propertyId)}
                        className="
                          body-sm font-medium text-brand underline-offset-4 truncate
                          hover:underline
                        "
                    >
                        {request.propertyTitle}
                    </Link>
                    {request.message ? (
                        <p className="body-sm text-pretty text-ink-muted line-clamp-2">
                            {request.message}
                        </p>
                    ) : null}
                    {createdAt ? (
                        <p className="body-xs text-ink-subtle">
                            {formatRelativePast(createdAt, new Date())}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 ps-7">
                <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => onRespond("accepted")}
                    className="rounded-control bg-brand text-surface hover:bg-brand-text"
                >
                    <Check aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                    Accept
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onRespond("rejected")}
                    className="rounded-control border-border-warm"
                >
                    <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                    Decline
                </Button>
            </div>
        </li>
    );
}

function EmptyRequests({ className }: { className?: string }) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="owner-requests-heading"
        >
            <CardLabel info={REQUESTS_INFO}>
                <span id="owner-requests-heading">Pending requests</span>
            </CardLabel>
            <EmptyState
                icon={Inbox}
                heading="No pending requests"
                description="When a broker asks to represent a listing, it shows up here."
            >
                <TextLinkButton href={ownerBrokersHref()}>Browse brokers</TextLinkButton>
            </EmptyState>
        </section>
    );
}

export function PendingRequestsCard({
    requests,
    pendingCount,
    busyId,
    onRespond,
    className,
}: PendingRequestsCardProps) {
    if (requests.length === 0) {
        return <EmptyRequests className={className} />;
    }

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="owner-requests-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={REQUESTS_INFO}>
                    <span id="owner-requests-heading">Pending requests</span>
                </CardLabel>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                aria-label={`${pendingCount} broker requests waiting`}
                                className="
                                  eyebrow shrink-0 rounded-sm text-ink-muted outline-none
                                  focus-visible:ring-2 focus-visible:ring-ring
                                "
                            >
                                <DigitPopIn value={pendingCount} /> waiting
                            </button>
                        }
                    />
                    <TooltipContent
                        side="bottom"
                        align="center"
                        className="text-pretty max-inline-64"
                    >
                        Broker representation requests that still need your reply.
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="mbs-2 flex-1 overflow-hidden min-block-0">
                <div
                    className="
                      scrollbar-none overflow-y-auto overscroll-contain
                      [-ms-overflow-style:none] block-full
                      [&::-webkit-scrollbar]:hidden
                    "
                >
                    <ul className="flex flex-col gap-1">
                        {requests.map((request) => (
                            <PendingRequestRow
                                key={request.id}
                                request={request}
                                busy={busyId === request.id}
                                onRespond={(status) => onRespond(request.id, status)}
                            />
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mbs-auto flex shrink-0 justify-end pt-2">
                <TextLinkButton href={OWNER_REQUESTS_HREF}>View all</TextLinkButton>
            </div>
        </section>
    );
}
