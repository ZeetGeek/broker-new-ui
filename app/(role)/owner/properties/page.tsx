import { Suspense } from "react";
import type { Metadata } from "next";

import { MyListingsPageSkeleton } from "@/features/properties/your-listings/my-listings-skeleton";
import { MyListingsPanel } from "@/features/properties/your-listings/my-listings-panel";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<MyListingsPageSkeleton />}>
            <MyListingsPanel portal="owner" />
        </Suspense>
    );
}
