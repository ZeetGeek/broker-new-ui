"use client";

import { useEffect, useRef, useState } from "react";

/** Keep the same day-column density in the live planner and task history. */
export function usePlannerColumns() {
    const frame = useRef<HTMLElement>(null);
    const [preferredColumns, setPreferredColumns] = useState(5);
    const [availableColumns, setAvailableColumns] = useState(1);
    useEffect(() => {
        const element = frame.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) =>
            setAvailableColumns(
                entry.contentRect.width < 600 ? 1 : entry.contentRect.width < 1000 ? 3 : 7,
            ),
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return {
        frame,
        columns: Math.min(preferredColumns, availableColumns),
        availableColumns,
        setPreferredColumns,
    };
}
