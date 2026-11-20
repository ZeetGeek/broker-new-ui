"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { type TaskLinkOptionsDto, tasksApi } from "@/lib/api/tasks";

import type { Task } from "./model";
import { TASK_QUERY_KEY, taskPreviewStore, type TaskUpdater } from "./preview-store";
import { TASK_CATALOGS_QUERY_KEY } from "./task-catalogs";
import { applyTaskOps, diffTasks, taskFromDto } from "./task-sync";

export type { TaskUpdater };

const liveTasksKey = (accountId: string) => ["tasks", accountId] as const;

async function fetchTasks(): Promise<Task[]> {
    return (await tasksApi.list()).map(taskFromDto);
}

function withOwnerTypes(
    current: Task[],
    next: Task[],
    catalogs: TaskLinkOptionsDto | undefined,
): Task[] {
    const previous = new Map(current.map((task) => [task.id, task]));
    return next.map((task) => {
        if (!task.ownerId) return task.ownerType ? { ...task, ownerType: null } : task;
        const old = previous.get(task.id);
        if (old && old.ownerId === task.ownerId && task.ownerType) return task;
        const ownerType =
            catalogs?.owners.find((owner) => owner.id === task.ownerId)?.type ??
            task.ownerType ??
            null;
        return { ...task, ownerType };
    });
}

export function useTasks(accountId: string) {
    const mock = isMockMode();
    const queryClient = useQueryClient();
    const queryKey = mock ? TASK_QUERY_KEY(accountId) : liveTasksKey(accountId);
    const mutationKey = ["tasks-mutation", accountId];
    const query = useQuery({
        queryKey,
        queryFn: mock ? () => taskPreviewStore.list(accountId) : fetchTasks,
        staleTime: mock ? Infinity : 30_000,
        retry: mock ? false : 1,
    });
    const mutation = useMutation({
        mutationKey,
        scope: { id: `tasks-mutation:${accountId}` },
        mutationFn: async (next: Task[] | TaskUpdater | "reset") => {
            if (mock) {
                if (next === "reset") return taskPreviewStore.reset(accountId);
                return typeof next === "function"
                    ? taskPreviewStore.update(accountId, next)
                    : taskPreviewStore.save(accountId, next);
            }
            if (next === "reset") return fetchTasks();
            const current = queryClient.getQueryData<Task[]>(queryKey) ?? (await fetchTasks());
            const after = withOwnerTypes(
                current,
                typeof next === "function" ? next(current) : next,
                queryClient.getQueryData<TaskLinkOptionsDto>(TASK_CATALOGS_QUERY_KEY),
            );
            return applyTaskOps(diffTasks(current, after), after);
        },
        onSuccess: (tasks) => queryClient.setQueryData(queryKey, tasks),
        onError: () => {
            if (!mock) void queryClient.invalidateQueries({ queryKey });
        },
    });
    const busy = useIsMutating({ mutationKey }) > 0;
    const save = async (next: Task[]): Promise<void> => {
        await mutation.mutateAsync(next);
    };
    const update = async (updater: TaskUpdater): Promise<void> => {
        await mutation.mutateAsync(updater);
    };
    const reset = async (): Promise<void> => {
        if (mock) {
            await mutation.mutateAsync("reset");
            return;
        }
        await query.refetch({ throwOnError: true });
    };
    return {
        tasks: query.data ?? [],
        isLoading: query.isPending,
        error: query.error,
        save,
        update,
        reset,
        busy,
        isLive: !mock,
    };
}
