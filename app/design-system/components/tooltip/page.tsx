import type { Metadata } from "next";

import { TooltipThemePage } from "@/features/design-system/theme/tooltip-theme-page";

export const metadata: Metadata = {
    title: "Tooltip — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <TooltipThemePage />;
}
