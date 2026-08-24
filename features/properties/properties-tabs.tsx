import Link from "next/link";

import { cn } from "@/lib/utils";

export type PropertiesTab = "browse" | "requests" | "mine";

const TABS: { value: PropertiesTab; label: string }[] = [
    { value: "browse", label: "Browse" },
    { value: "requests", label: "My Requests" },
    { value: "mine", label: "Mine" },
];

const TAB_CONTENT: Record<PropertiesTab, { heading: string; description: string }> = {
    browse: {
        heading: "Browse properties",
        description: "The live property pool from owners in your city.",
    },
    requests: {
        heading: "My requests",
        description: "Requests to represent you've sent — pending, approved, rejected.",
    },
    mine: {
        heading: "Mine",
        description: "Properties you represent, plus listings you've added yourself.",
    },
};

export function PropertiesTabs({ activeTab }: { activeTab: PropertiesTab }) {
    const content = TAB_CONTENT[activeTab];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="display-md">Properties</h1>
                <p className="body text-ink-muted">{content.description}</p>
            </div>

            <div className="flex items-center gap-2 border-be border-border-warm">
                {TABS.map((tab) => {
                    const isActive = tab.value === activeTab;
                    const href =
                        tab.value === "browse"
                            ? "/broker/properties"
                            : `/broker/properties?tab=${tab.value}`;

                    return (
                        <Link
                            key={tab.value}
                            href={href}
                            className={cn(
                                "body-sm px-4 py-3 transition-colors duration-160",
                                isActive
                                    ? "border-be-2 border-ink font-semibold text-ink"
                                    : `
                                      border-be-2 border-transparent font-normal text-ink-muted
                                      hover:text-ink
                                    `,
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <p className="body-sm text-ink-subtle">{content.heading} — coming soon.</p>
        </div>
    );
}
