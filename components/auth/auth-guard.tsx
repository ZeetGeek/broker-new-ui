"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

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
            <div
                className="bg-canvas p-4 min-block-screen md:p-8"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <span className="sr-only">Loading your account</span>
                <div className="mx-auto space-y-6 max-inline-[1280px]">
                    <div className="
                      animate-pulse rounded-card bg-surface-muted block-16 inline-full
                    " />
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="
                      animate-pulse rounded-inner bg-surface-muted block-16
                    " />)}</div>
                    <div className="
                      animate-pulse rounded-card bg-surface-muted block-72 inline-full
                    " />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
