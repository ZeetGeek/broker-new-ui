import type { Metadata } from "next";

import { PropertiesPageShell } from "@/features/properties/properties-page-shell";
import { type YourListingsTab, YourListingsTabs } from "@/features/properties/your-listings-tabs";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

const VALID_TABS: YourListingsTab[] = ["representing", "requests"];

const TAB_COPY: Record<YourListingsTab, { description: string; placeholder: string }> = {
    representing: {
        description: "Properties you represent and listings you've added yourself.",
        placeholder: "Your listings — coming soon.",
    },
    requests: {
        description: "Requests you've sent to owners — pending, approved, or rejected.",
        placeholder: "Your requests — coming soon.",
    },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const activeTab = VALID_TABS.includes(tab as YourListingsTab)
        ? (tab as YourListingsTab)
        : "representing";
    const copy = TAB_COPY[activeTab];

    return (
        <PropertiesPageShell title="Your listings" description={copy.description}>
            <YourListingsTabs activeTab={activeTab} />
            <p className="body-sm text-ink-subtle">{copy.placeholder}</p>
        </PropertiesPageShell>
    );
}
