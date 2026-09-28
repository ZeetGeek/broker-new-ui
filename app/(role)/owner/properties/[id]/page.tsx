import type { Metadata } from "next";

import { PropertyDetailPage } from "@/features/properties/property-detail/property-detail-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PropertyDetailPage portal="owner" />;
}
