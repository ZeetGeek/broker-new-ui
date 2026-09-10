import { Suspense } from "react";
import type { Metadata } from "next";

import { YourListingsPage } from "@/features/properties/your-listings/your-listings-page";
import { type YourListingsTab } from "@/features/properties/your-listings-tabs";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

const VALID_TABS: YourListingsTab[] = ["representing", "requests"];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const activeTab = VALID_TABS.includes(tab as YourListingsTab)
        ? (tab as YourListingsTab)
        : "representing";

    return (
        <Suspense fallback={null}>
            <YourListingsPage activeTab={activeTab} />
        </Suspense>
    );
}
