import type { Metadata } from "next";

import { RadioThemePage } from "@/features/design-system/theme/radio-theme-page";

export const metadata: Metadata = {
    title: "Radio — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <RadioThemePage />;
}
