import type { Metadata } from "next";

import { PortalHeader } from "@/components/layout/portal-header";

import { BROKER_NAV_ITEMS } from "@/config/nav";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <PortalHeader
                navItems={BROKER_NAV_ITEMS}
                activeHref="/broker/listings"
                userName="Jeet Patel"
            />
            <h1 className="display-md">Broker</h1>
        </>
    );
}
