"use client";

import { useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { disconnectNotificationSocket } from "@/lib/socket/notifications";

import { useAppSelector } from "@/store/hooks";

/**
 * Remounts the app below this point — dropping every cached query — only when
 * an account's data could leak: signing out, or switching straight to another
 * account. Signing in from signed out does not remount: the cache then holds
 * only public data, and a remount there would reset the login screen to an
 * empty form while the redirect to the portal is still loading.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const identity = useAppSelector((state) =>
        state.auth.accessToken && state.auth.user
            ? `${state.auth.user.id}:${state.auth.user.role}`
            : null,
    );
    const [scope, setScope] = useState({ identity, key: 0 });

    if (scope.identity !== identity) {
        // Adjusted during render, so the old tree never commits with the new account.
        const leavingAccount = scope.identity !== null;
        setScope({ identity, key: leavingAccount ? scope.key + 1 : scope.key });
    }

    return <SessionQueries key={scope.key}>{children}</SessionQueries>;
}

function SessionQueries({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        gcTime: 10 * 60_000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            }),
    );

    useEffect(
        () => () => {
            void queryClient.cancelQueries();
            queryClient.clear();
            disconnectNotificationSocket();
        },
        [queryClient],
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
