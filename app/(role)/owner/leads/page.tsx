import type { Metadata } from "next";

import { OwnerLeadsPage } from "@/features/owner-leads/owner-leads-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerLeadsPage />;
}
