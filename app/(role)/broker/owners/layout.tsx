import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { BROKER_CONTACTS_HREF } from "@/lib/routes/broker";

import { FEATURE_PLATFORM_OWNER } from "@/config";

/** Platform owner profiles are separate from the broker's offline owner contacts. */
export default function Layout({ children }: { children: ReactNode }) {
    if (!FEATURE_PLATFORM_OWNER) redirect(BROKER_CONTACTS_HREF);
    return children;
}
