import Link from "next/link";

import { Check, Clock, Send, X } from "lucide-react";

import { formatDateShort } from "@/lib/format/date";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Price } from "@/components/shared/price";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "./card-shell";
import type { RequestRowItem, RequestsData } from "./mock-data";

const REQUESTS_INFO =
    "Requests you've sent to owners to represent their properties, and where each one stands.";


export type RequestsCardProps = {
    data: RequestsData;
    /** Service areas from the broker profile — used in the empty-state CTA. */
    className?: string;
};

function totalRequests(counts: RequestsData["counts"]): number {
    return counts.approved + counts.pending + counts.declined;
}

function MetricCell({
    label,
    value,
    hint,
    valueClassName,
}: {
    label: string;
    value: number;
    hint: string;
    valueClassName?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`${label}: ${value}. ${hint}`}
                        className="
                          flex flex-1 flex-col items-start gap-0.5 rounded-inner px-3 text-start
                          outline-none min-inline-0
                          focus-visible:ring-2 focus-visible:ring-ring
                        "
                    >
                        <span className="body-xs font-medium text-ink-muted">{label}</span>
                        <span
                            className={cn("tabular h5 font-semibold", valueClassName ?? "text-ink")}
                        >
                            {value}
                        </span>
                    </button>
                }
            />
            <TooltipContent side="bottom" align="center" className="text-pretty max-inline-64">
                {hint}
            </TooltipContent>
        </Tooltip>
    );
}

function RequestIcon({ type }: { type: RequestRowItem["type"] }) {
    if (type === "approved" || type === "approved_untouched") {
        return (
            <Check
                aria-hidden
                className="mbs-0.5 shrink-0 text-success block-4 inline-4"
                strokeWidth={1.75}
            />
        );
    }

    if (type === "declined") {
        return (
            <X
                aria-hidden
                className="mbs-0.5 shrink-0 text-danger block-4 inline-4"
                strokeWidth={1.75}
            />
        );
    }

    return (
        <Clock
            aria-hidden
            className={cn(
                "mbs-0.5 shrink-0 block-4 inline-4",
                type === "pending_stale" ? "text-urgent" : "text-pending",
            )}
            strokeWidth={1.75}
        />
    );
}

/** What this request's state means for the broker, and what the action does. */
function rowHint(item: RequestRowItem): string {
    switch (item.type) {
        case "approved_untouched":
            return "The owner approved this but you haven't acted on it yet. Open it and start working the property.";
        case "approved":
            return "The owner approved your request. This property is in your pipeline.";
        case "pending_stale":
            return "The owner still hasn't replied. Send a reminder, or move on to another property.";
        case "declined":
            return "The owner turned this request down. You can't represent this property.";
        default:
            return "Your request is with the owner. They haven't approved or declined it yet.";
    }
}

/** "Nudge" and friends are terse by design - say what the tap actually does. */
function actionHint(item: RequestRowItem): string {
    const label = item.action.label.toLowerCase();
    if (label.includes("nudge") || label.includes("remind")) {
        return "Send the owner a polite reminder about this request.";
    }
    if (item.type === "approved" || item.type === "approved_untouched") {
        return "Open this property and start working it.";
    }
    return "Open this request to see the full details.";
}

function RequestRow({ item }: { item: RequestRowItem }) {
    const isUrgent = item.type === "pending_stale";
    const hint = rowHint(item);

    return (
        <li className="flex items-start gap-3 py-2">
            <RequestIcon type={item.type} />
            <Tooltip>
                <TooltipTrigger
                    render={
                        <div
                            tabIndex={0}
                            role="note"
                            aria-label={`${item.title}. ${item.note}. ${hint}`}
                            className="
                              flex-1 rounded-sm outline-none min-inline-0
                              focus-visible:ring-2 focus-visible:ring-ring
                            "
                        />
                    }
                >
                    <p className="body truncate font-semibold text-ink">
                        {item.title}
                        <span aria-hidden> · </span>
                        <Price
                            amountInr={item.amountInr}
                            isRent={item.isRent}
                            className="font-semibold text-ink"
                        />
                    </p>
                    <p
                        className={cn(
                            "body-sm mbs-0.5 truncate",
                            isUrgent ? "text-urgent" : "text-ink-muted",
                        )}
                    >
                        {item.note}
                    </p>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="text-pretty max-inline-52">
                    {hint}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            variant="link"
                            size="sm"
                            nativeButton={false}
                            className="
                              body-sm shrink-0 self-center p-0 font-semibold text-brand block-auto
                              hover:text-brand-text
                            "
                            render={<Link href={item.action.href} />}
                        >
                            {item.action.label}
                        </Button>
                    }
                />
                <TooltipContent side="top" align="end" className="text-pretty max-inline-48!">
                    {actionHint(item)}
                </TooltipContent>
            </Tooltip>
        </li>
    );
}

function EmptyRequests({ className }: { className?: string }) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
            aria-labelledby="requests-card-heading"
        >
            <CardLabel info={REQUESTS_INFO}>
                <span id="requests-card-heading">Your requests</span>
            </CardLabel>

            <EmptyState
                icon={Send}
                heading="No requests sent yet"
                description="Find a property you'd like to sell and ask the owner."
            >
                <TextLinkButton href={BROKER_OWNER_LISTINGS_HREF}>Owner listings</TextLinkButton>
            </EmptyState>
        </section>
    );
}

export function RequestsCard({ data, className }: RequestsCardProps) {
    if (totalRequests(data.counts) === 0) {
        return <EmptyRequests className={className} />;
    }

    const rows = data.items;
    const remainingLabel =
        data.quota.remaining === 1 ? "1 left this week" : `${data.quota.remaining} left this week`;
    const quotaHint =
        `You can send ${data.quota.limit} requests a week. ` +
        `${data.quota.used} used, ${data.quota.remaining} left. ` +
        `Your limit resets on ${formatDateShort(new Date(data.quota.resetsOn))}.`;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="requests-card-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={REQUESTS_INFO}>
                    <span id="requests-card-heading">Your requests</span>
                </CardLabel>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                aria-label={`${remainingLabel}. ${quotaHint}`}
                                className="
                                  eyebrow shrink-0 rounded-sm text-ink-muted outline-none
                                  focus-visible:ring-2 focus-visible:ring-ring
                                "
                            >
                                {remainingLabel}
                            </button>
                        }
                    />
                    <TooltipContent
                        side="bottom"
                        align="center"
                        className="text-pretty max-inline-64"
                    >
                        {quotaHint}
                    </TooltipContent>
                </Tooltip>
            </div>

            <div
                className="
                  mbs-4 flex shrink-0 items-stretch rounded-inner bg-surface-muted px-2 py-3
                "
                role="group"
                aria-label="Request status counts"
            >
                <MetricCell
                    label="Approved"
                    value={data.counts.approved}
                    hint="Owners who said yes. These properties are yours to work - they're in your pipeline now."
                    valueClassName="text-success"
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <MetricCell
                    label="Waiting"
                    value={data.counts.pending}
                    hint="Sent, but the owner hasn't answered yet. Nudge the ones that have been sitting a while."
                    valueClassName="text-pending"
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <MetricCell
                    label="Declined"
                    value={data.counts.declined}
                    hint="Owners who said no to representing their property. Try another listing in the same area."
                    valueClassName="text-danger"
                />
            </div>

            <div className="mbs-2 flex-1 overflow-hidden min-block-0">
                {rows.length > 0 ? (
                    <div
                        className="
                          scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none] block-full
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <ul className="flex flex-col gap-1">
                            {rows.map((item) => (
                                <RequestRow key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="body text-ink-muted">No request details to show yet.</p>
                )}
            </div>
        </section>
    );
}
