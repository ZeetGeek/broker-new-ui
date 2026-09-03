"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import type { AuthUser } from "@/lib/auth/session";

import { type AppStore, makeStore } from "@/store";
import { clearAuth, establishSession, hydrateAuth } from "@/store/slices/auth-slice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [store] = useState<AppStore>(() => makeStore());

    useEffect(() => {
        void store.dispatch(hydrateAuth());

        const onUnauthorized = () => {
            store.dispatch(clearAuth());
        };

        const onTokenRefreshed = (event: Event) => {
            const detail = (event as CustomEvent<{ accessToken: string; user: AuthUser }>).detail;
            if (detail?.accessToken && detail?.user) {
                store.dispatch(
                    establishSession({
                        accessToken: detail.accessToken,
                        user: detail.user,
                    }),
                );
            }
        };

        window.addEventListener("broker:unauthorized", onUnauthorized);
        window.addEventListener("broker:token-refreshed", onTokenRefreshed);
        return () => {
            window.removeEventListener("broker:unauthorized", onUnauthorized);
            window.removeEventListener("broker:token-refreshed", onTokenRefreshed);
        };
    }, [store]);

    return <Provider store={store}>{children}</Provider>;
}
