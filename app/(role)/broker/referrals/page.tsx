import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { ReferralsPage } from "@/features/referrals/referrals-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    if (!FEATURE_PLATFORM_OWNER) redirect("/broker/dashboard");
    return <ReferralsPage />;
}
