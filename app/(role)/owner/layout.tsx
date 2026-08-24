import type { ReactNode } from "react";

import { PortalHeader } from "@/components/layout/portal-header";

import { OWNER_NAV_ITEMS } from "@/config/nav";

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <PortalHeader navItems={OWNER_NAV_ITEMS} userName="Jeet Patel">
            {children}
        </PortalHeader>
    );
}
