import type { AppToastContent } from "@/components/shared/app-toast";

import { APP_TOAST_MESSAGES, type ToastMessage, type ToastMessageId } from "./messages";

export type ToastContentOverrides = Partial<Omit<AppToastContent, "variant">>;

/** Preview action labels are examples; only a caller with a real handler creates a button. */
export function resolveToastContent(
    id: ToastMessageId,
    overrides: ToastContentOverrides = {},
): AppToastContent {
    const message: ToastMessage | undefined = APP_TOAST_MESSAGES.find((item) => item.id === id);
    if (!message) throw new Error(`Unknown toast message: ${id}`);
    return {
        variant: message.variant,
        title: overrides.title ?? message.title,
        description: "description" in overrides ? overrides.description : message.description,
        detail: "detail" in overrides ? overrides.detail : message.detail,
        action: overrides.action,
    };
}
