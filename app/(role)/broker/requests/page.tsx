import { redirect } from "next/navigation";

import { BROKER_MY_DEALS_HREF } from "@/lib/routes/broker";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const href = tab ? `${BROKER_MY_DEALS_HREF}?tab=${tab}` : BROKER_MY_DEALS_HREF;

    redirect(href);
}
