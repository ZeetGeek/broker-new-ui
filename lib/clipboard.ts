/**
 * Copy text to the clipboard, with a fallback for the browsers that matter
 * here.
 *
 * `navigator.clipboard` needs a secure context and is missing or blocked on a
 * fair share of the older Android WebViews this product runs in. The hidden
 * input + `execCommand` path is deprecated everywhere and still the only thing
 * that works there, so it stays until those phones do not.
 *
 * Returns whether the text actually landed, so the caller can say "Copied"
 * only when it is true — a confirmation for a copy that silently failed is
 * worse than no confirmation.
 */
export async function copyText(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        try {
            const input = document.createElement("textarea");
            input.value = value;
            input.setAttribute("readonly", "");
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.appendChild(input);
            input.select();
            const copied = document.execCommand("copy");
            document.body.removeChild(input);
            return copied;
        } catch {
            return false;
        }
    }
}
