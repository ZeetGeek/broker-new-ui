import type { Metadata } from "next";

import { SwitchThemePage } from "@/features/design-system/theme/switch-theme-page";

export const metadata: Metadata = {
    title: "Switch — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <SwitchThemePage />;
}
