export const PLANNER_DAY_COUNTS = [1, 3, 5, 7] as const;

/** Show an N-day control only when there are more than N populated date columns. */
export function plannerColumnPickerOptions(
    populatedDayCount: number,
    viewportMax: number,
): number[] {
    if (populatedDayCount <= 0) return [];
    return PLANNER_DAY_COUNTS.filter((count) => populatedDayCount > count && count <= viewportMax);
}

export function resolvePlannerVisibleColumns(
    preferredColumns: number,
    populatedDayCount: number,
    viewportMax: number,
    pickerOptions: number[],
): number {
    if (populatedDayCount <= 0) return Math.min(Math.max(preferredColumns, 1), viewportMax);
    const maxVisible = Math.min(viewportMax, populatedDayCount);
    if (!pickerOptions.length) return Math.min(maxVisible, 1);
    const chosen = pickerOptions.includes(preferredColumns)
        ? preferredColumns
        : Math.max(...pickerOptions);
    return Math.min(chosen, maxVisible);
}
