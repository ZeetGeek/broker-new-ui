import { type TaskDto, tasksApi, type TaskWriteDto } from "@/lib/api/tasks";

import { type Task, taskSchema } from "./model";

export type TaskOp =
    | { kind: "create"; task: Task }
    | { kind: "complete"; id: string; nextId?: string }
    | { kind: "reopen"; id: string }
    | { kind: "remove"; id: string }
    | { kind: "restore"; id: string }
    | { kind: "delivered"; id: string; keys: string[] }
    | { kind: "patch"; items: ({ id: string } & TaskWriteDto)[] };

const WRITABLE_KEYS = [
    "title",
    "details",
    "startDate",
    "startTime",
    "dueDate",
    "dueTime",
    "repeat",
    "repeatAnchor",
    "reminders",
    "deliveredReminderKeys",
    "startReminderEnabledAt",
    "priority",
    "priorityAt",
    "clientId",
    "propertyId",
    "ownerId",
    "ownerType",
    "listId",
    "plannerOrder",
] as const satisfies readonly (keyof TaskWriteDto & keyof Task)[];

type WritableKey = (typeof WRITABLE_KEYS)[number];

const DELIVERY_KEYS = new Set<WritableKey>(["deliveredReminderKeys", "startReminderEnabledAt"]);
const PATCH_CHUNK = 200;

function value(task: Task, key: WritableKey): unknown {
    return task[key] ?? null;
}

function sameValue(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function taskWrite(task: Task): TaskWriteDto {
    const write: Record<string, unknown> = {};
    for (const key of WRITABLE_KEYS) write[key] = value(task, key);
    return write as TaskWriteDto;
}

export function taskFromDto(dto: TaskDto): Task {
    return taskSchema.parse(dto);
}

export function diffTasks(before: Task[], after: Task[]): TaskOp[] {
    const previous = new Map(before.map((task) => [task.id, task]));
    const next = new Map(after.map((task) => [task.id, task]));
    const completing = new Set<string>();
    const reopening = new Set<string>();
    for (const task of after) {
        const old = previous.get(task.id);
        if (!old) continue;
        if (!old.completedAt && task.completedAt) completing.add(task.id);
        if (old.completedAt && !task.completedAt) reopening.add(task.id);
    }

    const creates: TaskOp[] = [];
    const lifecycle: TaskOp[] = [];
    const deliveries: TaskOp[] = [];
    const items: ({ id: string } & TaskWriteDto)[] = [];
    const successors = new Map<string, string>();

    for (const task of after) {
        if (previous.has(task.id)) continue;
        if (task.repeatFromId && completing.has(task.repeatFromId)) {
            successors.set(task.repeatFromId, task.id);
            continue;
        }
        creates.push({ kind: "create", task });
    }
    for (const task of before) {
        if (next.has(task.id)) continue;
        if (task.repeatFromId && reopening.has(task.repeatFromId)) continue;
        lifecycle.push({ kind: "remove", id: task.id });
    }

    for (const task of after) {
        const old = previous.get(task.id);
        if (!old) continue;
        if (completing.has(task.id)) {
            const nextId = successors.get(task.id);
            lifecycle.push({ kind: "complete", id: task.id, ...(nextId ? { nextId } : {}) });
        }
        if (reopening.has(task.id)) lifecycle.push({ kind: "reopen", id: task.id });
        if (!old.deletedAt && task.deletedAt) lifecycle.push({ kind: "remove", id: task.id });
        if (old.deletedAt && !task.deletedAt) lifecycle.push({ kind: "restore", id: task.id });

        const changed = WRITABLE_KEYS.filter(
            (key) => !sameValue(value(old, key), value(task, key)),
        );
        if (!changed.length) continue;
        const added = task.deliveredReminderKeys.filter(
            (key) => !old.deliveredReminderKeys.includes(key),
        );
        const onlyAdditions =
            changed.every((key) => DELIVERY_KEYS.has(key)) &&
            old.deliveredReminderKeys.every((key) => task.deliveredReminderKeys.includes(key));
        const patchKeys = onlyAdditions
            ? changed.filter((key) => key !== "deliveredReminderKeys")
            : changed;
        if (onlyAdditions && added.length) {
            deliveries.push({ kind: "delivered", id: task.id, keys: added });
        }
        if (!patchKeys.length) continue;
        const item: Record<string, unknown> = { id: task.id };
        for (const key of patchKeys) item[key] = value(task, key);
        if (patchKeys.includes("ownerId") || patchKeys.includes("ownerType")) {
            item.ownerId = value(task, "ownerId");
            item.ownerType = task.ownerId ? value(task, "ownerType") : null;
        }
        items.push(item as { id: string } & TaskWriteDto);
    }

    const patches: TaskOp[] = [];
    for (let index = 0; index < items.length; index += PATCH_CHUNK) {
        patches.push({ kind: "patch", items: items.slice(index, index + PATCH_CHUNK) });
    }
    return [...creates, ...lifecycle, ...deliveries, ...patches];
}

export async function applyTaskOps(
    ops: TaskOp[],
    current: Task[],
    api: typeof tasksApi = tasksApi,
): Promise<Task[]> {
    const tasks = new Map(current.map((task) => [task.id, task]));
    const order = current.map((task) => task.id);
    const put = (dto: TaskDto) => {
        if (!tasks.has(dto.id)) order.push(dto.id);
        tasks.set(dto.id, taskFromDto(dto));
    };
    for (const op of ops) {
        switch (op.kind) {
            case "create":
                put(await api.create({ id: op.task.id, ...taskWrite(op.task) }));
                break;
            case "complete": {
                const result = await api.complete(op.id, op.nextId);
                if (op.nextId && !result.tasks.some((task) => task.id === op.nextId)) {
                    tasks.delete(op.nextId);
                }
                result.tasks.forEach(put);
                break;
            }
            case "reopen": {
                const result = await api.reopen(op.id);
                result.removedIds.forEach((id) => tasks.delete(id));
                result.tasks.forEach(put);
                break;
            }
            case "remove":
                if (tasks.has(op.id)) put(await api.remove(op.id));
                else await api.remove(op.id);
                break;
            case "restore":
                put(await api.restore(op.id));
                break;
            case "delivered":
                put(await api.delivered(op.id, op.keys));
                break;
            case "patch":
                if (op.items.length === 1) {
                    const { id, ...patch } = op.items[0];
                    put(await api.update(id, patch));
                } else {
                    (await api.bulkUpdate(op.items)).forEach(put);
                }
                break;
        }
    }
    return order.filter((id) => tasks.has(id)).map((id) => tasks.get(id)!);
}
