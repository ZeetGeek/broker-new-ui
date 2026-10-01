import { Suspense } from "react";
import type { Metadata } from "next";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { OwnerVisitsPage } from "@/features/owner-visits/owner-visits-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function OwnerVisitsFallback() {
    return (
        <div className="flex justify-center py-24">
            <LoadingSpinner label="Loading visits" />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<OwnerVisitsFallback />}>
            <OwnerVisitsPage />
        </Suspense>
    );
}
