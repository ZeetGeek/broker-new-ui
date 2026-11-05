import { Suspense } from "react";
import type { Metadata } from "next";

import { NewSiteVisitsPage } from "@/features/new-site-visits/new-site-visits-page";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
    return (
        <Suspense fallback={<p role="status">Loading site visits…</p>}>
            <NewSiteVisitsPage />
        </Suspense>
    );
}
