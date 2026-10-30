import { Suspense } from "react";
import type { Metadata } from "next";

import { APP_NAME } from "@/config";
import { OwnerListingsPage } from "@/features/properties/owner-listings/owner-listings-page";
import { OwnerListingsPageSkeleton } from "@/features/properties/owner-listings/owner-listings-skeleton";

export const metadata: Metadata = {
    title: `Marketplace | ${APP_NAME}`,
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<OwnerListingsPageSkeleton />}>
            <OwnerListingsPage />
        </Suspense>
    );
}
