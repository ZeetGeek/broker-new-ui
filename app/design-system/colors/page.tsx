import type { Metadata } from "next";

import { ColorThemePage } from "@/features/design-system/theme/color-theme-page";

export const metadata: Metadata = {
    title: "Colors — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ColorThemePage />;
}
