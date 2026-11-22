import type { Metadata } from "next";

import { PropertyPickerThemePage } from "@/features/design-system/theme/property-picker-theme-page";

export const metadata: Metadata = {
    title: "Property picker — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PropertyPickerThemePage />;
}
