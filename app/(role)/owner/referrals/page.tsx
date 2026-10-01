import type { Metadata } from "next";

import { ReferralsPage } from "@/features/referrals/referrals-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ReferralsPage />;
}
