"use client";

import { type ReactNode, useCallback, useState } from "react";

import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";
import {
    OWNER_BROKERS_HREF,
    OWNER_LEADS_HREF,
    OWNER_NOTIFICATIONS_HREF,
    OWNER_OVERVIEW_HREF,
    OWNER_PROFILE_HREF,
    OWNER_PROPERTIES_HREF,
    OWNER_REFERRALS_HREF,
    OWNER_REQUESTS_HREF,
    OWNER_VISITS_HREF,
} from "@/lib/routes/owner";

import { PortalHeader } from "@/components/layout/portal-header";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import {
    PortalSectionNavProvider,
    usePortalSectionNav,
} from "@/components/layout/portal-section-nav";
import { OWNER_SEARCH_HINTS } from "@/components/layout/search-placeholder-loop";

import { OWNER_NAV_ITEMS } from "@/config/nav";
import { ChatProvider } from "@/features/chat/chat-provider";
import { OwnerProfileMenu } from "@/features/dashboard/owner-profile-menu";
import { ShortcutsCheatsheet } from "@/features/shortcuts/shortcuts-cheatsheet";
import { useGlobalShortcuts } from "@/features/shortcuts/use-global-shortcuts";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

const OWNER_SHORTCUT_ROUTES = {
    dashboard: OWNER_OVERVIEW_HREF,
    ownerListings: OWNER_BROKERS_HREF,
    deals: OWNER_REQUESTS_HREF,
    yourListings: OWNER_PROPERTIES_HREF,
    pipeline: OWNER_REQUESTS_HREF,
    contacts: OWNER_LEADS_HREF,
    visits: OWNER_VISITS_HREF,
    referrals: OWNER_REFERRALS_HREF,
    notifications: OWNER_NOTIFICATIONS_HREF,
    profile: OWNER_PROFILE_HREF,
    settings: OWNER_PROFILE_HREF,
};

/** Never surface raw account_type enums in the UI. */
function resolveOwnerAccountStatusLabel(
    accountLabel?: string | null,
    accountType?: string | null,
    orgName?: string | null,
): string {
    const label = accountLabel?.trim();
    if (label && !/^(individual|organization)$/i.test(label)) {
        return label;
    }

    const type = accountType?.trim().toLowerCase();
    if (type === "organization" || /^organization$/i.test(label ?? "")) {
        return orgName?.trim() || "Organization";
    }

    return "Independent";
}

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

    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const handleShortcutsOpen = useCallback(() => setIsShortcutsOpen(true), []);
    const handleLogoutFocus = useCallback(() => setIsProfileMenuOpen(true), []);

    useGlobalShortcuts({
        routes: OWNER_SHORTCUT_ROUTES,
        onShortcutsOpen: handleShortcutsOpen,
        onLogoutFocus: handleLogoutFocus,
    });

    const userName = profile?.fullName?.trim() || user?.fullName?.trim() || user?.email || "Owner";
    const avatarUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
        authProvider: profile?.authProvider ?? user?.authProvider,
    });
    const accountStatusLabel = resolveOwnerAccountStatusLabel(
        profile?.accountLabel,
        profile?.accountType ?? user?.accountType,
        profile?.orgName ?? user?.orgName,
    );

    return (
        <NotificationProvider>
            <ChatProvider>
                <PortalHeader
                    navItems={OWNER_NAV_ITEMS}
                    notificationsHref={OWNER_NOTIFICATIONS_HREF}
                    sectionNav={sectionNav}
                    mobileNav={<PortalMobileNav items={OWNER_NAV_ITEMS} />}
                    searchHints={OWNER_SEARCH_HINTS}
                    profileMenu={
                        <OwnerProfileMenu
                            userName={userName}
                            userAvatarUrl={avatarUrl}
                            accountStatusLabel={accountStatusLabel}
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
            </ChatProvider>
        </NotificationProvider>
    );
}
