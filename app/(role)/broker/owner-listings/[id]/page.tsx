import type { Metadata } from "next";

import { OwnerListingDetailPage } from "@/features/properties/owner-listings/owner-listing-detail-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerListingDetailPage />;
}
