import type { Metadata } from "next";

import { PropertyForm } from "@/features/properties/property-form";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <div className="py-2">
            <PropertyForm mode="create" />
        </div>
    );
}
