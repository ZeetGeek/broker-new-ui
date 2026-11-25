import { apiFetch } from "@/lib/api/client";
import { withTestNetwork } from "@/lib/testing/test-network";

export type TaskOwnerTypeDto = "platform" | "exclusive";
export type TaskPriorityDto = "low" | "medium" | "high" | "urgent";

export type TaskRepeatDto = {
    unit: "day" | "week" | "month" | "year";
    interval: number;
    weekdays: number[];
    until: string | null;
};

export type TaskDto = {
    id: string;
    title: string;
    details: string;
    startDate: string | null;
    startTime: string | null;
    startReminderEnabledAt?: string | null;
    repeat: TaskRepeatDto | null;
    repeatAnchor: string | null;
    repeatFromId: string | null;
    dueDate: string | null;
    dueTime: string | null;
    reminders: number[];
    clientId: string | null;
    ownerId: string | null;
    ownerType: TaskOwnerTypeDto | null;
    propertyId: string | null;
    client: { id: string; name: string } | null;
    owner: { id: string; name: string } | null;
    property: { id: string; title: string } | null;
    completedAt: string | null;
    deletedAt: string | null;
    plannerOrder?: number | null;
    listId: string | null;
    createdAt: string;
    updatedAt: string;
    priority: TaskPriorityDto;
    priorityAt: number | null;
    deliveredReminderKeys: string[];
};

export type TaskWriteDto = Partial<{
    title: string;
    details: string;
    startDate: string | null;
    startTime: string | null;
    dueDate: string | null;
    dueTime: string | null;
    repeat: TaskRepeatDto | null;
    repeatAnchor: string | null;
    reminders: number[];
    deliveredReminderKeys: string[];
    startReminderEnabledAt: string | null;
    priority: TaskPriorityDto;
    priorityAt: number | null;
    clientId: string | null;
    propertyId: string | null;
    ownerId: string | null;
    ownerType: TaskOwnerTypeDto | null;
    listId: string | null;
    plannerOrder: number | null;
}>;

export type TaskLinkOptionsDto = {
    clients: { id: string; name: string; type: string; requirement: string; phoneDigits: string }[];
    owners: { id: string; name: string; type: TaskOwnerTypeDto }[];
    properties: {
        id: string;
        title: string;
        locality: string;
        city: string;
        address: string;
        configLabel: string;
        imageUrl?: string;
    }[];
};

export type TaskNotebookDto = {
    tabs: { id: string; name: string }[];
    lists: { id: string; tabId: string; name: string }[];
    inboxListId: string;
};

const json = (method: string, body?: unknown) => ({
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const tasksApi = withTestNetwork({
    list: (signal?: AbortSignal) => apiFetch<TaskDto[]>("/tasks", { signal }),
    create: (task: TaskWriteDto & { id: string }) =>
        apiFetch<TaskDto>("/tasks", json("POST", task)),
    update: (id: string, patch: TaskWriteDto) =>
        apiFetch<TaskDto>(`/tasks/${id}`, json("PATCH", patch)),
    bulkUpdate: (items: (TaskWriteDto & { id: string })[]) =>
        apiFetch<TaskDto[]>("/tasks", json("PATCH", { items })),
    complete: (id: string, nextId?: string) =>
        apiFetch<{ tasks: TaskDto[] }>(
            `/tasks/${id}/complete`,
            json("POST", nextId ? { nextId } : {}),
        ),
    reopen: (id: string) =>
        apiFetch<{ tasks: TaskDto[]; removedIds: string[] }>(
            `/tasks/${id}/reopen`,
            json("POST", {}),
        ),
    remove: (id: string) => apiFetch<TaskDto>(`/tasks/${id}`, { method: "DELETE" }),
    restore: (id: string) => apiFetch<TaskDto>(`/tasks/${id}/restore`, json("POST", {})),
    delivered: (id: string, keys: string[]) =>
        apiFetch<TaskDto>(`/tasks/${id}/reminders/delivered`, json("POST", { keys })),
    notebook: () => apiFetch<TaskNotebookDto>("/tasks/notebook"),
    replaceNotebook: (notebook: TaskNotebookDto) =>
        apiFetch<TaskNotebookDto>("/tasks/notebook", json("PUT", notebook)),
    linkOptions: () => apiFetch<TaskLinkOptionsDto>("/tasks/link-options"),
});
