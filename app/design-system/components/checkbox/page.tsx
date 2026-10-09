import type { Metadata } from "next";

import { CheckboxThemePage } from "@/features/design-system/theme/checkbox-theme-page";

export const metadata: Metadata = {
    title: "Checkbox — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <CheckboxThemePage />;
}
