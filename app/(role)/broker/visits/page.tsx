import { Suspense } from "react";
import type { Metadata } from "next";

import { BrokerSiteVisitsPage } from "@/features/site-visits/broker/broker-site-visits-page";
import { VisitsPageSkeleton } from "@/features/site-visits/broker/visits-page-skeleton";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<VisitsPageSkeleton />}>
            <BrokerSiteVisitsPage />
        </Suspense>
    );
}
