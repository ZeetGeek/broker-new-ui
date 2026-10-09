import type { Metadata } from "next";

import { CardThemePage } from "@/features/design-system/theme/card-theme-page";

export const metadata: Metadata = {
    title: "Card — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <CardThemePage />;
}
