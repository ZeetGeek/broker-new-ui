import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";

import { OwnerPortalShell } from "@/features/dashboard/owner-portal-shell";

export default function OwnerLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <OwnerPortalShell>{children}</OwnerPortalShell>
        </AuthGuard>
    );
}
