import type { Metadata } from "next";

import { ShadowThemePage } from "@/features/design-system/theme/shadow-theme-page";

export const metadata: Metadata = {
    title: "Shadows — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ShadowThemePage />;
}
