import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { BROKER_NAV_ITEMS } from "@/config/nav";

export default function BrokerLayout({ children }: { children: ReactNode }) {
    return (
        <PortalHeader
            navItems={BROKER_NAV_ITEMS}
            userName="Jeet Patel"
            notificationsHref="/broker/notifications"
            profileHref="/broker/profile"
        >
            {children}
        </PortalHeader>
    );
}
