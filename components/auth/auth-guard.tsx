"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { useAppSelector } from "@/store/hooks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, accessToken, hydrated } = useAppSelector((state) => state.auth);
    const isAuthenticated = Boolean(accessToken && user);

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            const next = pathname && pathname !== "/" ? pathname : "/broker/dashboard";
            router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
    }, [hydrated, isAuthenticated, router, pathname]);

    if (!hydrated || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center bg-surface-muted min-block-screen">
                <LoadingSpinner />
            </div>
        );
    }

    return <>{children}</>;
}
