import type { Metadata } from "next";

import { NotificationsPage } from "@/features/notifications/notifications-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <NotificationsPage />;
}
