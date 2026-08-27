"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { type AppStore, makeStore } from "@/store";
import { clearAuth, hydrateAuth } from "@/store/slices/auth-slice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [store] = useState<AppStore>(() => makeStore());

    useEffect(() => {
        void store.dispatch(hydrateAuth());

        const onUnauthorized = () => {
            store.dispatch(clearAuth());
        };
        window.addEventListener("broker:unauthorized", onUnauthorized);
        return () => window.removeEventListener("broker:unauthorized", onUnauthorized);
    }, [store]);

    return <Provider store={store}>{children}</Provider>;
}
