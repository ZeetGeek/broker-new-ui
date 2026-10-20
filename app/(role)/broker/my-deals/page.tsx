import { Suspense } from "react";
import type { Metadata } from "next";

import { MyRequestsPage } from "@/features/properties/my-requests/my-requests-page";
import { RequestsPageSkeleton } from "@/features/properties/my-requests/requests-skeleton";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

const VALID_TABS: RequestsTab[] = ["sent", "invites", "accepted", "rejected"];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const activeTab = VALID_TABS.includes(tab as RequestsTab) ? (tab as RequestsTab) : "accepted";

    return (
        <Suspense fallback={<RequestsPageSkeleton activeTab={activeTab} />}>
            <MyRequestsPage activeTab={activeTab} />
        </Suspense>
    );
}
