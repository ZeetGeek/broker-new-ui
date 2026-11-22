import type { Task, TaskDraft } from "./model";
import { encodeTaskDraftTitle } from "./quick-add-draft";
import type { QuickAddCatalogs } from "./quick-add-parse";

export type TaskDraftMode = "create" | "edit" | "reschedule" | "reminder";

/** Shared by the task workspace and same-page panels so scheduling and recurrence stay identical. */
export function taskFromDraft(
    draft: TaskDraft,
    {
        editing,
        mode,
        catalogs,
        now,
        id,
    }: {
        editing?: Task;
        mode: TaskDraftMode;
        catalogs: QuickAddCatalogs;
        now: number;
        id: string;
    },
): Task {
    const at = new Date(now).toISOString();
    const sameSchedule =
        editing &&
        editing.startDate === (draft.startDate || null) &&
        editing.dueDate === (draft.dueDate || null) &&
        JSON.stringify(editing.repeat) === JSON.stringify(draft.repeat);
    return {
        id: editing?.id ?? id,
        title:
            mode === "create" || mode === "edit"
                ? encodeTaskDraftTitle(draft, catalogs, now)
                : draft.title.trim(),
        details: draft.details.trim(),
        startDate: draft.startDate || null,
        startTime: draft.startDate && draft.startTime ? draft.startTime : null,
        startReminderEnabledAt: editing?.startReminderEnabledAt,
        repeat: draft.repeat,
        repeatAnchor: draft.repeat
            ? sameSchedule
                ? editing.repeatAnchor
                : draft.dueDate || draft.startDate || null
            : null,
        repeatFromId: editing?.repeatFromId ?? null,
        dueDate: draft.dueDate || null,
        dueTime: draft.dueDate && draft.dueTime ? draft.dueTime : null,
        reminders: draft.dueDate && draft.dueTime ? [...draft.reminders] : [],
        clientId: draft.clientId || null,
        ownerId: draft.ownerId || null,
        propertyId: draft.propertyId || null,
        priority: draft.priority,
        completedAt: editing?.completedAt ?? null,
        deletedAt: editing?.deletedAt ?? null,
        plannerOrder: sameSchedule ? editing?.plannerOrder : undefined,
        listId: editing?.listId,
        createdAt: editing?.createdAt ?? at,
        updatedAt: at,
        deliveredReminderKeys: editing?.deliveredReminderKeys ?? [],
    };
}
