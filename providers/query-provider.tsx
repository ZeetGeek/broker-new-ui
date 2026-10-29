"use client";

import { useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { disconnectNotificationSocket } from "@/lib/socket/notifications";

import { useAppSelector } from "@/store/hooks";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const sessionKey = useAppSelector((state) =>
        state.auth.accessToken && state.auth.user
            ? `${state.auth.user.id}:${state.auth.user.role}:${state.auth.sessionEpoch}`
            : `signed-out:${state.auth.sessionEpoch}`,
    );
    return <SessionQueries key={sessionKey}>{children}</SessionQueries>;
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
