"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { toApiInstant } from "@/lib/datetime/api";
import { formatDateIn, formatTimeIn } from "@/lib/format/date";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useNotifications } from "@/providers/notification-provider";

export function NotificationsPage() {
    const { items, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        refresh().catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Failed to load notifications");
        });
    }, [refresh]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="h1 text-ink">
                        <span className="text-ink">Notifications.</span>{" "}
                        <span className="text-ink-muted">
                            {unreadCount === 0
                                ? "You\u2019re up to date."
                                : `${unreadCount} waiting on you.`}
                        </span>
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => void refresh()}>
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        disabled={unreadCount === 0}
                        onClick={() => void markAllRead()}
                    >
                        Mark all read
                    </Button>
                </div>
            </div>

            {error ? <p className="body text-danger">{error}</p> : null}

            {loading && items.length === 0 ? (
                <p className="body text-ink-muted">Loading notifications…</p>
            ) : items.length === 0 ? (
                <div className="rounded-card border border-border-warm bg-surface p-8 text-center">
                    <p className="body-sm font-medium text-ink">You&apos;re up to date</p>
                    <p className="body-xs mbs-1 text-ink-muted">
                        When something needs your attention, it shows up here.
                    </p>
                </div>
            ) : (
                <ul className="overflow-hidden rounded-card border border-border-warm bg-surface">
                    {items.map((item) => {
                        const createdAt = item.createdAt ? new Date(item.createdAt) : null;

                        return (
                            <li
                                key={item.id}
                                className="
                                  flex flex-col gap-3 border-be border-border-warm p-4
                                  last:border-be-0
                                  sm:flex-row sm:items-start sm:justify-between
                                "
                            >
                                <div className="min-inline-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="body font-medium text-ink">{item.title}</p>
                                        {!item.isRead ? <Badge variant="brand">New</Badge> : null}
                                    </div>
                                    {item.body ? (
                                        <p className="body-sm mbs-1 text-ink-muted">{item.body}</p>
                                    ) : null}
                                    {createdAt ? (
                                        <time
                                            dateTime={toApiInstant(createdAt)}
                                            className="tabular body-xs mbs-2 block text-ink-subtle"
                                        >
                                            {formatDateIn(createdAt)} · {formatTimeIn(createdAt)}
                                        </time>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {item.href ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            nativeButton={false}
                                            render={<Link href={item.href} />}
                                        >
                                            Open
                                        </Button>
                                    ) : null}
                                    {!item.isRead ? (
                                        <Button size="sm" onClick={() => void markRead(item.id)}>
                                            Mark read
                                        </Button>
                                    ) : null}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
