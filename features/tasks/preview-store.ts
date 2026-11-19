"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { inputValueInIst, inputValueToUtc } from "@/lib/visits/time";

import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "@/features/new-site-visits/preview-store";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";

import {
    backfillTaskStart,
    EMPTY_TASK_DRAFT,
    MAX_REMINDER_MINUTES,
    type Task,
    taskDateKey,
    type TaskDraft,
    type TaskPriority,
    taskReminderAt,
    taskReminderKey,
    taskReminders,
    taskSchema,
} from "./model";
import { encodeTaskDraftTitle } from "./quick-add-draft";

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
export const TASK_QUERY_KEY = (accountId: string) => ["private-tasks-mock-v8", accountId] as const;
/** Bumped so the planner reseeds with quick-add chip titles. */
const keyFor = (accountId: string) => `crm.private-tasks.mock.v4.${accountId}`;
const envelope = z.object({
    version: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    tasks: z.array(taskSchema),
});
const legacyEnvelope = z.object({
    version: z.literal(1),
    tasks: z.array(z.record(z.string(), z.unknown())),
});
const legacyOffset = z.number().int().min(0).max(MAX_REMINDER_MINUTES).nullable();

const TASK_CATALOGS = {
    clients: TASK_CLIENTS,
    owners: TASK_OWNERS,
    properties: TASK_PROPERTIES,
};

const PREVIEW_DETAILS =
    "Preview task with quick-add chip syntax. Open it or double-click the row to see the chips.";

function chipTitle(draft: TaskDraft, now: number): string {
    return encodeTaskDraftTitle(draft, TASK_CATALOGS, now);
}

function draftOf(
    name: string,
    fields: Partial<TaskDraft> & Pick<TaskDraft, "startDate" | "startTime">,
): TaskDraft {
    return { ...EMPTY_TASK_DRAFT, title: name, ...fields };
}

export function sampleTasks(now = Date.now()): Task[] {
    const day = (offset: number) => taskDateKey(now + offset * 86_400_000);
    const upcoming = inputValueInIst(new Date(now + 15 * 60_000));
    const upcomingDate = upcoming.slice(0, 10);
    const upcomingTime = upcoming.slice(11, 16);
    const make = (
        index: number,
        name: string,
        fields: Partial<TaskDraft> & Pick<TaskDraft, "startDate" | "startTime">,
        extras: Partial<Task> = {},
    ): Task => {
        const draft = draftOf(name, fields);
        const startDate = draft.startDate || null;
        const startTime = draft.startTime || null;
        const dueDate = draft.dueDate || null;
        const dueTime = dueDate && draft.dueTime ? draft.dueTime : null;
        return {
            id: `sample-task-${index}`,
            title: chipTitle(draft, now),
            details: draft.details,
            startDate,
            startTime,
            startReminderEnabledAt: new Date(now).toISOString(),
            repeat: draft.repeat,
            repeatAnchor: draft.repeat ? dueDate || startDate : null,
            repeatFromId: null,
            dueDate,
            dueTime,
            reminders: dueDate && dueTime ? [...draft.reminders] : [],
            clientId: draft.clientId || null,
            ownerId: draft.ownerId || null,
            propertyId: draft.propertyId || null,
            completedAt: null,
            createdAt: new Date(now - 3 * 86_400_000 + index * 60_000).toISOString(),
            updatedAt: new Date(now - 86_400_000).toISOString(),
            priority: draft.priority,
            deliveredReminderKeys: [],
            ...extras,
        };
    };
    const tasks: Task[] = [
        make(1, "Call about Vesu options", {
            startDate: day(-1),
            startTime: "17:00",
            dueDate: day(-1),
            dueTime: "17:00",
            reminders: [15],
            clientId: TASK_CLIENTS[0].id,
            propertyId: TASK_PROPERTIES[0].id,
            priority: "high",
            details:
                "Ask about preferred floors and confirm the budget before sharing a shortlist.",
        }),
        make(2, "Collect signed owner consent", {
            startDate: day(-2),
            startTime: "10:00",
            propertyId: TASK_PROPERTIES[2].id,
            ownerId: TASK_OWNERS[0]?.id ?? "",
            priority: "urgent",
        }),
        make(3, "Confirm the visit", {
            startDate: upcomingDate,
            startTime: upcomingTime,
            dueDate: upcomingDate,
            dueTime: upcomingTime,
            reminders: [15, 0],
            clientId: TASK_CLIENTS[2].id,
            propertyId: TASK_PROPERTIES[2].id,
            priority: "high",
            details: "Confirm the meeting point at the main gate and check parking access.",
        }),
        make(4, "Send the Vesu shortlist", {
            startDate: day(0),
            startTime: "12:00",
            dueDate: day(0),
            dueTime: "12:00",
            reminders: [60, 0],
            clientId: TASK_CLIENTS[0].id,
            propertyId: TASK_PROPERTIES[0].id,
            priority: "medium",
        }),
        make(5, "Review the listing details", {
            startDate: day(0),
            startTime: "09:00",
            propertyId: TASK_PROPERTIES[2].id,
            priority: "low",
        }),
        make(6, "Follow up on the visit notes", {
            startDate: day(1),
            startTime: "11:00",
            dueDate: day(1),
            dueTime: "11:00",
            reminders: [1440, 60],
            clientId: TASK_CLIENTS[3].id,
            priority: "medium",
        }),
        make(7, "Prepare property photos", {
            startDate: day(2),
            startTime: "09:00",
            propertyId: TASK_PROPERTIES[3].id,
            priority: "low",
            repeat: { unit: "week", interval: 1, weekdays: [1], until: null },
        }),
        {
            ...make(8, "Organise this week’s paperwork", {
                startDate: day(0),
                startTime: "08:00",
                details: "Keep owner consent forms and visit notes together.",
                priority: "low",
            }),
            title: "Organise this week’s paperwork",
            startDate: null,
            startTime: null,
            listId: "someday",
        },
        make(
            9,
            "Share the brochure",
            {
                startDate: day(0),
                startTime: "08:00",
                dueDate: day(0),
                dueTime: "08:00",
                clientId: TASK_CLIENTS[3].id,
                propertyId: TASK_PROPERTIES[3].id,
                priority: "medium",
            },
            { completedAt: new Date(now - 30 * 60_000).toISOString() },
        ),
        make(
            10,
            "Check owner documents",
            {
                startDate: day(-1),
                startTime: "16:20",
                propertyId: TASK_PROPERTIES[0].id,
                ownerId: TASK_OWNERS[0]?.id ?? "",
                priority: "medium",
            },
            { completedAt: inputValueToUtc(`${day(-1)}T16:20`) },
        ),
        make(
            11,
            "Call for requirements",
            {
                startDate: day(-2),
                startTime: "11:15",
                clientId: TASK_CLIENTS[1].id,
                priority: "medium",
            },
            { completedAt: inputValueToUtc(`${day(-2)}T11:15`) },
        ),
    ];
    return tasks.map((record) => {
        const task = record.listId === "someday" ? record : backfillTaskStart(record, now);
        const deliveredReminderKeys = taskReminders(task)
            .filter(
                (reminder) =>
                    reminder.at && task.id !== "sample-task-3" && Date.parse(reminder.at) <= now,
            )
            .map((reminder) => reminder.key);
        return { ...task, deliveredReminderKeys };
    });
}

/** Rich design-preview data across every task view; never sent to the API. */
export function placeholderTasks(now = Date.now()): Task[] {
    const actions = [
        "Confirm the meeting point",
        "Review owner documents",
        "Prepare the property shortlist",
        "Check parking and access",
        "Share the floor plan",
        "Follow up on availability",
        "Collect the latest listing photos",
        "Confirm the next steps",
        "Check the revised asking price",
        "Arrange a second viewing",
        "Request the maintenance details",
        "Confirm key collection",
        "Review the possession timeline",
        "Prepare the visit notes",
        "Check the available floor plans",
        "Collect the updated brochure",
        "Review the rental terms",
        "Verify the carpet area",
        "Check the preferred viewing time",
        "Prepare a location comparison",
        "Confirm the owner’s availability",
        "Review the latest Client feedback",
        "Check lift access and visitor parking",
        "Prepare the document checklist",
    ];
    const personal = [
        "Organise this week’s paperwork",
        "Review pending owner follow-ups",
        "Prepare next week’s property shortlist",
        "Update notes from recent Client calls",
        "Plan the weekend property visits",
        "File the signed representation documents",
        "Review preferred locations with Clients",
        "Check the latest listing details",
        "Prepare questions for owner meetings",
        "Review upcoming renewal dates",
        "Organise property photos by locality",
        "Plan follow-ups for next month",
    ];
    const base = sampleTasks(now)[0];
    const priorities: TaskPriority[] = ["low", "urgent", "high", "medium"];
    // Repeatable shuffle keeps fixtures stable without repeating each day's content.
    let seed = 38127;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const combinations = actions.flatMap((action) =>
        TASK_PROPERTIES.flatMap((property) =>
            TASK_CLIENTS.map((client) => ({ action, property, client })),
        ),
    );
    for (let index = combinations.length - 1; index > 0; index--) {
        const other = Math.floor(random() * (index + 1));
        [combinations[index], combinations[other]] = [combinations[other], combinations[index]];
    }
    const dayOffsets = [-2, -1, 0, 1, 2, 3, 4].flatMap((offset, index) =>
        Array.from({ length: [3, 5, 6, 11, 3, 13, 7][index] }, () => offset),
    );
    return Array.from({ length: 80 }, (_, index) => {
        const unscheduled = index >= 48 && index < 60;
        const completed = index >= 60 && index < 72;
        const deleted = index >= 72;
        const offset = dayOffsets[index] ?? -(index % 5);
        const date = taskDateKey(now + offset * 86_400_000);
        const { action, property, client } = combinations[index];
        const priority = priorities[Math.floor(random() * priorities.length)];
        const withDue = !unscheduled && index % 3 === 0;
        const ownerId = !unscheduled && index % 4 === 0 ? (TASK_OWNERS[0]?.id ?? "") : "";
        const draft = draftOf(unscheduled ? personal[index - 48] : action, {
            startDate: date,
            startTime: "09:00",
            dueDate: withDue ? date : "",
            dueTime: withDue ? "16:30" : "",
            reminders: withDue ? [15] : [],
            clientId: unscheduled ? "" : client.id,
            propertyId: unscheduled ? "" : property.id,
            ownerId,
            priority,
            details: PREVIEW_DETAILS,
        });
        const task: Task = {
            ...base,
            id: `placeholder-task-${index + 1}`,
            title: unscheduled ? personal[index - 48] : chipTitle(draft, now),
            details: PREVIEW_DETAILS,
            startDate: date,
            startTime: "09:00",
            startReminderEnabledAt: new Date(now).toISOString(),
            dueDate: unscheduled ? null : date,
            dueTime: withDue ? "16:30" : null,
            reminders: withDue ? [15] : [],
            priority,
            clientId: unscheduled ? null : client.id,
            propertyId: unscheduled ? null : property.id,
            ownerId: ownerId || null,
            completedAt: completed ? new Date(now - (index - 59) * 3_600_000).toISOString() : null,
            deletedAt: deleted ? new Date(now - (index - 71) * 3_600_000).toISOString() : null,
            listId: unscheduled ? "someday" : null,
            createdAt: new Date(now - (80 - index) * 60_000).toISOString(),
            updatedAt: new Date(now).toISOString(),
            deliveredReminderKeys: [],
        };
        // Preview records must not generate unsolicited reminder notifications.
        return {
            ...task,
            deliveredReminderKeys: taskReminders(task).map((reminder) => reminder.key),
        };
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
        const configuredKeys = new Set(
            taskReminders(task)
                .filter((reminder) => reminder.at)
                .map((reminder) => reminder.key),
        );
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
            return writeTasks(
                accountId,
                migrateLegacy(decoded).map((task) => backfillTaskStart(task)),
            );
        const savedTasks = checkedTasks(decoded);
        const hasOldSamples = savedTasks.some(
            (task) =>
                task.id.startsWith("placeholder-task-") &&
                (task.details.startsWith("Sample task for exploring the planner.") ||
                    task.details.startsWith("Varied sample task for exploring the planner.")),
        );
        const refreshedSamples = new Map(
            hasOldSamples ? placeholderTasks().map((task) => [task.id, task] as const) : [],
        );
        const tasks = savedTasks.map((task) => {
            const refreshed = refreshedSamples.get(task.id);
            // Refresh only the previous generated fixtures; retain user tasks and saved states.
            if (
                refreshed &&
                (task.details.startsWith("Sample task for exploring the planner.") ||
                    task.details.startsWith("Varied sample task for exploring the planner."))
            ) {
                return backfillTaskStart({
                    ...task,
                    title: refreshed.title,
                    details: refreshed.details,
                    dueDate: refreshed.dueDate,
                    dueTime: refreshed.dueTime,
                    startDate: refreshed.startDate,
                    startTime: refreshed.startTime,
                    priority: refreshed.priority,
                    clientId: refreshed.clientId,
                    propertyId: refreshed.propertyId,
                    ownerId: refreshed.ownerId,
                    reminders: refreshed.reminders,
                    deliveredReminderKeys: refreshed.deliveredReminderKeys,
                });
            }
            return backfillTaskStart(task);
        });
        return writeTasks(accountId, tasks);
    } catch {
        throw new Error("Your tasks couldn’t be loaded. Reset the task list to try again.");
    }
}

function writeTasks(accountId: string, tasks: Task[]): Task[] {
    const checked = checkedTasks({ version: 4, tasks });
    sessionStorage.setItem(keyFor(accountId), JSON.stringify({ version: 4, tasks: checked }));
    return checked;
}

export type TaskUpdater = (current: Task[]) => Task[];

/** Browser-local mock adapter; it never sends CRM data or writes to the API.
 * Storage reads and writes happen synchronously in one turn, so updater mutations
 * always see the latest tasks even when a reminder and an edit happen together.
 */
export const taskPreviewStore = {
    async list(accountId: string): Promise<Task[]> {
        return readSaved(accountId) ?? writeTasks(accountId, placeholderTasks());
    },
    async save(accountId: string, tasks: Task[]): Promise<Task[]> {
        const latest = readSaved(accountId) ?? [];
        // A form opened before a reminder fired must not erase its delivery keys.
        const merged = tasks.map((task) => {
            const current = latest.find((saved) => saved.id === task.id);
            const configuredKeys = new Set(
                taskReminders(task)
                    .filter((reminder) => reminder.at)
                    .map((reminder) => reminder.key),
            );
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
        return writeTasks(accountId, updater(readSaved(accountId) ?? placeholderTasks()));
    },
    async reset(accountId: string): Promise<Task[]> {
        return writeTasks(accountId, []);
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
