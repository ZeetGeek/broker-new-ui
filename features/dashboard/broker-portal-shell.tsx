"use client";

import { type ReactNode,useCallback, useState } from "react";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";
import {
    BROKER_MY_REQUESTS_HREF,
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";

import { PortalHeader } from "@/components/layout/portal-header";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import {
    PortalSectionNavProvider,
    usePortalSectionNav,
} from "@/components/layout/portal-section-nav";

import { BROKER_NAV_ITEMS } from "@/config/nav";
import { mapBrokerProfileMenuBroker } from "@/features/broker/map-profile-menu";
import { BrokerProfileMenu } from "@/features/broker/profile-menu";
import { ShortcutsCheatsheet } from "@/features/shortcuts/shortcuts-cheatsheet";
import { useGlobalShortcuts } from "@/features/shortcuts/use-global-shortcuts";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

const BROKER_NOTIFICATIONS_HREF = "/broker/notifications";

const BROKER_SHORTCUT_ROUTES = {
    dashboard: "/broker/dashboard",
    ownerListings: BROKER_OWNER_LISTINGS_HREF,
    myRequests: BROKER_MY_REQUESTS_HREF,
    yourListings: BROKER_YOUR_LISTINGS_HREF,
    clients: "/broker/clients",
    visits: "/broker/visits",
    referrals: "/broker/referrals",
    notifications: BROKER_NOTIFICATIONS_HREF,
    profile: "/broker/profile",
    settings: "/broker/settings",
};

export function BrokerPortalShell({ children }: { children: ReactNode }) {
    return (
        <PortalSectionNavProvider>
            <BrokerPortalShellInner>{children}</BrokerPortalShellInner>
        </PortalSectionNavProvider>
    );
}

function BrokerPortalShellInner({ children }: { children: ReactNode }) {
    const sectionNav = usePortalSectionNav();
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);

    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const handleShortcutsOpen = useCallback(() => setIsShortcutsOpen(true), []);
    const handleLogoutFocus = useCallback(() => setIsProfileMenuOpen(true), []);

    useGlobalShortcuts({
        routes: BROKER_SHORTCUT_ROUTES,
        onShortcutsOpen: handleShortcutsOpen,
        onLogoutFocus: handleLogoutFocus,
    });

    const userName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Broker";
    const avatarUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
        authProvider: profile?.authProvider ?? user?.authProvider,
    });

    const broker = mapBrokerProfileMenuBroker(
        profile,
        userName,
        user?.email ?? profile?.email ?? undefined,
    );
    if (avatarUrl) {
        broker.avatarUrl = avatarUrl;
    }

    return (
        <NotificationProvider>
            <PortalHeader
                navItems={BROKER_NAV_ITEMS}
                notificationsHref={BROKER_NOTIFICATIONS_HREF}
                sectionNav={sectionNav}
                mobileNav={<PortalMobileNav items={BROKER_NAV_ITEMS} />}
                profileMenu={
                    <BrokerProfileMenu
                        broker={broker}
                        tooltipLabel="Account"
                        onShortcutsOpen={handleShortcutsOpen}
                        open={isProfileMenuOpen}
                        onOpenChange={setIsProfileMenuOpen}
                    />
                }
            >
                {children}
            </PortalHeader>
            <ShortcutsCheatsheet open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
        </NotificationProvider>
    );
}
