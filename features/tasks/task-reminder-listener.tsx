"use client";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import type { NotificationItem } from "@/lib/api/notifications";
import { getNotificationSocket } from "@/lib/socket/notifications";
import { navigateWorkflow } from "@/lib/workflows/navigation";

import { IconButton } from "@/components/shared/icon-button";
import { Bell, X } from "@/components/shared/icons";
import { useWorkflow } from "@/components/shared/workflow-context";

import { useAppSelector } from "@/store/hooks";

import { taskDueLabel, taskDueReminders, taskReminderDescription } from "./model";
import { type ReminderToastContent, reminderToastContent } from "./reminder-toast";
import { useTasks } from "./task-store";

export function TaskReminderListener() {
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    if (!accountId) return null;
    if (isMockMode()) return <AccountTaskReminders key={accountId} accountId={accountId} />;
    return accessToken ? (
        <LiveReminders key={accountId} accountId={accountId} accessToken={accessToken} />
    ) : null;
}

// Toasts render outside the portal provider. Capture its current opener here,
// without reconnecting the notification socket whenever a panel opens or closes.
function useReminderOpener() {
    const open = useWorkflow();
    const latest = useRef(open);
    useEffect(() => {
        latest.current = open;
    }, [open]);
    return useCallback((href: string) => latest.current?.(href) ?? false, []);
}

function showReminderToast(
    id: string,
    content: ReminderToastContent,
    open: (href: string) => boolean,
) {
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
                    <p className="body-xs font-semibold text-brand-text">{content.title}</p>
                    <p className="body-sm mbs-1 font-semibold wrap-anywhere">{content.line}</p>
                    {content.detail && (
                        <p className="body-xs mbs-1 text-ink-subtle">{content.detail}</p>
                    )}
                    <Link
                        className="body-sm mbs-2 inline-flex items-center font-semibold text-brand-text underline-offset-4 min-block-9 hover:underline"
                        href={content.href}
                        onClick={() => toast.dismiss(notification.id)}
                        onNavigate={(event) =>
                            navigateWorkflow(event, undefined, open, content.href)
                        }
                    >
                        {content.action}
                    </Link>
                </div>
                <IconButton
                    size="sm"
                    aria-label="Dismiss reminder"
                    onClick={() => toast.dismiss(notification.id)}
                >
                    <X aria-hidden />
                </IconButton>
            </div>
        ),
        { id, duration: 12_000 },
    );
}

function LiveReminders({ accountId, accessToken }: { accountId: string; accessToken: string }) {
    const queryClient = useQueryClient();
    const open = useReminderOpener();
    useEffect(() => {
        const socket = getNotificationSocket(accessToken);
        const shown = new Set<string>();
        const onCreated = (item: NotificationItem) => {
            const content = reminderToastContent(item);
            if (!content) return;
            const id = `reminder-${item.id}`;
            shown.add(id);
            showReminderToast(id, content, open);
            if (content.kind === "task") {
                void queryClient.invalidateQueries({ queryKey: ["tasks", accountId] });
            }
        };
        socket.on("notification.created", onCreated);
        return () => {
            socket.off("notification.created", onCreated);
            shown.forEach((id) => toast.dismiss(id));
        };
    }, [accessToken, accountId, queryClient, open]);
    return null;
}

function AccountTaskReminders({ accountId }: { accountId: string }) {
    const { tasks, update, busy } = useTasks(accountId);
    const open = useReminderOpener();
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
                    showReminderToast(
                        id,
                        {
                            kind: "task",
                            title: "Task reminder",
                            line: task.title,
                            detail: `${taskReminderDescription(reminder)} · ${taskDueLabel(task)}`,
                            href: `/broker/tasks?view=detail&task=${encodeURIComponent(task.id)}`,
                            action: "View task",
                        },
                        open,
                    );
                }
            } catch {
                return;
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
    }, [tasks, update, busy, accountId, open]);
    return null;
}
