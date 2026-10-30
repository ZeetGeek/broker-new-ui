"use client";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { MyListingsPanel } from "@/features/properties/your-listings/my-listings-panel";
import { MyListingsRequestsPanel } from "@/features/properties/your-listings/my-listings-requests-panel";
import type { YourListingsTab } from "@/features/properties/your-listings-tabs";

export function YourListingsPage({ activeTab }: { activeTab: YourListingsTab }) {
    if (FEATURE_PLATFORM_OWNER && activeTab === "requests") {
        return <MyListingsRequestsPanel />;
    }

    return <MyListingsPanel />;
}
