export type ShortcutGuardOptions = {
    allowInDialog?: boolean;
    allowInEditable?: boolean;
};

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return Boolean(
        target.closest(
            `input, textarea, select, [role="textbox"], [contenteditable]:not([contenteditable="false"])`,
        ),
    );
}

export function hasOpenShortcutBlockingDialog(): boolean {
    return Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]'),
    ).some((dialog) => !dialog.hidden && dialog.getAttribute("aria-hidden") !== "true");
}

export function isShortcutEventBlocked(
    event: KeyboardEvent,
    { allowInDialog = false, allowInEditable = false }: ShortcutGuardOptions = {},
): boolean {
    if (event.defaultPrevented || event.repeat || event.isComposing) return true;
    if (!allowInEditable && isEditableShortcutTarget(event.target)) return true;
    if (!allowInDialog && hasOpenShortcutBlockingDialog()) return true;
    return false;
}
