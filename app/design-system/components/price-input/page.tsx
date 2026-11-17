import type { Metadata } from "next";

import { PriceInputThemePage } from "@/features/design-system/theme/price-input-theme-page";

export const metadata: Metadata = {
    title: "Smart price input — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PriceInputThemePage />;
}
