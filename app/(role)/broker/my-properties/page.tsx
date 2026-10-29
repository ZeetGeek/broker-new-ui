import { redirect } from "next/navigation";

import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

import { FEATURE_PLATFORM_OWNER } from "@/config";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const href =
        tab && (FEATURE_PLATFORM_OWNER || tab !== "requests")
            ? `${BROKER_YOUR_LISTINGS_HREF}?tab=${encodeURIComponent(tab)}`
            : BROKER_YOUR_LISTINGS_HREF;

    redirect(href);
}
