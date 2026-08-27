import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";

import { BrokerPortalShell } from "@/features/dashboard/broker-portal-shell";

export default function BrokerLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <BrokerPortalShell>{children}</BrokerPortalShell>
        </AuthGuard>
    );
}
