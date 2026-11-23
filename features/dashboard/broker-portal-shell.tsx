"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api/profile";
import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";
import {
    BROKER_ADD_BUYER_HREF,
    BROKER_MY_DEALS_HREF,
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_PROPERTIES_NEW_HREF,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";
import type { ShortcutId } from "@/lib/shortcuts";

import { PortalHeader } from "@/components/layout/portal-header";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import {
    PortalSectionNavProvider,
    usePortalSectionNav,
} from "@/components/layout/portal-section-nav";
import { BROKER_SEARCH_HINTS } from "@/components/layout/search-placeholder-loop";
import { Building2, Calendar, CheckCircle2, UserPlus } from "@/components/shared/icons";
import { PersonDetailsProvider } from "@/components/shared/person-details-provider";
import { WorkflowHost, WorkflowProvider } from "@/components/shared/workflow-provider";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import { BROKER_MOBILE_PRIMARY_HREFS, BROKER_NAV_ITEMS } from "@/config/nav";
import { mapBrokerProfileMenuBroker } from "@/features/broker/map-profile-menu";
import { BrokerProfileMenu } from "@/features/broker/profile-menu";
import { ChatProvider } from "@/features/chat/chat-provider";
import { ShortcutsCheatsheet } from "@/features/shortcuts/shortcuts-cheatsheet";
import { useGlobalShortcuts } from "@/features/shortcuts/use-global-shortcuts";
import { TaskReminderListener } from "@/features/tasks/task-reminder-listener";
import { NotificationProvider } from "@/providers/notification-provider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/slices/dashboard-slice";

const BROKER_NOTIFICATIONS_HREF = "/broker/notifications";

const BROKER_SHORTCUT_ROUTES = {
    dashboard: "/broker/dashboard",
    ...(FEATURE_PLATFORM_OWNER
        ? { ownerListings: BROKER_OWNER_LISTINGS_HREF, deals: BROKER_MY_DEALS_HREF }
        : {}),
    yourListings: BROKER_YOUR_LISTINGS_HREF,
    pipeline: "/broker/pipeline",
    contacts: "/broker/contacts",
    visits: "/broker/visits",
    ...(FEATURE_PLATFORM_OWNER ? { referrals: "/broker/referrals" } : {}),
    notifications: BROKER_NOTIFICATIONS_HREF,
    profile: "/broker/profile",
};

const BROKER_HIDDEN_SHORTCUTS: ShortcutId[] = FEATURE_PLATFORM_OWNER
    ? ["settings"]
    : ["owner_listings", "my_deals", "referrals", "settings"];

export function BrokerPortalShell({ children }: { children: ReactNode }) {
    return (
        <PortalSectionNavProvider>
            <WorkflowProvider portal="broker">
                <PersonDetailsProvider portal="broker">
                    <BrokerPortalShellInner>{children}</BrokerPortalShellInner>
                    <WorkflowHost />
                </PersonDetailsProvider>
            </WorkflowProvider>
        </PortalSectionNavProvider>
    );
}

function BrokerPortalShellInner({ children }: { children: ReactNode }) {
    const sectionNav = usePortalSectionNav();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const cachedProfile = useAppSelector((state) => state.dashboard.profile);

    // The account header needs the server profile on every broker route, not
    // only after visiting Dashboard or Profile. Reuse the marketplace query
    // key so opening that route doesn't issue a second profile request.
    const profileQuery = useQuery({
        queryKey: ["owner-listings-profile", user?.id],
        queryFn: ({ signal }) => profileApi.get(signal),
        enabled: Boolean(user?.id) && !cachedProfile,
    });
    const profile = cachedProfile ?? profileQuery.data ?? null;

    useEffect(() => {
        if (!cachedProfile && profileQuery.data) dispatch(setProfile(profileQuery.data));
    }, [cachedProfile, dispatch, profileQuery.data]);

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
            <ChatProvider>
                <TaskReminderListener />
                <PortalHeader
                    navItems={BROKER_NAV_ITEMS}
                    notificationsHref={BROKER_NOTIFICATIONS_HREF}
                    sectionNav={sectionNav}
                    mobileIdentity={{
                        name: userName,
                        roleLabel: "Broker",
                        avatarUrl,
                        profileHref: "/broker/profile",
                    }}
                    mobileNav={
                        <PortalMobileNav
                            items={BROKER_NAV_ITEMS}
                            primaryHrefs={BROKER_MOBILE_PRIMARY_HREFS}
                            profileHref="/broker/profile"
                            centerAction={{
                                href: BROKER_ADD_BUYER_HREF,
                                label: "Add client",
                                actions: [
                                    {
                                        href: BROKER_ADD_BUYER_HREF,
                                        label: "Add client",
                                        icon: UserPlus,
                                    },
                                    {
                                        href: BROKER_PROPERTIES_NEW_HREF,
                                        label: "Add property",
                                        icon: Building2,
                                    },
                                    {
                                        href: "/broker/visits?view=schedule",
                                        label: "Site visit",
                                        icon: Calendar,
                                    },
                                    {
                                        href: "/broker/tasks?view=create",
                                        label: "Add task",
                                        icon: CheckCircle2,
                                    },
                                ],
                            }}
                        />
                    }
                    searchHints={BROKER_SEARCH_HINTS}
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
                <ShortcutsCheatsheet
                    open={isShortcutsOpen}
                    onOpenChange={setIsShortcutsOpen}
                    hiddenIds={BROKER_HIDDEN_SHORTCUTS}
                />
            </ChatProvider>
        </NotificationProvider>
    );
}
