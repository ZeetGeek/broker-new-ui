import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { brokerPropertyAnalyticsHref } from "@/lib/routes/broker";

export const metadata: Metadata = {
    title: "Listing analytics",
    robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(brokerPropertyAnalyticsHref(id));
}
