import { readRootMs } from "@/lib/motion/css-var";

const pendingByElement = new WeakMap<HTMLElement, number>();

export function swapText(element: HTMLElement, next: string): void {
    const current = element.textContent ?? "";
    if (current === next) {
        return;
    }

    const pending = pendingByElement.get(element);
    if (pending !== undefined) {
        window.clearTimeout(pending);
        pendingByElement.delete(element);
    }

    if (!current) {
        element.textContent = next;
        return;
    }

    const durationMs = readRootMs("--text-swap-dur", 200);
    element.classList.remove("is-enter-start");
    element.classList.add("is-exit");

    const timeoutId = window.setTimeout(() => {
        pendingByElement.delete(element);
        element.textContent = next;
        element.classList.remove("is-exit");
        element.classList.add("is-enter-start");
        void element.offsetHeight;
        element.classList.remove("is-enter-start");
    }, durationMs);

    pendingByElement.set(element, timeoutId);
}
