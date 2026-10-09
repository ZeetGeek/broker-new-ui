import type { Metadata } from "next";

import { BadgeThemePage } from "@/features/design-system/theme/badge-theme-page";

export const metadata: Metadata = {
    title: "Badges — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <BadgeThemePage />;
}
