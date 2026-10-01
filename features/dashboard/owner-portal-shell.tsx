"use client";

import type { ReactNode } from "react";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";
import {
    OWNER_NOTIFICATIONS_HREF,
    OWNER_PROFILE_HREF,
    OWNER_REFERRALS_HREF,
} from "@/lib/routes/owner";

import { PortalHeader } from "@/components/layout/portal-header";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import {
    PortalSectionNavProvider,
    usePortalSectionNav,
} from "@/components/layout/portal-section-nav";

import { OWNER_NAV_ITEMS } from "@/config/nav";
import { ChatProvider } from "@/features/chat/chat-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

export function OwnerPortalShell({ children }: { children: ReactNode }) {
    return (
        <PortalSectionNavProvider>
            <OwnerPortalShellInner>{children}</OwnerPortalShellInner>
        </PortalSectionNavProvider>
    );
}

function OwnerPortalShellInner({ children }: { children: ReactNode }) {
    const sectionNav = usePortalSectionNav();
    const user = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);

    const userName =
        profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Owner";
    const avatarUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
        authProvider: profile?.authProvider ?? user?.authProvider,
    });

    return (
        <NotificationProvider>
            <ChatProvider>
                <PortalHeader
                    navItems={OWNER_NAV_ITEMS}
                    userName={userName}
                    userEmail={user?.email ?? undefined}
                    userAvatarUrl={avatarUrl}
                    notificationsHref={OWNER_NOTIFICATIONS_HREF}
                    profileHref={OWNER_PROFILE_HREF}
                    referralsHref={OWNER_REFERRALS_HREF}
                    roleLabel={profile?.accountLabel ?? user?.role ?? "Owner"}
                    orgName={profile?.orgName ?? user?.orgName ?? null}
                    sectionNav={sectionNav}
                    mobileNav={<PortalMobileNav items={OWNER_NAV_ITEMS} />}
                >
                    {children}
                </PortalHeader>
            </ChatProvider>
        </NotificationProvider>
    );
}
