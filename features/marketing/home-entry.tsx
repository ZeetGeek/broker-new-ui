"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { portalHomeForRole } from "@/lib/auth/session";

import { useAppSelector } from "@/store/hooks";

/**
 * Root `/` gate: logged-in brokers/owners go to their portal home;
 * everyone else sees the landing page (children).
 */
export function HomeEntry({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { user, accessToken, hydrated } = useAppSelector((state) => state.auth);
    const isAuthenticated = Boolean(accessToken && user);

    useEffect(() => {
        if (!hydrated || !isAuthenticated) return;
        router.replace(portalHomeForRole(user.role));
    }, [hydrated, isAuthenticated, router, user]);

    if (!hydrated || isAuthenticated) {
        return (
            <div
                className="flex items-center justify-center rounded-card bg-surface block-full"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <span className="sr-only">
                    {isAuthenticated ? "Opening your dashboard" : "Loading"}
                </span>
                <div
                    className="animate-pulse rounded-inner bg-surface-muted block-10 inline-40"
                    aria-hidden
                />
            </div>
        );
    }

    return <>{children}</>;
}
