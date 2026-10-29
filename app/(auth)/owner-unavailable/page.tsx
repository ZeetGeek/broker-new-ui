import type { Metadata } from "next";

import { OwnerUnavailablePanel } from "@/features/auth/owner-unavailable-panel";

export const metadata: Metadata = {
    title: "Owner accounts unavailable",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <OwnerUnavailablePanel />;
}
