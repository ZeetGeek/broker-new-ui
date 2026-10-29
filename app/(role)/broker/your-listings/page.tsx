import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { MyListingsPageSkeleton } from "@/features/properties/your-listings/my-listings-skeleton";
import { YourListingsPage } from "@/features/properties/your-listings/your-listings-page";
import { type YourListingsTab } from "@/features/properties/your-listings-tabs";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

const VALID_TABS: YourListingsTab[] = ["representing", "requests"];

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    if (!FEATURE_PLATFORM_OWNER && tab === "requests") redirect(BROKER_YOUR_LISTINGS_HREF);
    const activeTab = VALID_TABS.includes(tab as YourListingsTab)
        ? (tab as YourListingsTab)
        : "representing";

    return (
        <Suspense fallback={<MyListingsPageSkeleton />}>
            <YourListingsPage activeTab={activeTab} />
        </Suspense>
    );
}
