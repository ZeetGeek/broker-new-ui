"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Bell, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/store/hooks";

import { taskDueLabel, taskDueReminders, taskReminderLabel } from "./model";
import { useTasks } from "./preview-store";

/** Mock in-app delivery only. There is no browser permission or background push. */
export function TaskReminderListener() {
    const accountId = useAppSelector((state) => state.auth.user?.id);
    return accountId ? <AccountTaskReminders key={accountId} accountId={accountId} /> : null;
}

function AccountTaskReminders({ accountId }: { accountId: string }) {
    const { tasks, update, busy } = useTasks(accountId);
    const processing = useRef(false);
    const mounted = useRef(false);
    const activeToasts = useRef(new Set<string>());
    useEffect(() => {
        mounted.current = true;
        const notifications = activeToasts.current;
        return () => {
            mounted.current = false;
            notifications.forEach((id) => toast.dismiss(id));
        };
    }, []);
    useEffect(() => {
        const check = async () => {
            if (processing.current || busy) return;
            const now = Date.now();
            const due = tasks.flatMap((task) =>
                taskDueReminders(task, now).map((reminder) => ({ task, reminder })),
            );
            if (!due.length) return;
            processing.current = true;
            try {
                const delivered: typeof due = [];
                await update((latest) =>
                    latest.map((task) => {
                        const eligible = taskDueReminders(task, now).filter((reminder) =>
                            due.some(
                                (candidate) =>
                                    candidate.task.id === task.id &&
                                    candidate.reminder.key === reminder.key,
                            ),
                        );
                        if (!eligible.length) return task;
                        delivered.push(...eligible.map((reminder) => ({ task, reminder })));
                        return {
                            ...task,
                            deliveredReminderKeys: [
                                ...new Set([
                                    ...task.deliveredReminderKeys,
                                    ...eligible.map((reminder) => reminder.key),
                                ]),
                            ],
                        };
                    }),
                );
                if (!mounted.current) return;
                for (const { task, reminder } of delivered) {
                    const id = `task-reminder-${accountId}-${task.id}-${reminder.key}`;
                    activeToasts.current.add(id);
                    toast.custom(
                        (notification) => (
                            <div
                                role="status"
                                className="flex items-start gap-3 rounded-card border border-border-warm bg-surface p-4 text-ink shadow-lg inline-[min(24rem,calc(100vw-2rem))]"
                            >
                                <span className="flex shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-text block-9 inline-9">
                                    <Bell className="block-5 inline-5" aria-hidden />
                                </span>
                                <div className="min-inline-0">
                                    <p className="body-xs font-semibold text-brand-text">
                                        Task reminder
                                    </p>
                                    <p className="body-sm mbs-1 font-semibold wrap-anywhere">
                                        {task.title}
                                    </p>
                                    <p className="body-xs mbs-1 text-ink-subtle">
                                        {taskReminderLabel(reminder.minutes)} · {taskDueLabel(task)}
                                    </p>
                                    <Link
                                        className="body-sm mbs-2 inline-flex items-center font-semibold text-brand-text underline-offset-4 min-block-9 hover:underline"
                                        href={`/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`}
                                        onClick={() => toast.dismiss(notification.id)}
                                    >
                                        View task
                                    </Link>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Dismiss reminder"
                                    onClick={() => toast.dismiss(notification.id)}
                                >
                                    <X aria-hidden />
                                </Button>
                            </div>
                        ),
                        { id, duration: 12_000 },
                    );
                }
            } catch {
                /* Keep the reminder pending when tab storage is unavailable. */
            } finally {
                processing.current = false;
            }
        };
        void check();
        const timer = window.setInterval(() => void check(), 5_000);
        const onVisible = () => {
            if (document.visibilityState === "visible") void check();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [tasks, update, busy, accountId]);
    return null;
}
