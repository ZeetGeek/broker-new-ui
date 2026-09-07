"use client";

import { MyListingsPanel } from "@/features/properties/your-listings/my-listings-panel";
import { MyListingsRequestsPanel } from "@/features/properties/your-listings/my-listings-requests-panel";
import type { YourListingsTab } from "@/features/properties/your-listings-tabs";

export function YourListingsPage({ activeTab }: { activeTab: YourListingsTab }) {
    if (activeTab === "requests") {
        return <MyListingsRequestsPanel />;
    }

    return <MyListingsPanel />;
}
