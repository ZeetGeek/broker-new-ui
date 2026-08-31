"use client";

import { useCallback, useState, type ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { BrokerProfileMenu } from "@/features/broker/profile-menu";
import { mapBrokerProfileMenuBroker } from "@/features/broker/map-profile-menu";
import { ShortcutsCheatsheet } from "@/features/shortcuts/shortcuts-cheatsheet";
import { useGlobalShortcuts } from "@/features/shortcuts/use-global-shortcuts";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";

import { BROKER_NAV_ITEMS } from "@/config/nav";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

const BROKER_SHORTCUT_ROUTES = {
    dashboard: "/broker/dashboard",
    properties: "/broker/properties",
    clients: "/broker/clients",
    visits: "/broker/visits",
    referrals: "/broker/referrals",
    profile: "/broker/profile",
    settings: "/broker/settings",
};

export function BrokerPortalShell({ children }: { children: ReactNode }) {
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
                notificationsHref="/broker/notifications"
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
