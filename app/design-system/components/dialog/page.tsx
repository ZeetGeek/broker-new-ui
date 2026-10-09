import type { Metadata } from "next";

import { DialogThemePage } from "@/features/design-system/theme/dialog-theme-page";

export const metadata: Metadata = {
    title: "Dialog — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <DialogThemePage />;
}
