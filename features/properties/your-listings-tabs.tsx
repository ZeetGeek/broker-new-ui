import Link from "next/link";

import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

export type YourListingsTab = "representing" | "requests";

const YOUR_LISTINGS_TABS: { value: YourListingsTab; label: string; href: string }[] = [
    { value: "representing", label: "My listings", href: BROKER_YOUR_LISTINGS_HREF },
    {
        value: "requests",
        label: "Requests",
        href: `${BROKER_YOUR_LISTINGS_HREF}?tab=requests`,
    },
];

export function YourListingsTabs({ activeTab }: { activeTab: YourListingsTab }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {YOUR_LISTINGS_TABS.map((tab) => {
                const isActive = tab.value === activeTab;

                return (
                    <Link
                        key={tab.value}
                        href={tab.href}
                        className={cn(
                            "body-sm rounded-full px-4 py-2 transition-colors duration-160",
                            isActive
                                ? "bg-ink font-semibold text-surface"
                                : "bg-surface font-normal text-ink-muted hover:text-ink",
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
