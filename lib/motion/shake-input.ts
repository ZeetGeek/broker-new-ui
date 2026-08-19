import { readRootMs } from "@/lib/motion/css-var";

const shakeTimeoutByInput = new WeakMap<HTMLElement, number>();

export function shakeInput(wrap: HTMLElement, input: HTMLElement): void {
    wrap.classList.add("is-error");
    input.classList.add("is-error");

    input.classList.remove("is-shaking");
    void input.offsetWidth;
    input.classList.add("is-shaking");

    const previous = shakeTimeoutByInput.get(input);
    if (previous !== undefined) {
        window.clearTimeout(previous);
    }

    const shakeMs = readRootMs("--shake-dur-a", 80) * 2 + readRootMs("--shake-dur-b", 60) * 2;
    const timeoutId = window.setTimeout(() => {
        input.classList.remove("is-shaking");
        shakeTimeoutByInput.delete(input);
    }, shakeMs + 20);
    shakeTimeoutByInput.set(input, timeoutId);
}

export function clearInputError(wrap: HTMLElement, input: HTMLElement): void {
    wrap.classList.remove("is-error");
    input.classList.remove("is-error");
    input.classList.remove("is-shaking");

    const previous = shakeTimeoutByInput.get(input);
    if (previous !== undefined) {
        window.clearTimeout(previous);
        shakeTimeoutByInput.delete(input);
    }
}
