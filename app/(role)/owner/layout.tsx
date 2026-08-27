"use client";

import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalHeader } from "@/components/layout/portal-header";

import { OWNER_NAV_ITEMS } from "@/config/nav";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

function OwnerPortalShell({ children }: { children: ReactNode }) {
    const user = useAppSelector((state) => state.auth.user);
    const userName = user?.fullName?.trim() || user?.email || "Owner";

    return (
        <NotificationProvider>
            <PortalHeader
                navItems={OWNER_NAV_ITEMS}
                userName={userName}
                userEmail={user?.email ?? undefined}
                userAvatarUrl={user?.avatarUrl ?? undefined}
                notificationsHref="/owner/notifications"
                profileHref="/owner"
                roleLabel={user?.role ?? "Owner"}
                orgName={user?.orgName ?? null}
            >
                {children}
            </PortalHeader>
        </NotificationProvider>
    );
}

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <OwnerPortalShell>{children}</OwnerPortalShell>
        </AuthGuard>
    );
}
