import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PortalHeaderSearch } from "@/components/layout/portal-header-search";
import { PortalNav } from "@/components/layout/portal-nav";
import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
import { PortalProfileMenu } from "@/components/layout/portal-profile-menu";
import { Logo } from "@/components/shared/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { NavItem } from "@/config/nav";

export type PortalHeaderProps = {
    navItems: NavItem[];
    notificationsHref: string;
    /** Optional row below the main header bar — e.g. Browse / Mine on properties pages. */
    sectionNav?: ReactNode;
    /** Fixed bottom nav on mobile. Adds scroll padding when set. */
    mobileNav?: ReactNode;
    /** When set, replaces the default portal profile menu (e.g. broker profile dropdown). */
    profileMenu?: ReactNode;
    userName?: string;
    userEmail?: string;
    userAvatarUrl?: string;
    profileHref?: string;
    referralsHref?: string;
    roleLabel?: string;
    orgName?: string | null;
    children?: ReactNode;
};

const headerControlClass = `
  border-2 border-border-warm bg-surface!
  hover:border-ink-subtle
`;

function HeaderTooltip({
    label,
    shortcut,
    children,
}: {
    label: string;
    shortcut?: ReactNode;
    children: ReactElement;
}) {
    return (
        <Tooltip>
            <TooltipTrigger render={children} />
            <TooltipContent side="bottom">
                {label}
                {shortcut}
            </TooltipContent>
        </Tooltip>
    );
}

export function PortalHeader({
    navItems,
    notificationsHref,
    sectionNav,
    mobileNav,
    profileMenu,
    userName = "User",
    userEmail,
    userAvatarUrl,
    profileHref = "#",
    referralsHref,
    roleLabel,
    orgName,
    children,
}: PortalHeaderProps) {
    const homeHref = navItems[0]?.href ?? "/";

    return (
        <div className="bg-surface-muted min-block-screen">
            <div className="overflow-x-hidden px-4 md:px-8">
                <header>
                    <div
                        className="
                          flex items-center justify-between gap-8 border-be border-border-warm py-5
                        "
                    >
                        <div className="flex flex-1 items-center gap-10 min-inline-0">
                            <Logo href={homeHref} />
                            <PortalNav items={navItems} />
                        </div>

                        <TooltipProvider>
                            <div className="flex shrink-0 items-center gap-4">
                                <HeaderTooltip label="Find properties, clients, and visits">
                                    <PortalHeaderSearch
                                        className={cn(
                                            headerControlClass,
                                            `
                                              border! text-ink-muted
                                              hover:bg-transparent hover:text-ink-muted
                                              md:justify-start md:gap-2 md:px-4 md:inline-auto
                                              md:min-inline-64
                                            `,
                                        )}
                                    />
                                </HeaderTooltip>

                                <PortalNotificationsMenu
                                    viewAllHref={notificationsHref}
                                    tooltipLabel="Notifications"
                                    triggerClassName={cn(
                                        headerControlClass,
                                        `
                                          relative border! text-ink-muted
                                          hover:bg-transparent hover:text-ink-muted
                                        `,
                                    )}
                                />

                                {profileMenu ?? (
                                    <PortalProfileMenu
                                        userName={userName}
                                        userEmail={userEmail}
                                        userAvatarUrl={userAvatarUrl}
                                        profileHref={profileHref}
                                        referralsHref={referralsHref}
                                        notificationsHref={notificationsHref}
                                        roleLabel={roleLabel}
                                        orgName={orgName}
                                        tooltipLabel="Account"
                                    />
                                )}
                            </div>
                        </TooltipProvider>
                    </div>

                    {sectionNav ? <div className="py-6">{sectionNav}</div> : null}
                </header>

                {children ? (
                    <main
                        className={cn(
                            "pbe-8",
                            sectionNav ? "pbs-0" : "pbs-6",
                            mobileNav && "pbe-[calc(6rem+env(safe-area-inset-bottom))] md:pbe-10",
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
