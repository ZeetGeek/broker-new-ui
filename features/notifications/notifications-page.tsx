"use client";

import { useMemo, useState } from "react";

import { notificationsApi } from "@/lib/api/notifications";
import { getNotificationTab, getNotificationVisual } from "@/lib/notifications/classify";
import { getNotificationDisplayContent } from "@/lib/notifications/display-content";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import toast from "@/components/shared/app-toast";
import { CheckCheck } from "@/components/shared/icons";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { Button } from "@/components/ui/button";

import { HistoryPage } from "@/features/history/history-page";
import { useNotifications } from "@/providers/notification-provider";

export function NotificationsPage() {
    const {
        unreadCount,
        loading: unreadLoading,
        error: unreadError,
        markRead,
        markAllRead,
    } = useNotifications();
    const [readOverrides, setReadOverrides] = useState<Set<string>>(() => new Set());
    const [markingAllRead, setMarkingAllRead] = useState(false);
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
        try {
            await markRead(id);
        } catch {
            setReadOverrides((previous) => {
                const next = new Set(previous);
                next.delete(id);
                return next;
            });
            toast.error("Couldn't mark this notification as read. Try again.", {
                id: "notification-mark-read-error",
            });
        }
    };

    const handleMarkAllRead = async () => {
        if (markingAllRead) return;
        const previous = readOverrides;
        setReadOverrides(new Set(items.map((item) => item.id)));
        setMarkingAllRead(true);
        try {
            await markAllRead();
        } catch {
            setReadOverrides(previous);
            toast.error("Couldn't mark all notifications as read. Try again.", {
                id: "notifications-mark-all-read-error",
            });
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleRefresh = async () => {
        const result = await query.refetch();
        if (result.isError) {
            toast.error("Couldn't refresh notifications. Check your connection and try again.", {
                id: "notifications-refresh-error",
            });
        }
    };

    const categoryLabels: Record<string, string> = {
        requests: "Requests",
        visits: "Visits",
        tasks: "Tasks",
        updates: "Other updates",
    };
    return (
        <HistoryPage
            title="Notifications"
            total={query.total}
            unreadCount={unreadLoading || unreadError ? undefined : unreadCount}
            entries={items.map((item) => {
                const content = getNotificationDisplayContent(item);
                const visual = getNotificationVisual(item);
                return {
                    id: item.id,
                    title: content.title,
                    body: content.body,
                    createdAt: item.createdAt,
                    href: item.href,
                    category: categoryLabels[getNotificationTab(item)],
                    Icon: visual.Icon,
                    iconTone: visual.tone,
                    unread: !item.isRead,
                    action: !item.isRead ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleMarkRead(item.id)}
                        >
                            <CheckCheck aria-hidden />
                            Mark read
                        </Button>
                    ) : null,
                };
            })}
            loading={query.isPending}
            readStatus
            loadingMore={query.isFetchingNextPage}
            error={query.isError}
            refreshing={query.isRefetching}
            onRefresh={() => void handleRefresh()}
            primaryAction={
                <Button
                    size="sm"
                    variant="accent"
                    className="block-[38px]!"
                    disabled={!unreadCount || markingAllRead}
                    loading={markingAllRead}
                    onClick={() => void handleMarkAllRead()}
                >
                    <CheckCheck aria-hidden />
                    Mark all read
                </Button>
            }
            emptyDescription="Notifications about your property work will appear here."
            footer={
                !query.isPending && (!query.isError || items.length > 0) ? (
                    <InfiniteListStatus
                        hasNextPage={Boolean(query.hasNextPage)}
                        isFetchingNextPage={query.isFetchingNextPage}
                        error={query.isFetchNextPageError ? query.error : null}
                        onLoadMore={() => void query.fetchNextPage()}
                    />
                ) : null
            }
        />
    );
}
