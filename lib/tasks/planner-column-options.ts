export const PLANNER_DAY_COUNTS = [1, 3, 5, 7] as const;

/** Show an N-day control only when there are more than N populated date columns. */
export function plannerColumnPickerOptions(
    populatedDayCount: number,
    viewportMax: number,
    calendar = false,
): number[] {
    if (calendar) {
        const fits = PLANNER_DAY_COUNTS.filter((count) => count <= viewportMax);
        return fits.length > 1 ? [...fits] : [];
    }
    if (populatedDayCount <= 0) return [];
    return PLANNER_DAY_COUNTS.filter((count) => populatedDayCount > count && count <= viewportMax);
}

export function resolvePlannerVisibleColumns(
    preferredColumns: number,
    populatedDayCount: number,
    viewportMax: number,
    pickerOptions: number[],
    calendar = false,
): number {
    if (calendar) {
        if (!pickerOptions.length) return Math.min(Math.max(preferredColumns, 1), viewportMax);
        const chosen = pickerOptions.includes(preferredColumns)
            ? preferredColumns
            : Math.max(...pickerOptions);
        return Math.min(chosen, viewportMax);
    }
    if (populatedDayCount <= 0) return Math.min(Math.max(preferredColumns, 1), viewportMax);
    const maxVisible = Math.min(viewportMax, populatedDayCount);
    if (!pickerOptions.length) return Math.min(maxVisible, 1);
    const chosen = pickerOptions.includes(preferredColumns)
        ? preferredColumns
        : Math.max(...pickerOptions);
    return Math.min(chosen, maxVisible);
}

export function plannerColumnLabel(count: number): { label: string; ariaLabel: string } {
    return count === 1
        ? { label: "1 Col", ariaLabel: "Show one column" }
        : { label: `${count} Cols`, ariaLabel: `Show ${count} columns` };
}
