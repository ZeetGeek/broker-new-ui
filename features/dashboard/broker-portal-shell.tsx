"use client";

import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { BrokerProfileMenu } from "@/features/broker/profile-menu";
import { mapBrokerProfileMenuBroker } from "@/features/broker/map-profile-menu";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";

import { BROKER_NAV_ITEMS } from "@/config/nav";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

export function BrokerPortalShell({ children }: { children: ReactNode }) {
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);

    const userName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Broker";
    const avatarUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
        authProvider: profile?.authProvider ?? user?.authProvider,
    });

    const broker = mapBrokerProfileMenuBroker(profile, userName);
    if (avatarUrl) {
        broker.avatarUrl = avatarUrl;
    }

    return (
        <NotificationProvider>
            <PortalHeader
                navItems={BROKER_NAV_ITEMS}
                notificationsHref="/broker/notifications"
                profileMenu={
                    <BrokerProfileMenu broker={broker} tooltipLabel="Account" />
                }
            >
                {children}
            </PortalHeader>
        </NotificationProvider>
    );
}
