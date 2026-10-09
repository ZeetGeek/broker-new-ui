"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { notificationsApi } from "@/lib/api/notifications";
import { toApiInstant } from "@/lib/datetime/api";
import { formatDateIn, formatTimeIn } from "@/lib/format/date";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useNotifications } from "@/providers/notification-provider";

export function NotificationsPage() {
    const { unreadCount, markRead, markAllRead } = useNotifications();
    const [readOverrides, setReadOverrides] = useState<Set<string>>(() => new Set());
    const query = useInfiniteItems({
        queryKey: ["notifications"],
        queryFn: async ({ cursor, signal }) => {
            const page = cursor ? Number(cursor) || 1 : 1;
            const result = await notificationsApi.list({ page, limit: 20 }, signal);
            return {
                items: result.items,
                total: result.total,
                nextCursor: page * result.limit < result.total ? String(page + 1) : null,
            };
        },
    });
    const items = useMemo(
        () =>
            query.items.map((item) =>
                readOverrides.has(item.id) ? { ...item, isRead: true } : item,
            ),
        [query.items, readOverrides],
    );

    const handleMarkRead = async (id: string) => {
        setReadOverrides((previous) => new Set(previous).add(id));
        await markRead(id);
    };

    const handleMarkAllRead = async () => {
        setReadOverrides(new Set(items.map((item) => item.id)));
        await markAllRead();
    };

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
                    <Button type="button" variant="outline" onClick={() => void query.refetch()}>
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        disabled={unreadCount === 0}
                        onClick={() => void handleMarkAllRead()}
                    >
                        Mark all read
                    </Button>
                </div>
            </div>

            {query.isError && items.length === 0 ? (
                <p className="body text-danger">Failed to load notifications</p>
            ) : null}

            {query.isError && items.length === 0 ? null : query.isPending ? (
                <p className="body text-ink-muted">Loading notifications…</p>
            ) : items.length === 0 ? (
                <div className="rounded-card border border-border-warm bg-surface p-8 text-center">
                    <p className="body-sm font-medium text-ink">You&apos;re up to date</p>
                    <p className="body-xs mbs-1 text-ink-muted">
                        When something needs your attention, it shows up here.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div
                        className="
                          overflow-hidden rounded-card border border-border-warm bg-surface
                        "
                    >
                        <WindowVirtualGrid
                            items={items}
                            getKey={(item) => item.id}
                            estimateRowHeight={132}
                            gap={0}
                            ariaLabel="Notifications"
                            renderItem={(item) => {
                                const createdAt = item.createdAt ? new Date(item.createdAt) : null;

                                return (
                                    <div
                                        className="
                                          flex flex-col gap-3 border-be border-border-warm p-4
                                          last:border-be-0
                                          sm:flex-row sm:items-start sm:justify-between
                                        "
                                    >
                                        <div className="min-inline-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="body font-medium text-ink">
                                                    {item.title}
                                                </p>
                                                {!item.isRead ? (
                                                    <Badge variant="brand">New</Badge>
                                                ) : null}
                                            </div>
                                            {item.body ? (
                                                <p className="body-sm mbs-1 text-ink-muted">
                                                    {item.body}
                                                </p>
                                            ) : null}
                                            {createdAt ? (
                                                <time
                                                    dateTime={toApiInstant(createdAt)}
                                                    className="
                                                      tabular body-xs mbs-2 block text-ink-subtle
                                                    "
                                                >
                                                    {formatDateIn(createdAt)} ·{" "}
                                                    {formatTimeIn(createdAt)}
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
                                                <Button
                                                    size="sm"
                                                    onClick={() => void handleMarkRead(item.id)}
                                                >
                                                    Mark read
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                    <InfiniteListStatus
                        hasNextPage={Boolean(query.hasNextPage)}
                        isFetchingNextPage={query.isFetchingNextPage}
                        error={query.isFetchNextPageError ? query.error : null}
                        onLoadMore={() => void query.fetchNextPage()}
                    />
                </div>
            )}
        </div>
    );
}
