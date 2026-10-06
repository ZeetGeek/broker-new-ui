import type { Metadata } from "next";

import { OwnerDashboard } from "@/features/dashboard/owner-dashboard";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerDashboard />;
}
