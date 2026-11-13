import { z } from "zod";

import type { Task } from "./model";

export const notebookName = z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(80, "Use 80 characters or fewer.");
const namedItem = z.object({ id: z.string().min(1), name: notebookName });
export const notebookSchema = z
    .object({
        tabs: z.array(namedItem).min(1),
        lists: z.array(namedItem.extend({ tabId: z.string().min(1) })).min(1),
        inboxListId: z.string().min(1),
    })
    .superRefine((notebook, ctx) => {
        if (
            new Set(notebook.tabs.map((tab) => tab.id)).size !== notebook.tabs.length ||
            new Set(notebook.lists.map((list) => list.id)).size !== notebook.lists.length
        )
            ctx.addIssue({ code: "custom", message: "Saved tabs and lists must have unique IDs." });
        if (
            notebook.lists.some((list) => !notebook.tabs.some((tab) => tab.id === list.tabId)) ||
            !notebook.lists.some((list) => list.id === notebook.inboxListId)
        )
            ctx.addIssue({ code: "custom", message: "A saved list is missing its tab." });
    });
export type TaskNotebook = z.infer<typeof notebookSchema>;
export type NotebookList = TaskNotebook["lists"][number];
export type NotebookTab = TaskNotebook["tabs"][number];

export function defaultNotebook(): TaskNotebook {
    return {
        tabs: [{ id: "my-lists", name: "My lists" }],
        lists: [{ id: "someday", tabId: "my-lists", name: "Someday" }],
        inboxListId: "someday",
    };
}

/** Unknown/deleted list IDs resolve to the inbox without rewriting task records. */
export function taskListId(task: Pick<Task, "listId">, notebook: TaskNotebook): string {
    return notebook.lists.some((list) => list.id === task.listId)
        ? task.listId!
        : notebook.inboxListId;
}

export function addNotebookTab(
    notebook: TaskNotebook,
    name: string,
    id = crypto.randomUUID(),
): TaskNotebook {
    return notebookSchema.parse({
        ...notebook,
        tabs: [...notebook.tabs, { id, name: notebookName.parse(name) }],
    });
}
export function addNotebookList(
    notebook: TaskNotebook,
    tabId: string,
    name: string,
    id = crypto.randomUUID(),
): TaskNotebook {
    return notebookSchema.parse({
        ...notebook,
        lists: [...notebook.lists, { id, tabId, name: notebookName.parse(name) }],
    });
}
export function renameNotebookItem(
    notebook: TaskNotebook,
    kind: "tab" | "list",
    id: string,
    name: string,
): TaskNotebook {
    const key = kind === "tab" ? "tabs" : "lists";
    return notebookSchema.parse({
        ...notebook,
        [key]: notebook[key].map((item) =>
            item.id === id ? { ...item, name: notebookName.parse(name) } : item,
        ),
    });
}
export function deleteNotebookList(notebook: TaskNotebook, id: string): TaskNotebook {
    if (notebook.lists.length === 1)
        throw new Error("Keep at least one list for your unscheduled tasks.");
    const lists = notebook.lists.filter((list) => list.id !== id);
    return {
        ...notebook,
        lists,
        inboxListId: notebook.inboxListId === id ? lists[0].id : notebook.inboxListId,
    };
}
export function deleteNotebookTab(notebook: TaskNotebook, id: string): TaskNotebook {
    if (notebook.tabs.length === 1) throw new Error("Keep at least one tab for your lists.");
    const tabs = notebook.tabs.filter((tab) => tab.id !== id);
    return {
        ...notebook,
        tabs,
        lists: notebook.lists.map((list) =>
            list.tabId === id ? { ...list, tabId: tabs[0].id } : list,
        ),
    };
}

/** List order is independent of task sorting; optional beforeId supports grid drops. */
export function moveNotebookList(
    notebook: TaskNotebook,
    id: string,
    tabId: string,
    beforeId?: string,
): TaskNotebook {
    const list = notebook.lists.find((item) => item.id === id);
    if (!list || id === beforeId) return notebook;
    const lists = notebook.lists.filter((item) => item.id !== id);
    const index = lists.findIndex((item) => item.id === beforeId && item.tabId === tabId);
    lists.splice(index < 0 ? lists.length : index, 0, { ...list, tabId });
    return notebookSchema.parse({ ...notebook, lists });
}
export function reorderNotebookTab(
    notebook: TaskNotebook,
    id: string,
    direction: -1 | 1,
): TaskNotebook {
    const tabs = [...notebook.tabs];
    const index = tabs.findIndex((tab) => tab.id === id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= tabs.length) return notebook;
    [tabs[index], tabs[destination]] = [tabs[destination], tabs[index]];
    return { ...notebook, tabs };
}

/** A tab drop uses the target's original position in either direction. */
export function moveNotebookTab(
    notebook: TaskNotebook,
    id: string,
    targetId: string,
): TaskNotebook {
    const from = notebook.tabs.findIndex((tab) => tab.id === id);
    const to = notebook.tabs.findIndex((tab) => tab.id === targetId);
    if (from < 0 || to < 0 || from === to) return notebook;
    const tabs = [...notebook.tabs];
    const [moved] = tabs.splice(from, 1);
    tabs.splice(to, 0, moved);
    return { ...notebook, tabs };
}
