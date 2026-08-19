import type { Metadata } from "next";

import { InputThemePage } from "@/features/design-system/theme/input-theme-page";

export const metadata: Metadata = {
    title: "Input — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <InputThemePage />;
}
