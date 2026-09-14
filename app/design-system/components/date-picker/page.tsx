import type { Metadata } from "next";

import { DatePickerThemePage } from "@/features/design-system/theme/date-picker-theme-page";

export const metadata: Metadata = {
    title: "Date picker — Design system",
    robots: { index: false, follow: false },
};

export default function Page() {
    return <DatePickerThemePage />;
}
