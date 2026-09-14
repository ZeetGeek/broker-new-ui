import type { Metadata } from "next";

import { AvatarThemePage } from "@/features/design-system/theme/avatar-theme-page";

export const metadata: Metadata = {
    title: "Avatar — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <AvatarThemePage />;
}
