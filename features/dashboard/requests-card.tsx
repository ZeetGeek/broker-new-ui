import Link from "next/link";

import { Check, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { RequestRowItem, RequestsData } from "./mock-data";

const REQUESTS_INFO =
    "Requests you've sent to owners to represent their properties, and where each one stands.";

const MAX_REQUEST_ROWS = 5;

const LINK_CLASS = cn(
    "body-sm inline-flex items-center gap-1 font-semibold text-brand outline-none",
    "hover:text-brand-text",
    "focus-visible:ring-3 focus-visible:ring-ring/30",
);

export type RequestsCardProps = {
    data: RequestsData;
    /** Service areas from the broker profile — used in the empty-state CTA. */
    serviceAreas: string[];
    className?: string;
};

function totalRequests(counts: RequestsData["counts"]): number {
    return counts.approved + counts.pending + counts.declined;
}

function MetricCell({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: number;
    valueClassName?: string;
}) {
    return (
        <div className="flex flex-1 flex-col items-start gap-0.5 px-3 min-inline-0">
            <span className="body-xs font-medium text-ink-muted">{label}</span>
            <span className={cn("tabular h5 font-semibold", valueClassName ?? "text-ink")}>
                {value}
            </span>
        </div>
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

function RequestRow({ item }: { item: RequestRowItem }) {
    const isUrgent = item.type === "pending_stale";

    return (
        <li className="flex items-start gap-3 py-3">
            <RequestIcon type={item.type} />
            <div className="flex-1 min-inline-0">
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
            </div>
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
        </li>
    );
}

function EmptyRequests({
    serviceAreas,
    className,
}: {
    serviceAreas: string[];
    className?: string;
}) {
    const areasLabel = serviceAreas.length > 0 ? serviceAreas.join(", ") : "your areas";

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="requests-card-heading"
        >
            <CardLabel info={REQUESTS_INFO}>
                <span id="requests-card-heading">Your requests</span>
            </CardLabel>
            <div className="mbs-4 flex flex-1 flex-col min-block-0">
                <p className="h5 text-ink">No requests yet</p>
                <p className="body mbs-1 text-ink-muted">
                    Browse properties in {areasLabel} to send your first request.
                </p>
                <div className="pts-3 mbs-auto">
                    <Link href="/broker/properties" className={LINK_CLASS}>
                        Browse properties
                        <span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}

export function RequestsCard({ data, serviceAreas, className }: RequestsCardProps) {
    if (totalRequests(data.counts) === 0) {
        return <EmptyRequests serviceAreas={serviceAreas} className={className} />;
    }

    const rows = data.items.slice(0, MAX_REQUEST_ROWS);
    const remainingLabel =
        data.quota.remaining === 1 ? "1 left this week" : `${data.quota.remaining} left this week`;
    const showFade = rows.length >= 3 || data.items.length > MAX_REQUEST_ROWS;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="requests-card-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={REQUESTS_INFO}>
                    <span id="requests-card-heading">Your requests</span>
                </CardLabel>
                <p className="eyebrow shrink-0 text-ink-muted">{remainingLabel}</p>
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
                    valueClassName="text-success"
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <MetricCell
                    label="Waiting"
                    value={data.counts.pending}
                    valueClassName="text-pending"
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <MetricCell
                    label="Declined"
                    value={data.counts.declined}
                    valueClassName="text-danger"
                />
            </div>

            <div className="relative mbs-2 flex-1 min-block-0">
                {rows.length > 0 ? (
                    <div
                        className="
                          absolute inset-0 scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none]
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <ul
                            className={cn(
                                "flex flex-col divide-y divide-border-warm",
                                showFade && "pbe-7",
                            )}
                        >
                            {rows.map((item) => (
                                <RequestRow key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="body text-ink-muted">No request details to show yet.</p>
                )}

                <div
                    className="
                      absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end block-14
                    "
                >
                    {showFade ? (
                        <div
                            aria-hidden
                            className={`
                              pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                              from-40% via-surface/90 to-transparent
                            `}
                        />
                    ) : null}
                    <div className="relative flex justify-center">
                        <Link href="/broker/properties?tab=requests" className={LINK_CLASS}>
                            View all requests
                            <span aria-hidden>→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
