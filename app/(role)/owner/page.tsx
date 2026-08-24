import type { Metadata } from "next";

import { PortalHeader } from "@/components/layout/portal-header";

import { OWNER_NAV_ITEMS } from "@/config/nav";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <PortalHeader navItems={OWNER_NAV_ITEMS} activeHref="/owner" userName="Jeet Patel">
            <h1 className="display-md">Owner</h1>
        </PortalHeader>
    );
}
