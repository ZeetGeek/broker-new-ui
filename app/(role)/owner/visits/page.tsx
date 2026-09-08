import type { Metadata } from "next";

import { VisitsPage } from "@/features/site-visits/visits-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <VisitsPage viewer="owner" />;
}
