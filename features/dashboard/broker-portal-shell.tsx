"use client";

import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { BROKER_NAV_ITEMS } from "@/config/nav";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

export function BrokerPortalShell({ children }: { children: ReactNode }) {
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);

    const userName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Broker";
    const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl ?? undefined;

    return (
        <NotificationProvider>
            <PortalHeader
                navItems={BROKER_NAV_ITEMS}
                userName={userName}
                userEmail={user?.email ?? profile?.email ?? undefined}
                userAvatarUrl={avatarUrl ?? undefined}
                notificationsHref="/broker/notifications"
                profileHref="/broker/profile"
                referralsHref="/broker/referrals"
                roleLabel={profile?.accountLabel ?? user?.role ?? "Broker"}
                orgName={profile?.orgName ?? user?.orgName ?? null}
            >
                {children}
            </PortalHeader>
        </NotificationProvider>
    );
}
