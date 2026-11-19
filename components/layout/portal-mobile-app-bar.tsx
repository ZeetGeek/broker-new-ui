"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { getUserTimeZone } from "@/lib/datetime/timezone";

import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
import { UserAvatar } from "@/components/shared/user-avatar";

export type PortalMobileIdentity = {
    name: string;
    roleLabel: string;
    avatarUrl?: string;
    profileHref: string;
};

function hourInUserTz(nowMs: number): number {
    const parts = new Intl.DateTimeFormat("en-IN", {
        timeZone: getUserTimeZone(),
        hour: "numeric",
        hour12: false,
    }).formatToParts(new Date(nowMs));
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "12");
    return Number.isFinite(hour) ? hour % 24 : 12;
}

/** Plain day-part greeting for the phone app bar — India timezone. */
export function dayPartGreeting(nowMs = Date.now()): string {
    const hour = hourInUserTz(nowMs);
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
}

function subscribeToMinute(onStoreChange: () => void) {
    const id = window.setInterval(onStoreChange, 60_000);
    return () => window.clearInterval(id);
}

function useDayPartGreeting() {
    return useSyncExternalStore(
        subscribeToMinute,
        () => dayPartGreeting(Date.now()),
        () => "Good morning!",
    );
}

export function PortalMobileAppBar({
    identity,
    notificationsHref,
}: {
    identity: PortalMobileIdentity;
    notificationsHref: string;
}) {
    const greeting = useDayPartGreeting();

    return (
        <div
            className="
              -mx-4 flex items-center justify-between gap-3 border-be border-border-warm px-5 py-4
              md:hidden
            "
        >
            <Link
                href={identity.profileHref}
                className="
                  flex items-center gap-3 rounded-inner pe-1 min-inline-0
                  focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none
                "
                aria-label={`Profile for ${identity.name}`}
            >
                <UserAvatar
                    name={identity.name}
                    imageUrl={identity.avatarUrl}
                    size="md"
                    className="shrink-0"
                />

                <span className="flex flex-col gap-0.5 text-start min-inline-0">
                    <span className="body-xs truncate leading-tight font-medium text-ink-muted">
                        {greeting}
                    </span>
                    <span className="body truncate leading-tight font-semibold text-ink">
                        {identity.name}
                    </span>
                </span>
            </Link>

            <PortalNotificationsMenu
                viewAllHref={notificationsHref}
                tooltipLabel="Notifications"
                triggerClassName="
                  relative rounded-full border-0 bg-surface text-ink
                  block-11! inline-11! min-block-11! min-inline-11!
                  shadow-[0_2px_4px_-1px_rgb(11_31_23/0.08),0_8px_18px_-6px_rgb(11_31_23/0.16)]
                  hover:bg-surface hover:text-ink
                  aria-expanded:bg-surface aria-expanded:text-ink
                  [&_svg]:block-5! [&_svg]:inline-5!
                "
            />
        </div>
    );
}
