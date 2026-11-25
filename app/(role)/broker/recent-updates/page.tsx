import type { Metadata } from "next";

import { RecentUpdatesPage } from "@/features/new-dashboard/recent-updates-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <RecentUpdatesPage />;
}
