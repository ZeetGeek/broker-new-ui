import type { Metadata } from "next";

import { AttachmentThemePage } from "@/features/design-system/theme/attachment-theme-page";

export const metadata: Metadata = {
    title: "Attachment — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <AttachmentThemePage />;
}
