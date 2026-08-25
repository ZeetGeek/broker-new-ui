import Link from "next/link";

import { Check, Clock, Navigation } from "lucide-react";

import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import { DigitPopIn } from "./digit-pop-in";
import type { RequestAttentionItem, RequestsData } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const REQUESTS_INFO =
    "Requests you've sent to owners to represent their properties, and where each one stands.";

const MAX_ATTENTION_ROWS = 3;

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
            <DigitPopIn
                value={value}
                className={cn("tabular h5 font-semibold", valueClassName ?? "text-ink")}
            />
        </div>
    );
}

function AttentionIcon({ type }: { type: RequestAttentionItem["type"] }) {
    if (type === "approved_untouched") {
        return (
            <Check
                aria-hidden
                className="mbs-0.5 shrink-0 text-success block-4 inline-4"
                strokeWidth={1.75}
            />
        );
    }

    return (
        <Clock
            aria-hidden
            className="mbs-0.5 shrink-0 text-urgent block-4 inline-4"
            strokeWidth={1.75}
        />
    );
}

function AttentionRow({ item }: { item: RequestAttentionItem }) {
    const isStale = item.type === "pending_stale";

    return (
        <li className="flex items-start gap-3 py-3">
            <AttentionIcon type={item.type} />
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
                        isStale ? "text-urgent" : "text-ink-muted",
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
                  body-sm shrink-0 self-center gap-1 p-0 font-semibold text-brand block-auto
                  hover:text-brand-text
                "
                render={<Link href={item.action.href} />}
            >
                <Navigation aria-hidden strokeWidth={1.75} />
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
                    <TextLinkButton href="/broker/properties">Browse properties</TextLinkButton>
                </div>
            </div>
        </section>
    );
}

export function RequestsCard({ data, serviceAreas, className }: RequestsCardProps) {
    if (totalRequests(data.counts) === 0) {
        return <EmptyRequests serviceAreas={serviceAreas} className={className} />;
    }

    const attention = data.attention.slice(0, MAX_ATTENTION_ROWS);
    const remainingLabel =
        data.quota.remaining === 1 ? "1 left this week" : `${data.quota.remaining} left this week`;
    const showFade = attention.length >= 3 || data.attention.length > MAX_ATTENTION_ROWS;

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
                {attention.length > 0 ? (
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
                            {attention.map((item) => (
                                <AttentionRow key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="body text-ink-muted">Nothing needs attention right now.</p>
                )}

                <div
                    className="
                      absolute inset-x-0 inset-be-[-1rem] z-10 flex flex-col justify-end
                      block-14
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
                        <TextLinkButton href="/broker/properties?tab=requests">
                            View all requests
                        </TextLinkButton>
                    </div>
                </div>
            </div>
        </section>
    );
}
