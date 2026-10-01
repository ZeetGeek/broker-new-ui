import { Suspense } from "react";
import type { Metadata } from "next";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { OwnerRequestsPage } from "@/features/owner-requests/owner-requests-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function OwnerRequestsFallback() {
    return (
        <div className="flex justify-center py-24">
            <LoadingSpinner label="Loading requests" />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<OwnerRequestsFallback />}>
            <OwnerRequestsPage />
        </Suspense>
    );
}
