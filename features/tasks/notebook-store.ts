"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { tasksApi } from "@/lib/api/tasks";
import { testStorageKey } from "@/lib/testing/test-lab";
import { simulateTestRequest } from "@/lib/testing/test-network";

import { defaultNotebook, notebookSchema, type TaskNotebook } from "./notebook-model";

const keyFor = (accountId: string) => testStorageKey(`crm.private-task-lists.mock.v1.${accountId}`);
export const notebookQueryKey = (accountId: string) => ["private-task-lists", accountId] as const;
export type NotebookUpdater = (current: TaskNotebook) => TaskNotebook;

export const notebookPreviewStore = {
    read(accountId: string): TaskNotebook {
        const value = sessionStorage.getItem(keyFor(accountId));
        if (value === null) return defaultNotebook();
        try {
            return notebookSchema.parse(JSON.parse(value));
        } catch {
            throw new Error(
                "Your lists couldn't load. Your saved data is still here; try reloading the page.",
            );
        }
    },
    update(accountId: string, updater: NotebookUpdater): TaskNotebook {
        const next = notebookSchema.parse(updater(this.read(accountId)));
        sessionStorage.setItem(keyFor(accountId), JSON.stringify(next));
        return next;
    },
};

async function fetchNotebook(): Promise<TaskNotebook> {
    return notebookSchema.parse(await tasksApi.notebook());
}

export function useTaskNotebook(accountId: string) {
    const mock = isMockMode();
    const client = useQueryClient();
    const queryKey = notebookQueryKey(accountId);
    const mutationKey = ["task-notebook-mutation", accountId];
    const busy = useIsMutating({ mutationKey }) > 0;
    const query = useQuery({
        queryKey,
        queryFn: mock
            ? async () => {
                  await simulateTestRequest();
                  return notebookPreviewStore.read(accountId);
              }
            : fetchNotebook,
        staleTime: mock ? Infinity : 60_000,
        enabled: !busy,
        refetchOnWindowFocus: !mock,
        refetchOnReconnect: !mock,
        refetchInterval: mock ? false : 60_000,
        retry: mock ? false : 1,
    });
    const mutation = useMutation({
        mutationKey,
        scope: { id: `task-notebook:${accountId}` },
        mutationFn: async (updater: NotebookUpdater) => {
            if (mock) {
                await simulateTestRequest();
                return notebookPreviewStore.update(accountId, updater);
            }
            await client.cancelQueries({ queryKey });
            const current = await fetchNotebook();
            const next = notebookSchema.parse(updater(current));
            return notebookSchema.parse(await tasksApi.replaceNotebook(next));
        },
        onSuccess: (value) => client.setQueryData(queryKey, value),
        onError: () => {
            if (!mock) void client.invalidateQueries({ queryKey });
        },
    });
    return {
        notebook: query.data ?? defaultNotebook(),
        isLoading: query.isPending,
        error: query.error,
        busy,
        update: mutation.mutateAsync,
    };
}
