import { Suspense } from "react";
import type { Metadata } from "next";

import { EarningsPage } from "@/features/earnings/earnings-page";
import { EarningsPageSkeleton } from "@/features/earnings/earnings-skeleton";

export const metadata: Metadata = {
    title: "Earnings",
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<EarningsPageSkeleton />}>
            <EarningsPage />
        </Suspense>
    );
}
