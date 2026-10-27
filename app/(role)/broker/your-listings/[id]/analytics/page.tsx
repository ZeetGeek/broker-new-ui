import type { Metadata } from "next";

import { PropertyAnalyticsPage } from "@/features/properties/property-analytics/property-analytics-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PropertyAnalyticsPage />;
}
