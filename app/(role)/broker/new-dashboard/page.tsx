import type { Metadata } from "next";

import { NewBrokerDashboard } from "@/features/new-dashboard/new-broker-dashboard";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <NewBrokerDashboard />;
}
