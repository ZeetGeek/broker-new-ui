"use client";

import { useEffect } from "react";

import {
    GOOGLE_ONBOARDING_KEY,
    type Portal,
    portalForRole,
    portalHomeForRole,
} from "@/lib/auth/session";
import { usePathname, useRouter } from "@/lib/navigation";

import { MarketCurrencyScope } from "@/components/auth/market-currency-scope";

import { useAppSelector } from "@/store/hooks";

export function AuthGuard({ children, portal }: { children: React.ReactNode; portal: Portal }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, accessToken, hydrated } = useAppSelector((state) => state.auth);
    const isAuthenticated = Boolean(accessToken && user);
    const wrongPortal = isAuthenticated && portalForRole(user?.role) !== portal;
    // Every portal screen is scoped to a country. A Google signup that skipped
    // the choice is sent to pick one before seeing an empty marketplace.
    const needsCountry = isAuthenticated && !wrongPortal && user?.country === null;

    useEffect(() => {
        if (!hydrated) return;
        if (!isAuthenticated) {
            const next = pathname && pathname !== "/" ? pathname : portalHomeForRole(undefined);
            router.replace(`/login?next=${encodeURIComponent(next)}`);
            return;
        }
        if (wrongPortal) {
            router.replace(portalHomeForRole(user?.role));
            return;
        }
        if (needsCountry) {
            sessionStorage.setItem(GOOGLE_ONBOARDING_KEY, "1");
            router.replace("/auth/choose-role");
        }
    }, [hydrated, isAuthenticated, router, pathname, wrongPortal, needsCountry, user?.role]);

    if (!hydrated || !isAuthenticated || wrongPortal || needsCountry) {
        return (
            <div
                className="bg-canvas p-4 min-block-screen md:p-8"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <span className="sr-only">Loading your account</span>
                <div className="mx-auto space-y-6 max-inline-[1280px]">
                    <div
                        className="
                      animate-pulse rounded-card bg-surface-muted block-16 inline-full
                    "
                    />
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div
                                key={index}
                                className="
                      animate-pulse rounded-inner bg-surface-muted block-16
                    "
                            />
                        ))}
                    </div>
                    <div
                        className="
                      animate-pulse rounded-card bg-surface-muted block-72 inline-full
                    "
                    />
                </div>
            </div>
        );
    }

    return <MarketCurrencyScope>{children}</MarketCurrencyScope>;
}
