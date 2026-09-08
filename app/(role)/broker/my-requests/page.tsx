import { Suspense } from "react";
import type { Metadata } from "next";

import { MyRequestsPage } from "@/features/properties/my-requests/my-requests-page";
import { RequestsPageSkeleton } from "@/features/properties/my-requests/requests-skeleton";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<RequestsPageSkeleton />}>
            <MyRequestsPage />
        </Suspense>
    );
}
