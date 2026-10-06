import { Suspense } from "react";
import type { Metadata } from "next";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { OwnerBrokersPage } from "@/features/owner-brokers/owner-brokers-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function OwnerBrokersFallback() {
    return (
        <div className="flex justify-center py-24">
            <LoadingSpinner label="Loading brokers" />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<OwnerBrokersFallback />}>
            <OwnerBrokersPage />
        </Suspense>
    );
}
