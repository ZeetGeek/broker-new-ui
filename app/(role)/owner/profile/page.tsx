import type { Metadata } from "next";

import { ProfilePage } from "@/features/profile/profile-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ProfilePage />;
}
