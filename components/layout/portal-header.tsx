import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
    PortalMobileAppBar,
    type PortalMobileIdentity,
} from "@/components/layout/portal-mobile-app-bar";
import { PortalNav } from "@/components/layout/portal-nav";
import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
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

    return (
        <div data-portal-shell className="bg-surface-muted min-block-screen">
            <div data-portal-content className="overflow-x-hidden px-4 md:px-8">
                <header>
                    <TooltipProvider>
                        <PortalMobileAppBar
                            identity={mobileIdentity}
                            notificationsHref={notificationsHref}
                        />

                        <div
                            className="
                              hidden items-center justify-between gap-8 border-be border-border-warm
                              py-5 md:flex
                            "
                        >
                            <div className="flex min-inline-0 flex-1 items-center gap-10">
                                <Logo href={homeHref} />
                                <PortalNav items={navItems} />
                            </div>

                            <div className="flex shrink-0 items-center gap-4">
                                <PortalNotificationsMenu
                                    viewAllHref={notificationsHref}
                                    tooltipLabel="Notifications"
                                    triggerClassName="
                                      relative rounded-full border-0 bg-surface text-ink-muted shadow-sm
                                      hover:bg-surface-muted hover:text-ink-muted
                                      aria-expanded:bg-surface-muted aria-expanded:text-ink-muted
                                    "
                                />

                                <span
                                    aria-hidden
                                    className="block-7 inline-px shrink-0 bg-ink-subtle/30"
                                />

                                {profileMenu}
                            </div>
                        </div>
                    </TooltipProvider>

                    {sectionNav ? <div className="py-6">{sectionNav}</div> : null}
                </header>

                {children ? (
                    <main
                        className={cn(
                            // TEMP: keep page content hidden while the phone shell is in progress.
                            "hidden pbe-8",
                            sectionNav ? "pbs-0" : "pbs-6",
                            mobileNav && "pbe-[calc(6.5rem+env(safe-area-inset-bottom))] md:pbe-10",
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
