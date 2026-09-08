import Link from "next/link";

import { BROKER_DEALS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

export type RequestsTab = "sent" | "invites";

export const REQUESTS_TABS: { value: RequestsTab; label: string; href: string }[] = [
    { value: "sent", label: "Sent by you", href: BROKER_DEALS_HREF },
    {
        value: "invites",
        label: "Invites from owners",
        href: `${BROKER_DEALS_HREF}?tab=invites`,
    },
];

export function RequestsTabs({
    activeTab,
    sentCount,
    inviteCount,
    /** Pending invites — the badge only earns its place when action is due. */
    waitingCount = 0,
    className,
}: {
    activeTab: RequestsTab;
    sentCount?: number;
    inviteCount?: number;
    waitingCount?: number;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {REQUESTS_TABS.map((tab) => {
                const isActive = tab.value === activeTab;
                const count = tab.value === "sent" ? sentCount : inviteCount;
                const showWaiting = tab.value === "invites" && waitingCount > 0;

                return (
                    <Link
                        key={tab.value}
                        href={tab.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            `
                              body-sm flex items-center gap-2 rounded-full px-4 py-2
                              transition-colors duration-160
                            `,
                            isActive
                                ? "bg-ink font-semibold text-surface"
                                : "bg-surface font-normal text-ink-muted hover:text-ink",
                        )}
                    >
                        {tab.label}
                        {count != null ? (
                            <span className={cn("tabular-nums", !isActive && "text-ink-muted")}>
                                ({count})
                            </span>
                        ) : null}
                        {showWaiting ? (
                            <span
                                aria-label={`${waitingCount} waiting for you`}
                                className="
                                  body-xs flex items-center justify-center rounded-full bg-urgent
                                  px-1 font-semibold text-surface block-5 min-inline-5
                                "
                            >
                                {waitingCount}
                            </span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}
