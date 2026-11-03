/** Scroll only the form body. Scrolling all ancestors can move the modal's header. */
export function scrollPropertyFormField(target: HTMLElement): boolean {
    const container = target.closest<HTMLElement>("[data-property-form-scroll]");
    if (!container) return false;

    const fieldBounds = target.getBoundingClientRect();
    const containerBounds = container.getBoundingClientRect();
    const centeredTop =
        container.scrollTop +
        fieldBounds.top -
        containerBounds.top -
        container.clientTop -
        (container.clientHeight - fieldBounds.height) / 2;
    const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({
        top: Math.max(0, Math.min(maxTop, centeredTop)),
        behavior: reduceMotion ? "instant" : "smooth",
    });
    return true;
}
