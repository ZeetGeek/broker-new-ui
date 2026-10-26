import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { FEATURE_MARKETPLACE } from "@/config/index";

export default function Layout({ children }: { children: ReactNode }) {
    if (!FEATURE_MARKETPLACE) redirect("/broker/dashboard");
    return children;
}
