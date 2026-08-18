import type { Metadata } from "next";

import { ButtonThemePage } from "@/features/design-system/theme/button-theme-page";

export const metadata: Metadata = {
    title: "Button — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ButtonThemePage />;
}
