import type { Metadata } from "next";

import { APP_NAME } from "@/config";
import { OwnerListingDetailPage } from "@/features/properties/owner-listings/owner-listing-detail-page";

export const metadata: Metadata = {
    title: `Property details | ${APP_NAME}`,
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerListingDetailPage />;
}
