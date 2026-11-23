export type WorkflowNavigationEvent = { preventDefault: () => void };

/** Next invokes onNavigate only for ordinary clicks; retain any incumbent local panel first. */
export function navigateWorkflow(
    event: WorkflowNavigationEvent,
    onNavigate: ((event: WorkflowNavigationEvent) => void) | undefined,
    open: ((href: string) => boolean) | null,
    href: unknown,
    openPerson?: ((href: string) => boolean) | null,
): void {
    let prevented = false;
    onNavigate?.({
        preventDefault: () => {
            prevented = true;
            event.preventDefault();
        },
    });
    if (!prevented && typeof href === "string" && (open?.(href) || openPerson?.(href)))
        event.preventDefault();
}
