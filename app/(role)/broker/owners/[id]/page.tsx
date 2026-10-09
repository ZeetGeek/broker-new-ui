import type { Metadata } from "next";

import { OwnerProfilePage } from "@/features/owners/owner-profile-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerProfilePage />;
}
