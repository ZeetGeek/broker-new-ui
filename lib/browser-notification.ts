"use client";

type BrowserNotice = {
    id?: string;
    title?: string | null;
    body?: string | null;
    href?: string | null;
};

export function canUseBrowserNotifications() {
    return typeof window !== "undefined" && "Notification" in window;
}

export function requestBrowserNotificationPermission() {
    if (!canUseBrowserNotifications()) return;
    if (Notification.permission === "default") {
        void Notification.requestPermission();
    }
}

function presentNotification(notice: BrowserNotice) {
    console.log("notice", notice);
    const title = notice.title?.trim() || "New notification";
    const notification = new Notification(title, {
        body: notice.body?.trim() || undefined,
        icon: "/logo/yes-broker-logo.svg",
        tag: notice.id || title,
        requireInteraction: false,
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
        if (notice.href) {
            const href = notice.href.startsWith("http")
                ? notice.href
                : notice.href.startsWith("/")
                  ? notice.href
                  : `/${notice.href}`;
            window.location.assign(href);
        }
    };
}

export function showBrowserNotification(notice: BrowserNotice) {
    if (!canUseBrowserNotifications()) return;

    if (Notification.permission === "granted") {
        presentNotification(notice);
        return;
    }

    if (Notification.permission === "default") {
        void Notification.requestPermission().then((permission) => {
            if (permission === "granted") presentNotification(notice);
        });
    }
}
