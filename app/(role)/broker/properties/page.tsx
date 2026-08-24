import type { Metadata } from "next";

import { type PropertiesTab, PropertiesTabs } from "@/features/properties/properties-tabs";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

const VALID_TABS: PropertiesTab[] = ["browse", "requests", "mine"];

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const activeTab = VALID_TABS.includes(tab as PropertiesTab) ? (tab as PropertiesTab) : "browse";

    return <PropertiesTabs activeTab={activeTab} />;
}
