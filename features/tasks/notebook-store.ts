"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { defaultNotebook, notebookSchema, type TaskNotebook } from "./notebook-model";

const keyFor = (accountId: string) => `crm.private-task-lists.mock.v1.${accountId}`;
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

export function useTaskNotebook(accountId: string) {
    const client = useQueryClient();
    const queryKey = notebookQueryKey(accountId);
    const query = useQuery({
        queryKey,
        queryFn: () => notebookPreviewStore.read(accountId),
        staleTime: Infinity,
        retry: false,
    });
    const mutation = useMutation({
        mutationFn: async (updater: NotebookUpdater) =>
            notebookPreviewStore.update(accountId, updater),
        onSuccess: (value) => client.setQueryData(queryKey, value),
    });
    return {
        notebook: query.data ?? defaultNotebook(),
        isLoading: query.isPending,
        error: query.error,
        busy: mutation.isPending,
        update: mutation.mutateAsync,
    };
}
