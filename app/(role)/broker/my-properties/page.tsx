import { redirect } from "next/navigation";

import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const href = tab ? `${BROKER_YOUR_LISTINGS_HREF}?tab=${tab}` : BROKER_YOUR_LISTINGS_HREF;

    redirect(href);
}
