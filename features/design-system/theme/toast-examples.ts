import { APP_TOAST_MESSAGES, type ToastMessage } from "@/lib/toast/messages";

import type { AppToastVariant } from "@/components/shared/app-toast";

export const TOAST_EXAMPLES: readonly ToastMessage[] = APP_TOAST_MESSAGES;

export {
    APP_TOAST_GROUPS as TOAST_GROUPS,
    type ToastMessage as ToastExample,
} from "@/lib/toast/messages";

export const TOAST_VARIANTS: {
    variant: AppToastVariant;
    label: string;
    exampleId: string;
    note: string;
}[] = [
    {
        variant: "success",
        label: "Success",
        exampleId: "property-created",
        note: "Confirm a completed action.",
    },
    {
        variant: "reminder",
        label: "Reminder",
        exampleId: "task-reminder",
        note: "Bring a task or visit back into focus.",
    },
    {
        variant: "error",
        label: "Error",
        exampleId: "save-error",
        note: "Explain the problem and offer recovery.",
    },
    {
        variant: "warning",
        label: "Warning",
        exampleId: "offline",
        note: "Flag something that needs attention.",
    },
    {
        variant: "info",
        label: "Information",
        exampleId: "duplicate",
        note: "Give useful context without alarm.",
    },
    {
        variant: "loading",
        label: "Loading",
        exampleId: "loading",
        note: "Stay visible while an operation is in progress.",
    },
];
