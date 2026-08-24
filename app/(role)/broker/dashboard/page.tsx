import type { Metadata } from "next";

import { BrokerDashboardSummary } from "@/features/dashboard/broker-dashboard-summary";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="h1">
                    <span className="text-ink">Tuesday.</span>{" "}
                    <span className="text-ink-muted">2 site visits, 3 requests waiting.</span>
                </h1>
            </div>

            <BrokerDashboardSummary />
        </div>
    );
}
