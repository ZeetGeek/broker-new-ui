"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

import { getUserTimeZone } from "@/lib/datetime/timezone";
import { cn } from "@/lib/utils";

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

const SCROLL_THRESHOLD_PX = 8;

function useMobileHeaderScrolled() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const update = () => {
            setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    return scrolled;
}

export function PortalMobileAppBar({
    identity,
    notificationsHref,
}: {
    identity: PortalMobileIdentity;
    notificationsHref: string;
}) {
    const greeting = useDayPartGreeting();
    const scrolled = useMobileHeaderScrolled();

    return (
        <div
            data-scrolled={scrolled ? "true" : "false"}
            className={cn(
                `
                  -mx-4 flex items-center justify-between gap-3 px-4 py-3
                  transition-[background-color,border-color,box-shadow] duration-160 md:hidden
                `,
                scrolled
                    ? "border-be border-border-warm bg-surface shadow-xs"
                    : "border-be border-transparent bg-transparent",
            )}
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
                  shadow-[0_2px_4px_-1px_rgb(11_31_23/0.08),0_8px_18px_-6px_rgb(11_31_23/0.16)]
                  hover:bg-surface hover:text-ink
                  aria-expanded:bg-surface aria-expanded:text-ink
                "
            />
        </div>
    );
}
