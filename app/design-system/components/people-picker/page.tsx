import type { Metadata } from "next";

import { PeoplePickerThemePage } from "@/features/design-system/theme/people-picker-theme-page";

export const metadata: Metadata = {
    title: "People picker — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PeoplePickerThemePage />;
}
