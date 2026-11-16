export const MAX_COMPOSER_UNDO = 50;

export type ComposerSnapshot<TSegment> = {
    segments: TSegment[];
    activeId: string | null;
};

export type ComposerUndoStacks<TSegment> = {
    past: ComposerSnapshot<TSegment>[];
    future: ComposerSnapshot<TSegment>[];
};

export function cloneComposerSnapshot<TSegment>(
    snapshot: ComposerSnapshot<TSegment>,
): ComposerSnapshot<TSegment> {
    return structuredClone(snapshot);
}

export function pushComposerPast<TSegment>(
    stacks: ComposerUndoStacks<TSegment>,
    current: ComposerSnapshot<TSegment>,
): ComposerUndoStacks<TSegment> {
    const last = stacks.past.at(-1);
    if (last && JSON.stringify(last) === JSON.stringify(current)) {
        return { ...stacks, future: [] };
    }
    const past = [...stacks.past, cloneComposerSnapshot(current)].slice(-MAX_COMPOSER_UNDO);
    return { past, future: [] };
}

export function undoComposerState<TSegment>(
    stacks: ComposerUndoStacks<TSegment>,
    current: ComposerSnapshot<TSegment>,
): { stacks: ComposerUndoStacks<TSegment>; snapshot: ComposerSnapshot<TSegment> | null } {
    if (!stacks.past.length) return { stacks, snapshot: null };
    const past = [...stacks.past];
    const snapshot = past.pop()!;
    const future = [cloneComposerSnapshot(current), ...stacks.future];
    return { stacks: { past, future }, snapshot };
}

export function redoComposerState<TSegment>(
    stacks: ComposerUndoStacks<TSegment>,
    current: ComposerSnapshot<TSegment>,
): { stacks: ComposerUndoStacks<TSegment>; snapshot: ComposerSnapshot<TSegment> | null } {
    if (!stacks.future.length) return { stacks, snapshot: null };
    const future = [...stacks.future];
    const snapshot = future.shift()!;
    const past = [...stacks.past, cloneComposerSnapshot(current)];
    return { stacks: { past, future }, snapshot };
}

export function emptyComposerStacks<TSegment>(): ComposerUndoStacks<TSegment> {
    return { past: [], future: [] };
}
