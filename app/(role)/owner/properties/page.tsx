import { Suspense } from "react";
import type { Metadata } from "next";

import { MyListingsPanel } from "@/features/properties/your-listings/my-listings-panel";
import { MyListingsPageSkeleton } from "@/features/properties/your-listings/my-listings-skeleton";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<MyListingsPageSkeleton portal="owner" />}>
            <MyListingsPanel portal="owner" />
        </Suspense>
    );
}
