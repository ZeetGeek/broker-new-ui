import { redirect } from "next/navigation";

import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";

export default function Page() {
    redirect(BROKER_OWNER_LISTINGS_HREF);
}
