"use client";

import type { ReactNode } from "react";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";

import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalHeader } from "@/components/layout/portal-header";

import { OWNER_NAV_ITEMS } from "@/config/nav";
import { ChatProvider } from "@/features/chat/chat-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

function OwnerPortalShell({ children }: { children: ReactNode }) {
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);
    const userName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Owner";
    const avatarUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
        authProvider: user?.authProvider,
    });

    return (
        <NotificationProvider>
            <ChatProvider>
                <PortalHeader
                    navItems={OWNER_NAV_ITEMS}
                    userName={userName}
                    userEmail={user?.email ?? undefined}
                    userAvatarUrl={avatarUrl}
                    notificationsHref="/owner/notifications"
                    profileHref="/owner/profile"
                    roleLabel={profile?.accountLabel ?? user?.role ?? "Owner"}
                    orgName={profile?.orgName ?? user?.orgName ?? null}
                >
                    {children}
                </PortalHeader>
            </ChatProvider>
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
