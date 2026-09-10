import { Suspense } from "react";
import type { Metadata } from "next";

import { OwnerListingsPage } from "@/features/properties/owner-listings/owner-listings-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={null}>
            <OwnerListingsPage />
        </Suspense>
    );
}
