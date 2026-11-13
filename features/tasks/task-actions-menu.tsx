"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
    portalProfileMenuItemClass,
    PortalProfileMenuSeparator,
    portalProfileMenuSurfaceClass,
} from "@/components/layout/portal-profile-menu";
import {
    ArrowRight,
    Bell,
    CalendarClock,
    Check,
    CircleSlash,
    FileText,
    Flag,
    FlagFilled,
    MoreHorizontal,
    Pencil,
    Plus,
    RotateCcw,
    Sun,
    Trash2,
    X,
} from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    type Task,
    TASK_PRIORITY_LABELS,
    taskDateKey,
    taskDateLabel,
    taskReminderLabel,
} from "./model";
import { type TaskQuickChange } from "./quick-actions";
import { shiftTaskDate } from "./recurrence";
import type { TaskRowActions } from "./task-list";

import planner from "./planner.module.css";
import styles from "./task-actions-menu.module.css";

export function TaskActionsMenu({
    task,
    busy,
    now,
    onQuickChange,
    onOpen,
    onIntent,
    onComplete,
}: Pick<TaskRowActions, "busy" | "now" | "onQuickChange" | "onOpen" | "onIntent" | "onComplete"> & {
    task: Task;
}) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);
    const afterClose = useRef<(() => void) | null>(null);
    const disabled = busy || saving;
    const today = taskDateKey(now);
    const save = async (change: TaskQuickChange) => {
        if (pending.current || busy) return;
        pending.current = true;
        setSaving(true);
        setError("");
        try {
            const saved = await onQuickChange(task, change);
            if (!saved) setError("Couldn't save this change. Check the schedule and try again.");
        } catch {
            setError("Couldn't save this change. Please try again.");
        } finally {
            pending.current = false;
            setSaving(false);
        }
    };
    const act = (action: () => void) => {
        afterClose.current = action;
        setOpen(false);
    };
    const dates = [
        { label: "Today", date: today, icon: Sun },
        { label: "Tomorrow", date: shiftTaskDate(today, 1)!, icon: ArrowRight },
        { label: "Next week", date: shiftTaskDate(today, 7)!, icon: CalendarClock },
        { label: "No date", date: null, icon: CircleSlash },
    ];
    return (
        <DropdownMenu
            modal={false}
            open={open}
            onOpenChangeComplete={(value) => {
                if (!value) {
                    const action = afterClose.current;
                    afterClose.current = null;
                    action?.();
                }
            }}
            onOpenChange={(value) => {
                setOpen(value);
                if (value) {
                    setError("");
                }
            }}
        >
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={planner.lineAction}
                        disabled={busy}
                        aria-label={`Actions for ${task.title}`}
                    />
                }
            >
                <MoreHorizontal aria-hidden size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={6}
                className={cn(portalProfileMenuSurfaceClass, styles.menu)}
                aria-label={`Actions for ${task.title}`}
                onPointerDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
            >
                <div className={styles.actions}>
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        disabled={disabled}
                        onClick={() => act(() => onOpen(task))}
                    >
                        <FileText aria-hidden />
                        Task details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        disabled={disabled}
                        onClick={() => act(() => onComplete(task))}
                    >
                        {task.completedAt ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
                        {task.completedAt ? "Reopen task" : "Mark complete"}
                    </DropdownMenuItem>
                </div>
                <PortalProfileMenuSeparator />
                <fieldset className={styles.section} disabled={disabled}>
                    <legend>
                        Date{" "}
                        <span>
                            {task.dueDate ? taskDateLabel(task.dueDate, now) : "Not scheduled"}
                        </span>
                    </legend>
                    <div className={styles.dateOptions}>
                        {dates.map(({ label, date, icon: Icon }) => (
                            <Tooltip key={label}>
                                <TooltipTrigger
                                    render={
                                        <button
                                            type="button"
                                            aria-pressed={task.dueDate === date}
                                            aria-label={label}
                                            onClick={() => void save({ dueDate: date })}
                                        />
                                    }
                                >
                                    <Icon aria-hidden />
                                    <span className="sr-only">{label}</span>
                                </TooltipTrigger>
                                <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                    {task.reminders.length > 0 && (
                        <p className={styles.hint}>
                            Removing the date or time also removes due-time reminders.
                        </p>
                    )}
                </fieldset>
                <fieldset className={styles.section} disabled={disabled}>
                    <legend>
                        Priority <span>{TASK_PRIORITY_LABELS[task.priority]}</span>
                    </legend>
                    <div className={styles.priorities}>
                        {(["urgent", "high", "medium", "low"] as const).map((priority) => (
                            <button
                                key={priority}
                                type="button"
                                aria-label={TASK_PRIORITY_LABELS[priority]}
                                title={TASK_PRIORITY_LABELS[priority]}
                                aria-pressed={task.priority === priority}
                                data-priority={priority}
                                onClick={() => void save({ priority })}
                            >
                                {priority === "low" ? (
                                    <Flag aria-hidden />
                                ) : (
                                    <FlagFilled aria-hidden />
                                )}
                            </button>
                        ))}
                    </div>
                </fieldset>
                <PortalProfileMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className={portalProfileMenuItemClass}>
                        <Bell aria-hidden />
                        Reminders
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent
                        className={cn(portalProfileMenuSurfaceClass, styles.reminderSubmenu)}
                        sideOffset={6}
                    >
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <div
                                        className={styles.reminderChips}
                                        role="group"
                                        aria-label="Due-time reminders"
                                        tabIndex={!task.dueDate || !task.dueTime ? 0 : -1}
                                    />
                                }
                            >
                                {[...new Set([...task.reminders, 0, 15, 30, 60])].map((value) => {
                                    const selected = task.reminders.includes(value);
                                    const label = taskReminderLabel(value).replace(
                                        /\bminutes?\b/,
                                        "min",
                                    );
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={value}
                                            checked={selected}
                                            className={styles.reminderChip}
                                            closeOnClick={false}
                                            disabled={disabled || !task.dueDate || !task.dueTime}
                                            aria-label={
                                                (selected ? "Remove " : "Add ") +
                                                label.toLowerCase() +
                                                " reminder"
                                            }
                                            onCheckedChange={(checked) =>
                                                void save({
                                                    reminders: checked
                                                        ? [...task.reminders, value]
                                                        : task.reminders.filter(
                                                              (offset) => offset !== value,
                                                          ),
                                                })
                                            }
                                        >
                                            {label}
                                            {selected ? <X aria-hidden /> : <Plus aria-hidden />}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                            </TooltipTrigger>
                            {(!task.dueDate || !task.dueTime) && (
                                <TooltipContent>
                                    Set a due date and time to use reminders.
                                </TooltipContent>
                            )}
                        </Tooltip>
                        <PortalProfileMenuSeparator />
                        <DropdownMenuItem
                            className={portalProfileMenuItemClass}
                            disabled={disabled}
                            onClick={() => act(() => onIntent(task, "reminder"))}
                        >
                            <Bell aria-hidden />
                            Custom reminders
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <PortalProfileMenuSeparator />
                <div className={styles.actions}>
                    <DropdownMenuItem
                        className={portalProfileMenuItemClass}
                        disabled={disabled}
                        onClick={() => act(() => onIntent(task, "edit"))}
                    >
                        <Pencil aria-hidden />
                        Edit all details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={cn(portalProfileMenuItemClass, styles.delete)}
                        variant="destructive"
                        disabled={disabled}
                        onClick={() => act(() => onIntent(task, "delete"))}
                    >
                        <Trash2 aria-hidden />
                        Delete task
                    </DropdownMenuItem>
                </div>
                <p
                    className={error || saving ? styles.feedback : "sr-only"}
                    role={error ? "alert" : "status"}
                    data-error={!!error}
                >
                    {error || (saving ? "Saving…" : "Changes save automatically")}
                </p>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
