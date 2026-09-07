import type { Metadata } from "next";

import { PropertyEditPage } from "@/features/properties/property-form/property-edit-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PropertyEditPage />;
}
