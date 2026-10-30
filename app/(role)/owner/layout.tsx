import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isOwnerUnavailable, OWNER_UNAVAILABLE_HREF } from "@/lib/auth/launch-policy";

import { AuthGuard } from "@/components/auth/auth-guard";

import { OwnerPortalShell } from "@/features/dashboard/owner-portal-shell";

export default function OwnerLayout({ children }: { children: ReactNode }) {
    if (isOwnerUnavailable("owner")) redirect(OWNER_UNAVAILABLE_HREF);

    return (
        <AuthGuard portal="owner">
            <OwnerPortalShell>{children}</OwnerPortalShell>
        </AuthGuard>
    );
}
