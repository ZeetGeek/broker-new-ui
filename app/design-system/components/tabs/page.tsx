import type { Metadata } from "next";

import { TabsThemePage } from "@/features/design-system/theme/tabs-theme-page";

export const metadata: Metadata = {
    title: "Tabs — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <TabsThemePage />;
}
