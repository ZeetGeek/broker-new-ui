import type { Metadata } from "next";

import { SavedPropertiesPage } from "@/features/properties/saved-properties/saved-properties-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <SavedPropertiesPage />;
}
