import type { Metadata } from "next";

import { OverdueFollowUpsPage } from "@/features/dashboard/overdue-follow-ups-page";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
    return <OverdueFollowUpsPage />;
}
