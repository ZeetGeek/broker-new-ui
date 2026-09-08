"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Check, Clock, Send, X } from "lucide-react";

import { brokerRequestsApi } from "@/lib/api/broker-requests";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import { MyListingsRequestsEmpty } from "@/features/properties/your-listings/my-listings-empty";
import type {
    BrokerRequestItem,
    BrokerRequestsResult,
    BrokerRequestStatusFilter,
} from "@/features/properties/your-listings/types";

const STATUS_CHIPS: { value: BrokerRequestStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "declined", label: "Declined" },
];

function RequestIcon({ type }: { type: BrokerRequestItem["type"] }) {
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
    if (type === "pending_stale") {
        return (
            <Clock
                aria-hidden
                className="mbs-0.5 shrink-0 text-urgent block-4 inline-4"
                strokeWidth={1.75}
            />
        );
    }
    return (
        <Send
            aria-hidden
            className="mbs-0.5 shrink-0 text-ink-muted block-4 inline-4"
            strokeWidth={1.75}
        />
    );
}

function RequestRow({
    item,
    busy,
    onRemind,
}: {
    item: BrokerRequestItem;
    busy: boolean;
    onRemind: (id: string) => void;
}) {
    const isRemind = item.action.kind === "remind";

    return (
        <li className="flex items-start gap-3 rounded-card border border-border-warm bg-surface p-4">
            <RequestIcon type={item.type} />
            <div
                className="
                  flex flex-1 flex-col gap-2 min-inline-0
                  sm:flex-row sm:items-center sm:justify-between
                "
            >
                <div className="flex flex-col gap-1 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="body font-semibold text-ink">{item.title}</p>
                        <Price
                            amountInr={item.amountInr}
                            isRent={item.isRent}
                            className="body-sm font-semibold text-brand"
                        />
                    </div>
                    <p className="body-sm text-ink-muted">{item.note}</p>
                </div>
                {isRemind ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 self-start border-border-warm sm:self-center"
                        disabled={!item.canRemind || busy}
                        onClick={() => onRemind(item.id)}
                    >
                        {item.action.label}
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 self-start border-border-warm sm:self-center"
                        render={<Link href={item.action.href} />}
                    >
                        {item.action.label}
                    </Button>
                )}
            </div>
        </li>
    );
}

export function MyListingsRequestsPanel() {
    const [status, setStatus] = useState<BrokerRequestStatusFilter>("all");
    const [result, setResult] = useState<BrokerRequestsResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;

        // Deferred so the loading flag does not set state during the effect
        // body, which would cascade an extra render on every filter change.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setLoading(true);
            void brokerRequestsApi
                .list(status)
                .then((next) => {
                    if (cancelled) return;
                    setResult(next);
                })
                .catch(() => {
                    if (cancelled) return;
                    setResult({
                        counts: { approved: 0, pending: 0, declined: 0 },
                        quota: { limit: 10, used: 0, remaining: 10, resetsOn: "" },
                        items: [],
                    });
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [status, revision]);

    async function handleRemind(id: string) {
        setBusyId(id);
        try {
            await brokerRequestsApi.remind(id);
            toast.success("Reminder sent to the owner");
            setRevision((prev) => prev + 1);
        } catch {
            toast.error("Could not send reminder. Try again.");
        } finally {
            setBusyId(null);
        }
    }

    const counts = result?.counts;
    const total = counts == null ? 0 : counts.approved + counts.pending + counts.declined;

    return (
        <div className="flex flex-col gap-5">
            {counts ? (
                <div
                    className="
                  flex flex-wrap gap-4 rounded-card border border-border-warm bg-surface px-4 py-3
                "
                >
                    <div>
                        <p className="body-xs text-ink-muted">Approved</p>
                        <p className="tabular h6 font-semibold text-ink">{counts.approved}</p>
                    </div>
                    <div>
                        <p className="body-xs text-ink-muted">Pending</p>
                        <p className="tabular h6 font-semibold text-ink">{counts.pending}</p>
                    </div>
                    <div>
                        <p className="body-xs text-ink-muted">Declined</p>
                        <p className="tabular h6 font-semibold text-ink">{counts.declined}</p>
                    </div>
                    <div className="ms-auto text-end">
                        <p className="body-xs text-ink-muted">Weekly quota</p>
                        <p className="body-sm font-medium text-ink">
                            {result.quota.remaining} of {result.quota.limit} left
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {STATUS_CHIPS.map((chip) => (
                    <button
                        key={chip.value}
                        type="button"
                        onClick={() => setStatus(chip.value)}
                        className={cn(
                            "body-sm rounded-full px-4 py-2 transition-colors duration-160",
                            status === chip.value
                                ? "bg-ink font-semibold text-surface"
                                : "bg-surface font-normal text-ink-muted hover:text-ink",
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {loading && !result ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-24"
                        />
                    ))}
                </div>
            ) : result && total === 0 && status === "all" ? (
                <MyListingsRequestsEmpty />
            ) : result && result.items.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="h6 text-ink">No {status} requests</p>
                    <p className="body-sm mbs-2 text-ink-muted">Try another filter.</p>
                </div>
            ) : result ? (
                <ul className="flex flex-col gap-3">
                    {result.items.map((item) => (
                        <RequestRow
                            key={item.id}
                            item={item}
                            busy={busyId === item.id}
                            onRemind={handleRemind}
                        />
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
