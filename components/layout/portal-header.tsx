"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
    PortalMobileAppBar,
    type PortalMobileIdentity,
} from "@/components/layout/portal-mobile-app-bar";
import { PortalNav } from "@/components/layout/portal-nav";
import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
import { usePortalHeaderScrolled } from "@/components/layout/use-portal-header-scrolled";
import { Logo } from "@/components/shared/logo";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { NavItem } from "@/config/nav";

export type { PortalMobileIdentity };

export type PortalHeaderProps = {
    navItems: NavItem[];
    notificationsHref: string;
    /** Portal account dropdown — owner and broker each pass their menu. */
    profileMenu: ReactNode;
    /** Phone app-bar identity (avatar + greeting + name). Hidden from `md` up. */
    mobileIdentity: PortalMobileIdentity;
    /** Rotating search hints; defaults to broker-oriented copy when omitted. */
    searchHints?: readonly string[];
    /** Optional row below the main header bar — e.g. Browse / Mine on properties pages. */
    sectionNav?: ReactNode;
    /** Fixed bottom nav on mobile. Adds scroll padding when set. */
    mobileNav?: ReactNode;
    children?: ReactNode;
};

export function PortalHeader({
    navItems,
    notificationsHref,
    profileMenu,
    mobileIdentity,
    sectionNav,
    mobileNav,
    children,
}: PortalHeaderProps) {
    const homeHref = navItems[0]?.href ?? "/";
    const scrolled = usePortalHeaderScrolled();

    return (
        <div data-portal-shell className="bg-surface-muted min-block-screen">
            {/* Sticky outside overflow-x clip — sticky fails inside overflow-x-hidden. */}
            <header
                data-scrolled={scrolled ? "true" : "false"}
                className={cn(
                    `
                      sticky inset-bs-0 z-30
                      transition-[background-color,border-color,box-shadow] duration-160
                    `,
                    scrolled
                        ? "bg-surface shadow-sm md:border-be md:border-border-warm"
                        : "bg-surface-muted md:border-be md:border-border-warm",
                )}
            >
                <TooltipProvider>
                    <div className="mx-auto px-4 max-inline-(--portal-max-inline) md:px-8">
                        <PortalMobileAppBar
                            identity={mobileIdentity}
                            notificationsHref={notificationsHref}
                        />

                        <div
                            className="
                              hidden items-center justify-between gap-4 py-3 md:flex lg:gap-8
                            "
                        >
                            <div className="flex flex-1 items-center gap-8 min-inline-0 lg:gap-10">
                                <Logo href={homeHref} className="shrink-0 whitespace-nowrap" />
                                <PortalNav items={navItems} />
                            </div>

                            <div className="flex shrink-0 items-center gap-4">
                                <PortalNotificationsMenu
                                    viewAllHref={notificationsHref}
                                    tooltipLabel="Notifications"
                                    triggerClassName="
                                      relative rounded-full border border-border-warm bg-surface
                                      text-ink-muted shadow-sm
                                      hover:bg-surface-muted hover:text-ink-muted
                                      aria-expanded:bg-surface-muted aria-expanded:text-ink-muted
                                    "
                                />

                                <span
                                    aria-hidden
                                    className="shrink-0 bg-ink-subtle/30 block-7 inline-px"
                                />

                                {profileMenu}
                            </div>
                        </div>
                    </div>
                </TooltipProvider>
            </header>

            <div
                data-portal-content
                className="mx-auto overflow-x-clip px-4 max-inline-(--portal-max-inline) md:px-8"
            >
                {sectionNav ? <div className="py-6">{sectionNav}</div> : null}

                {children ? (
                    <main
                        className={cn(
                            "pbe-6",
                            sectionNav ? "pbs-0" : "pbs-4",
                            mobileNav && "pbe-[calc(5.5rem+env(safe-area-inset-bottom))] md:pbe-6",
                        )}
                    >
                        {children}
                    </main>
                ) : null}
            </div>

            {mobileNav}
        </div>
    );
}
