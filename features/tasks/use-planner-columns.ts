"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    plannerColumnPickerOptions,
    resolvePlannerVisibleColumns,
} from "@/lib/tasks/planner-column-options";

/** Keep the same day-column density in the live planner and task history. */
export function usePlannerColumns(populatedDayCount: number, calendar = false) {
    const frame = useRef<HTMLElement>(null);
    const [preferredColumns, setPreferredColumns] = useState(5);
    const [viewportMax, setViewportMax] = useState(1);
    useEffect(() => {
        const element = frame.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) =>
            setViewportMax(
                entry.contentRect.width < 600 ? 1 : entry.contentRect.width < 1000 ? 3 : 7,
            ),
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const pickerOptions = useMemo(
        () => plannerColumnPickerOptions(populatedDayCount, viewportMax, calendar),
        [populatedDayCount, viewportMax, calendar],
    );
    useEffect(() => {
        if (!pickerOptions.length) return;
        setPreferredColumns((current) =>
            pickerOptions.includes(current) ? current : Math.max(...pickerOptions),
        );
    }, [pickerOptions]);
    const columns = useMemo(
        () =>
            resolvePlannerVisibleColumns(
                preferredColumns,
                populatedDayCount,
                viewportMax,
                pickerOptions,
                calendar,
            ),
        [preferredColumns, populatedDayCount, viewportMax, pickerOptions, calendar],
    );
    return {
        frame,
        columns,
        viewportMax,
        pickerOptions,
        setPreferredColumns,
    };
}
