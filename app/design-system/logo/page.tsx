import type { Metadata } from "next";

import { LogoThemePage } from "@/features/design-system/theme/logo-theme-page";

export const metadata: Metadata = {
    title: "Logo — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <LogoThemePage />;
}
