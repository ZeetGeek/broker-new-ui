"use client";

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { type NotificationItem, notificationsApi } from "@/lib/api/notifications";
import { type RepresentationRespondStatus, representativeApi } from "@/lib/api/representative";
import {
    requestBrowserNotificationPermission,
    showBrowserNotification,
} from "@/lib/browser-notification";
import { disconnectNotificationSocket, getNotificationSocket } from "@/lib/socket/notifications";

import { useAppSelector } from "@/store/hooks";

type NotificationContextValue = {
    items: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    respondToRepresentation: (
        notificationId: string,
        representationId: string,
        status: RepresentationRespondStatus,
    ) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const userRole = useAppSelector((state) => state.auth.user?.role);
    const isAuthenticated = Boolean(accessToken);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const data = await notificationsApi.list({ page: 1, limit: 20 });
            setItems(data.items);
            setUnreadCount(data.unreadCount);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const markRead = useCallback(
        async (id: string) => {
            if (!accessToken) return;
            const socket = getNotificationSocket(accessToken);
            if (socket.connected) {
                setItems((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
                );
                socket.emit("notification.mark_read", { id });
                return;
            }
            const res = await notificationsApi.markRead(id);
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
            );
            setUnreadCount(res.unreadCount);
        },
        [accessToken],
    );

    const markAllRead = useCallback(async () => {
        if (!accessToken) return;
        const socket = getNotificationSocket(accessToken);
        if (socket.connected) {
            setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
            socket.emit("notification.mark_all_read");
            return;
        }
        await notificationsApi.markAllRead();
        setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
    }, [accessToken]);

    const respondToRepresentation = useCallback(
        async (
            notificationId: string,
            representationId: string,
            status: RepresentationRespondStatus,
        ) => {
            if (!accessToken) return;

            const body = { status };
            if (userRole === "owner") {
                await representativeApi.ownerRespond(representationId, body);
            } else {
                await representativeApi.brokerRespond(representationId, body);
            }

            setItems((prev) => prev.filter((item) => item.id !== notificationId));
            await markRead(notificationId);
            await refresh();
        },
        [accessToken, userRole, markRead, refresh],
    );

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            disconnectNotificationSocket();
            return;
        }

        requestBrowserNotificationPermission();

        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (!cancelled) void refresh();
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [isAuthenticated, accessToken, refresh]);

    useEffect(() => {
        if (!accessToken || !isAuthenticated) return;

        const socket = getNotificationSocket(accessToken);

        const onCreated = (item: NotificationItem) => {
            setItems((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)]);
            showBrowserNotification({
                id: item.id,
                title: item.title,
                body: item.body,
                href:
                    item.href ||
                    (typeof window !== "undefined" && window.location.pathname.startsWith("/owner")
                        ? "/owner/notifications"
                        : "/broker/notifications"),
            });
        };

        const onUnread = ({ unreadCount: count }: { unreadCount: number }) => {
            setUnreadCount(count);
        };

        const onRead = ({ id }: { id: string }) => {
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
            );
        };

        socket.on("notification.created", onCreated);
        socket.on("notification.unread_count", onUnread);
        socket.on("notification.read", onRead);

        return () => {
            socket.off("notification.created", onCreated);
            socket.off("notification.unread_count", onUnread);
            socket.off("notification.read", onRead);
        };
    }, [accessToken, isAuthenticated]);

    const value = useMemo(
        () => ({
            items: isAuthenticated ? items : [],
            unreadCount: isAuthenticated ? unreadCount : 0,
            loading: isAuthenticated ? loading : false,
            refresh,
            markRead,
            markAllRead,
            respondToRepresentation,
        }),
        [
            isAuthenticated,
            items,
            unreadCount,
            loading,
            refresh,
            markRead,
            markAllRead,
            respondToRepresentation,
        ],
    );

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error("useNotifications must be used inside NotificationProvider");
    }
    return ctx;
}
