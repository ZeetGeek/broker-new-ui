import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { BROKER_NAV_ITEMS } from "@/config/nav";

export default function BrokerLayout({ children }: { children: ReactNode }) {
    return (
        <PortalHeader
            navItems={BROKER_NAV_ITEMS}
            userName="Zeet Patel"
            notificationsHref="/broker/notifications"
            profileHref="/broker/profile"
            unreadCount={3}
        >
            {children}
        </PortalHeader>
    );
}
