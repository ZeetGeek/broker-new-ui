import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";

export default function Layout({ children }: { children: ReactNode }) {
    if (!FEATURE_PLATFORM_OWNER) redirect("/broker/dashboard");
    return children;
}
