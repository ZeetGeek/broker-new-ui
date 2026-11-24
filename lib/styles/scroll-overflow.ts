/** Watch the actual scrolling surfaces inside a modal, including library viewports. */
export function observeScrollOverflow(
    root: HTMLElement,
    onChange: (hasMoreBelow: boolean) => void,
) {
    const view = root.ownerDocument.defaultView;
    if (!view) return () => {};

    let frame: number | null = null;
    let rescan = true;
    let stopped = false;
    let viewports: HTMLElement[] = [];
    const observed = new Set<Element>();

    function schedule(scan = false) {
        rescan ||= scan;
        if (frame === null && !stopped) frame = view!.requestAnimationFrame(update);
    }

    const resizeObserver = new ResizeObserver(() => schedule(true));
    const mutationObserver = new MutationObserver(() => schedule(true));

    function update() {
        frame = null;
        if (stopped) return;
        if (rescan) {
            rescan = false;
            const scrollable = [root, ...root.querySelectorAll<HTMLElement>("*")].filter(
                (node) =>
                    node.clientHeight > 0 &&
                    node.scrollHeight - node.clientHeight > 1 &&
                    /^(auto|scroll|overlay)$/.test(view!.getComputedStyle(node).overflowY),
            );
            const candidates = new Set(scrollable);
            // An independently scrolling list must not keep the modal shadow on
            // once its outer scrollable body has reached the end.
            viewports = scrollable.filter((node) => {
                for (
                    let parent = node.parentElement;
                    parent && root.contains(parent);
                    parent = parent.parentElement
                ) {
                    if (candidates.has(parent)) return false;
                }
                return true;
            });

            const targets = new Set<Element>([root, ...root.children]);
            for (const viewport of viewports) {
                targets.add(viewport);
                for (const child of viewport.children) targets.add(child);
            }
            for (const node of observed) {
                if (!targets.has(node)) {
                    resizeObserver.unobserve(node);
                    observed.delete(node);
                }
            }
            for (const node of targets) {
                if (!observed.has(node)) {
                    resizeObserver.observe(node);
                    observed.add(node);
                }
            }
        }
        onChange(
            viewports.some(
                (node) => node.scrollHeight - node.clientHeight - Math.max(0, node.scrollTop) > 1,
            ),
        );
    }

    const onScroll = () => schedule();
    root.addEventListener("scroll", onScroll, { capture: true, passive: true });
    mutationObserver.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "open"],
    });
    schedule(true);

    return () => {
        stopped = true;
        if (frame !== null) view.cancelAnimationFrame(frame);
        root.removeEventListener("scroll", onScroll, true);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
    };
}
