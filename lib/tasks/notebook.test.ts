import assert from "node:assert/strict";
import test from "node:test";

import {
    addNotebookList,
    addNotebookTab,
    defaultNotebook,
    deleteNotebookList,
    deleteNotebookTab,
    moveNotebookList,
    moveNotebookTab,
    notebookSchema,
    renameNotebookItem,
    reorderNotebookTab,
    taskListId,
} from "@/features/tasks/notebook-model";
import { notebookPreviewStore } from "@/features/tasks/notebook-store";
import {
    createPlannerTask,
    movePlannerTask,
    setTaskDeleted,
    sortPlannerTasks,
} from "@/features/tasks/planner-model";

const now = Date.parse("2030-01-02T09:00:00Z");

test("dragging tabs left and right changes order without changing lists or tab IDs", () => {
    let notebook = addNotebookTab(defaultNotebook(), "Work", "work");
    notebook = addNotebookTab(notebook, "Personal", "personal");
    const lists = notebook.lists;
    const movedRight = moveNotebookTab(notebook, "my-lists", "personal");
    assert.deepEqual(
        movedRight.tabs.map((tab) => tab.id),
        ["work", "personal", "my-lists"],
    );
    const movedLeft = moveNotebookTab(movedRight, "my-lists", "work");
    assert.deepEqual(
        movedLeft.tabs.map((tab) => tab.id),
        ["my-lists", "work", "personal"],
    );
    assert.equal(movedLeft.lists, lists);
    assert.equal(moveNotebookTab(notebook, "work", "work"), notebook);
    assert.equal(moveNotebookTab(notebook, "missing", "work"), notebook);
    assert.deepEqual(
        notebook.tabs.map((tab) => tab.id),
        ["my-lists", "work", "personal"],
    );
});

test("old undated tasks resolve into Someday, and creating tabs/lists preserves their inbox", () => {
    const original = defaultNotebook();
    const expanded = addNotebookList(
        addNotebookTab(original, "  Documents  ", "docs"),
        "docs",
        "Owner papers",
        "papers",
    );
    assert.equal(expanded.tabs[1].name, "Documents");
    assert.equal(taskListId({}, expanded), "someday");
    assert.equal(taskListId({ listId: "papers" }, expanded), "papers");
    assert.equal(original.tabs.length, 1);
    assert.equal(expanded.inboxListId, original.inboxListId);
    assert.throws(() => addNotebookTab(expanded, " ", "empty"));
    assert.throws(() => addNotebookList(expanded, "missing-tab", "Broken", "broken"));
    assert.throws(() => addNotebookTab(expanded, "Duplicate ID", "docs"));
});

test("list reordering and moving between tabs keep stable list IDs and task assignments", () => {
    let notebook = addNotebookTab(defaultNotebook(), "Personal", "personal");
    notebook = addNotebookList(notebook, "my-lists", "Brochures", "brochures");
    notebook = addNotebookList(notebook, "my-lists", "Calls", "calls");
    notebook = moveNotebookList(notebook, "calls", "my-lists", "someday");
    assert.deepEqual(
        notebook.lists.map((list) => list.id),
        ["calls", "someday", "brochures"],
    );
    notebook = moveNotebookList(notebook, "calls", "personal");
    assert.equal(notebook.lists.find((list) => list.id === "calls")?.tabId, "personal");
    assert.equal(taskListId({ listId: "calls" }, notebook), "calls");
    assert.equal(notebook.lists.length, 3);
    assert.deepEqual(
        reorderNotebookTab(notebook, "personal", -1).tabs.map((tab) => tab.id),
        ["personal", "my-lists"],
    );
});

test("renaming and deleting a tab preserve its lists and their task IDs", () => {
    let notebook = addNotebookList(
        addNotebookTab(defaultNotebook(), "Documents", "docs"),
        "docs",
        "Papers",
        "papers",
    );
    notebook = renameNotebookItem(notebook, "tab", "docs", "Owner documents");
    notebook = renameNotebookItem(notebook, "list", "papers", "Consent forms");
    assert.equal(notebook.tabs[1].name, "Owner documents");
    notebook = deleteNotebookTab(notebook, "docs");
    assert.equal(notebook.tabs.length, 1);
    assert.equal(notebook.lists.find((list) => list.id === "papers")?.name, "Consent forms");
    assert.equal(notebook.lists.find((list) => list.id === "papers")?.tabId, "my-lists");
    assert.equal(taskListId({ listId: "papers" }, notebook), "papers");
    assert.throws(() => deleteNotebookTab(notebook, "my-lists"), /at least one tab/);
});

test("deleting a list recovers its tasks into the inbox, including completed/deleted records", () => {
    let notebook = addNotebookList(defaultNotebook(), "my-lists", "Calls", "calls");
    const task = createPlannerTask("Call the owner", null, now, "owner-call", "calls");
    notebook = deleteNotebookList(notebook, "calls");
    assert.equal(taskListId(task, notebook), notebook.inboxListId);
    assert.equal(
        taskListId(setTaskDeleted([task], task.id, true, now)[0], notebook),
        notebook.inboxListId,
    );
    assert.equal(task.listId, "calls");
    assert.throws(() => deleteNotebookList(notebook, "someday"), /at least one list/);
    const next = deleteNotebookList(
        addNotebookList(notebook, "my-lists", "New inbox", "new-inbox"),
        "someday",
    );
    assert.equal(next.inboxListId, "new-inbox");
    assert.equal(taskListId({}, next), "new-inbox");
});

test("task moves and ordering within named lists don't mix other list contents or CRM links", () => {
    const a = { ...createPlannerTask("First", null, now, "a", "calls"), clientId: "client-1" };
    const b = createPlannerTask("Second", null, now, "b", "papers");
    const c = createPlannerTask("Third", null, now, "c", "papers");
    const moved = movePlannerTask([a, b, c], "a", null, "c", now, "papers");
    assert.equal(moved[0].listId, "papers");
    assert.equal(moved[0].clientId, "client-1");
    assert.deepEqual(
        sortPlannerTasks(
            moved.filter((task) => task.listId === "papers"),
            "due",
        ).map((task) => task.id),
        ["b", "a", "c"],
    );
    const scheduled = movePlannerTask(moved, "a", "2030-01-03", undefined, now);
    assert.equal(scheduled[0].listId, "papers");
    assert.equal(scheduled[0].dueDate, "2030-01-03");
});

test("notebook storage survives reads, isolates accounts and refuses corrupted data without overwriting it", () => {
    const values = new Map<string, string>();
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        },
    });
    try {
        assert.deepEqual(notebookPreviewStore.read("broker-a"), defaultNotebook());
        notebookPreviewStore.update("broker-a", (latest) => addNotebookTab(latest, "Work", "work"));
        notebookPreviewStore.update("broker-a", (latest) =>
            addNotebookList(latest, "work", "Calls", "calls"),
        );
        assert.equal(notebookPreviewStore.read("broker-a").lists[1].name, "Calls");
        assert.deepEqual(notebookPreviewStore.read("broker-b"), defaultNotebook());
        const key = "crm.private-task-lists.mock.v1.broker-a";
        values.set(key, "damaged data");
        assert.throws(
            () => notebookPreviewStore.update("broker-a", defaultNotebook),
            /couldn't load/,
        );
        assert.equal(values.get(key), "damaged data");
        assert.equal(
            notebookSchema.safeParse({ ...defaultNotebook(), inboxListId: "missing" }).success,
            false,
        );
    } finally {
        if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});
