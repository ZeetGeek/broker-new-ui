import type { Metadata } from "next";

import { TypographyThemePage } from "@/features/design-system/theme/typography-theme-page";

export const metadata: Metadata = {
    title: "Typography — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <TypographyThemePage />;
}
