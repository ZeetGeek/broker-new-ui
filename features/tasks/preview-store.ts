"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { inputValueInIst, inputValueToUtc } from "@/lib/visits/time";

import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "@/features/new-site-visits/preview-store";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";

import {
    MAX_REMINDER_MINUTES,
    type Task,
    taskDateKey,
    taskReminderAt,
    taskReminderKey,
    taskReminders,
    taskSchema,
} from "./model";

export const TASK_CLIENTS = PREVIEW_CLIENTS;
export const TASK_PROPERTIES = PREVIEW_PROPERTIES;
export const TASK_OWNERS = [
    ...new Map(
        MOCK_DEALS.map((deal) => deal.owner)
            .filter((owner) => owner.isRepresentationActive)
            .map((owner) => [
                owner.name,
                {
                    id: `sample-owner-${owner.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: owner.name,
                },
            ]),
    ).values(),
];
export const TASK_QUERY_KEY = (accountId: string) => ["private-tasks-mock-v3", accountId] as const;
const keyFor = (accountId: string) => `crm.private-tasks.mock.v1.${accountId}`;
// Keep the existing account key so users retain their task edits through migration.
const envelope = z.object({
    version: z.union([z.literal(2), z.literal(3)]),
    tasks: z.array(taskSchema),
});
const legacyEnvelope = z.object({
    version: z.literal(1),
    tasks: z.array(z.record(z.string(), z.unknown())),
});
const legacyOffset = z.number().int().min(0).max(MAX_REMINDER_MINUTES).nullable();

export function sampleTasks(now = Date.now()): Task[] {
    const day = (offset: number) => taskDateKey(now + offset * 86_400_000);
    const base = (
        index: number,
        title: string,
        dueDate: string | null,
        dueTime: string | null,
    ): Task => ({
        id: `sample-task-${index}`,
        title,
        details: "",
        startDate: dueDate && dueDate < day(0) ? dueDate : day(0),
        repeat: null,
        repeatAnchor: null,
        repeatFromId: null,
        dueDate,
        dueTime,
        reminders: dueTime ? [15] : [],
        clientId: null,
        ownerId: null,
        propertyId: null,
        completedAt: null,
        createdAt: new Date(now - 3 * 86_400_000 + index * 60_000).toISOString(),
        updatedAt: new Date(now - 86_400_000).toISOString(),
        priority: "medium",
        deliveredReminderKeys: [],
    });
    const upcomingTime = inputValueInIst(new Date(now + 15 * 60_000));
    const tasks: Task[] = [
        {
            ...base(1, "Call Aarav about Vesu options", day(-1), "17:00"),
            clientId: TASK_CLIENTS[0].id,
            propertyId: TASK_PROPERTIES[0].id,
            priority: "high",
            details:
                "Ask about preferred floors and confirm the budget before sharing a shortlist.",
        },
        {
            ...base(2, "Collect signed owner consent", day(-2), null),
            propertyId: TASK_PROPERTIES[2].id,
            priority: "urgent",
            ownerId: TASK_OWNERS[0]?.id ?? null,
        },
        {
            ...base(
                3,
                "Confirm the visit with Priya",
                upcomingTime.slice(0, 10),
                upcomingTime.slice(11, 16),
            ),
            clientId: TASK_CLIENTS[2].id,
            propertyId: TASK_PROPERTIES[2].id,
            details: "Confirm the meeting point at the main gate and check parking access.",
            reminders: [15, 0],
            priority: "high",
        },
        {
            ...base(4, "Send Vesu shortlist to Aarav", day(0), "12:00"),
            clientId: TASK_CLIENTS[0].id,
            reminders: [60, 0],
        },
        {
            ...base(5, "Review the Adajan listing details", day(0), null),
            propertyId: TASK_PROPERTIES[2].id,
            priority: "low",
        },
        {
            ...base(6, "Follow up with Nisha", day(1), "11:00"),
            clientId: TASK_CLIENTS[3].id,
            reminders: [1440, 60],
        },
        {
            ...base(7, "Prepare Pal property photos", day(2), null),
            propertyId: TASK_PROPERTIES[3].id,
            priority: "low",
        },
        {
            ...base(8, "Organise this week’s paperwork", null, null),
            details: "Keep owner consent forms and visit notes together.",
        },
        {
            ...base(9, "Share the Pal brochure with Nisha", day(0), "08:00"),
            clientId: TASK_CLIENTS[3].id,
            propertyId: TASK_PROPERTIES[3].id,
            completedAt: new Date(now - 30 * 60_000).toISOString(),
        },
        {
            ...base(10, "Check Vesu owner documents", day(-1), null),
            propertyId: TASK_PROPERTIES[0].id,
            completedAt: inputValueToUtc(`${day(-1)}T16:20`),
        },
        {
            ...base(11, "Call Mehul for requirements", day(-2), null),
            clientId: TASK_CLIENTS[1].id,
            completedAt: inputValueToUtc(`${day(-2)}T11:15`),
        },
    ];
    return tasks.map((task) => {
        const deliveredReminderKeys = taskReminders(task)
            .filter((reminder) => task.id !== "sample-task-3" && Date.parse(reminder.at) <= now)
            .map((reminder) => reminder.key);
        return { ...task, deliveredReminderKeys };
    });
}

function checkedTasks(data: unknown): Task[] {
    const parsed = envelope.parse(data).tasks;
    if (new Set(parsed.map((task) => task.id)).size !== parsed.length)
        throw new Error("The saved tasks contain duplicate records.");
    if (
        !parsed.every(
            (task) =>
                (!task.clientId || TASK_CLIENTS.some((client) => client.id === task.clientId)) &&
                (!task.ownerId || TASK_OWNERS.some((owner) => owner.id === task.ownerId)) &&
                (!task.propertyId ||
                    TASK_PROPERTIES.some((property) => property.id === task.propertyId)),
        )
    )
        throw new Error("Choose an existing Client, owner or property.");
    return parsed.map((task) => {
        const configuredKeys = new Set(taskReminders(task).map((reminder) => reminder.key));
        return {
            ...task,
            reminders: [...task.reminders].sort((a, b) => b - a),
            deliveredReminderKeys: [...new Set(task.deliveredReminderKeys)].filter((key) =>
                configuredKeys.has(key),
            ),
        };
    });
}

function migrateLegacy(data: unknown): Task[] {
    const legacy = legacyEnvelope.parse(data);
    const tasks = legacy.tasks.map((task) => {
        const minutes = legacyOffset.parse(task.reminderMinutes);
        const deliveredAt = z.iso.datetime().nullable().parse(task.reminderDeliveredFor);
        const migrated = taskSchema.parse({
            ...task,
            reminders: minutes === null ? [] : [minutes],
            deliveredReminderKeys: [],
        });
        const key = minutes === null ? null : taskReminderKey(migrated, minutes);
        return minutes !== null && key && deliveredAt === taskReminderAt(migrated, minutes)
            ? { ...migrated, deliveredReminderKeys: [key] }
            : migrated;
    });
    return checkedTasks({ version: 2, tasks });
}

function readSaved(accountId: string): Task[] | null {
    const saved = sessionStorage.getItem(keyFor(accountId));
    if (saved === null) return null;
    try {
        const decoded: unknown = JSON.parse(saved);
        if (legacyEnvelope.safeParse(decoded).success)
            return writeTasks(accountId, migrateLegacy(decoded));
        const tasks = checkedTasks(decoded);
        return writeTasks(accountId, tasks);
    } catch {
        throw new Error(
            "Your sample tasks couldn’t be loaded. Reset the sample data to try again.",
        );
    }
}

function writeTasks(accountId: string, tasks: Task[]): Task[] {
    const checked = checkedTasks({ version: 3, tasks });
    sessionStorage.setItem(keyFor(accountId), JSON.stringify({ version: 3, tasks: checked }));
    return checked;
}

export type TaskUpdater = (current: Task[]) => Task[];

/** Browser-local mock adapter; it never sends CRM data or writes to the API.
 * Storage reads and writes happen synchronously in one turn, so updater mutations
 * always see the latest tasks even when a reminder and an edit happen together.
 */
export const taskPreviewStore = {
    async list(accountId: string): Promise<Task[]> {
        return readSaved(accountId) ?? writeTasks(accountId, sampleTasks());
    },
    async save(accountId: string, tasks: Task[]): Promise<Task[]> {
        const latest = readSaved(accountId) ?? [];
        // A form opened before a reminder fired must not erase its delivery keys.
        const merged = tasks.map((task) => {
            const current = latest.find((saved) => saved.id === task.id);
            const configuredKeys = new Set(taskReminders(task).map((reminder) => reminder.key));
            return {
                ...task,
                deliveredReminderKeys: [
                    ...new Set([
                        ...task.deliveredReminderKeys,
                        ...(current?.deliveredReminderKeys ?? []),
                    ]),
                ].filter((key) => configuredKeys.has(key)),
            };
        });
        return writeTasks(accountId, merged);
    },
    async update(accountId: string, updater: TaskUpdater): Promise<Task[]> {
        return writeTasks(accountId, updater(readSaved(accountId) ?? sampleTasks()));
    },
    async reset(accountId: string): Promise<Task[]> {
        return writeTasks(accountId, sampleTasks());
    },
};

export function useTasks(accountId: string) {
    const queryClient = useQueryClient();
    const queryKey = TASK_QUERY_KEY(accountId);
    const mutationKey = ["private-tasks-mutation", accountId];
    const query = useQuery({
        queryKey,
        queryFn: () => taskPreviewStore.list(accountId),
        staleTime: Infinity,
        retry: false,
    });
    const mutation = useMutation({
        mutationKey,
        mutationFn: (next: Task[] | TaskUpdater | "reset") =>
            next === "reset"
                ? taskPreviewStore.reset(accountId)
                : typeof next === "function"
                  ? taskPreviewStore.update(accountId, next)
                  : taskPreviewStore.save(accountId, next),
        onSuccess: (tasks) => queryClient.setQueryData(queryKey, tasks),
    });
    const busy = useIsMutating({ mutationKey }) > 0;
    const save = async (next: Task[]): Promise<void> => {
        await mutation.mutateAsync(next);
    };
    const update = async (updater: TaskUpdater): Promise<void> => {
        await mutation.mutateAsync(updater);
    };
    const reset = async (): Promise<void> => {
        await mutation.mutateAsync("reset");
    };
    return {
        tasks: query.data ?? [],
        isLoading: query.isPending,
        error: query.error,
        save,
        update,
        reset,
        busy,
    };
}
