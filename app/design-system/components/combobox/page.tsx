import type { Metadata } from "next";

import { ComboboxThemePage } from "@/features/design-system/theme/combobox-theme-page";

export const metadata: Metadata = {
    title: "Combobox — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ComboboxThemePage />;
}
