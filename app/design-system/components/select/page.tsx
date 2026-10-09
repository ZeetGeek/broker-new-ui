import type { Metadata } from "next";

import { SelectThemePage } from "@/features/design-system/theme/select-theme-page";

export const metadata: Metadata = {
    title: "Select — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <SelectThemePage />;
}
