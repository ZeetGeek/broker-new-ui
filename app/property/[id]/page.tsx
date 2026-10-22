import type { Metadata } from "next";

import { APP_NAME } from "@/config";
import { PublicPropertyPage } from "@/features/properties/public-property/public-property-page";

export const metadata: Metadata = {
    title: `Property details | ${APP_NAME}`,
};

/** Public (no login) page behind shared property links. */
export default function Page() {
    return <PublicPropertyPage />;
}
