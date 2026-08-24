import type { Metadata } from "next";

import { BrokerDashboard } from "@/features/dashboard/broker-dashboard";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <BrokerDashboard />;
}
