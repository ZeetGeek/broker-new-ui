import type { ReactElement, ReactNode } from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { PortalNav } from "@/components/layout/portal-nav";
import { PortalNotificationsMenu } from "@/components/layout/portal-notifications-menu";
import { PortalProfileMenu } from "@/components/layout/portal-profile-menu";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { NavItem } from "@/config/nav";

export type PortalHeaderProps = {
    navItems: NavItem[];
    userName?: string;
    userEmail?: string;
    userAvatarUrl?: string;
    notificationsHref: string;
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
    userName = "User",
    userEmail,
    userAvatarUrl,
    notificationsHref,
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
                                              md:justify-start md:gap-2 md:px-4 md:inline-auto
                                            `,
                                        )}
                                    >
                                        <Search aria-hidden="true" />
                                        <span className="body-sm hidden font-medium md:inline">
                                            Search
                                        </span>
                                        <Kbd
                                            className="
                                              ms-2 -me-1 hidden
                                              group-hover:text-ink
                                              md:inline-flex
                                            "
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
                            </div>
                        </TooltipProvider>
                    </div>
                </header>

                {children ? <main className="py-6">{children}</main> : null}
            </div>
        </div>
    );
}
