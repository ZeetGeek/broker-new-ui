import type { ReactElement, ReactNode } from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { PortalNav } from "@/components/layout/portal-nav";
import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
import { PortalProfileMenu } from "@/components/layout/portal-profile-menu";
import { SearchPlaceholderLoop } from "@/components/layout/search-placeholder-loop";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
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
                <header className="border-be border-border-warm">
                    <div className="flex items-center justify-between gap-8 py-5">
                        <div className="flex flex-1 items-center gap-10 min-inline-0">
                            <Logo href={homeHref} />
                            <PortalNav items={navItems} />
                        </div>

                        <TooltipProvider>
                            <div className="flex shrink-0 items-center gap-4">
                                <HeaderTooltip label="Find properties, clients, and visits">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-md"
                                        aria-label="Search"
                                        className={cn(
                                            headerControlClass,
                                            `
                                              group border! text-ink-muted
                                              group-hover:text-ink
                                              md:justify-start md:gap-2 md:px-4 md:inline-auto md:min-w-64
                                            `,
                                        )}
                                    >
                                        <Search aria-hidden="true" />
                                        <span aria-hidden="true" className="hidden overflow-hidden md:inline-flex">
                                            <SearchPlaceholderLoop />
                                        </span>
                                        <Kbd
                                            variant="surface"
                                            className="hidden md:ms-auto md:me-0 md:inline-flex"
                                        >
                                            Ctrl + K
                                        </Kbd>
                                    </Button>
                                </HeaderTooltip>

                                <PortalNotificationsMenu
                                    viewAllHref={notificationsHref}
                                    tooltipLabel="Notifications"
                                    triggerClassName={cn(
                                        headerControlClass,
                                        "relative border! text-ink-muted hover:text-ink",
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

                    {sectionNav ? (
                        <div className="border-be border-border-warm">{sectionNav}</div>
                    ) : null}
                </header>

                {children ? (
                    <main
                        className={cn(
                            "py-6",
                            mobileNav &&
                                "pbe-[calc(5.5rem+env(safe-area-inset-bottom))] md:pbe-6",
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
