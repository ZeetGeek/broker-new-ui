import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FEATURE_SAVED_PROPERTIES } from "@/config";
import { SavedPropertiesPage } from "@/features/properties/saved-properties/saved-properties-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    if (!FEATURE_SAVED_PROPERTIES) redirect("/broker/my-listings");
    return <SavedPropertiesPage />;
}
