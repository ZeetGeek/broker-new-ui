import type { Metadata } from "next";

import { ToastThemePage } from "@/features/design-system/theme/toast-theme-page";

export const metadata: Metadata = {
    title: "Toasts — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <ToastThemePage />;
}
