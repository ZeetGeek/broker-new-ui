"use client";

import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type KeyboardEvent,
} from "react";

/**
 * Segmented day / month / year fields for the range picker.
 * Order is India `dd / mm / yyyy` (not US mm/dd).
 */
export function DateInput({ value, onChange }: { value?: Date; onChange: (date: Date) => void }) {
    const [date, setDate] = useState(() => partsFromDate(value ?? new Date()));
    const dayRef = useRef<HTMLInputElement | null>(null);
    const monthRef = useRef<HTMLInputElement | null>(null);
    const yearRef = useRef<HTMLInputElement | null>(null);
    const initialDate = useRef(date);

    useEffect(() => {
        const next = partsFromDate(value ?? new Date());
        setDate(next);
        initialDate.current = next;
    }, [value]);

    function validate(field: keyof DateParts, nextValue: number): boolean {
        if (field === "day" && (nextValue < 1 || nextValue > 31)) return false;
        if (field === "month" && (nextValue < 1 || nextValue > 12)) return false;
        if (field === "year" && (nextValue < 1000 || nextValue > 9999)) return false;
        const candidate = { ...date, [field]: nextValue };
        const d = new Date(candidate.year, candidate.month - 1, candidate.day);
        return (
            d.getFullYear() === candidate.year &&
            d.getMonth() + 1 === candidate.month &&
            d.getDate() === candidate.day
        );
    }

    function handleChange(field: keyof DateParts) {
        return (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value ? Number(e.target.value) : "";
            const next = { ...date, [field]: raw === "" ? 0 : raw };
            setDate(next);
            if (typeof raw === "number" && validate(field, raw)) {
                onChange(new Date(next.year, next.month - 1, next.day));
            }
        };
    }

    function handleBlur(field: keyof DateParts) {
        return (e: FocusEvent<HTMLInputElement>) => {
            if (!e.target.value) {
                setDate(initialDate.current);
                return;
            }
            const nextValue = Number(e.target.value);
            if (!validate(field, nextValue)) {
                setDate(initialDate.current);
            } else {
                initialDate.current = { ...date, [field]: nextValue };
            }
        };
    }

    function handleKeyDown(field: keyof DateParts) {
        return (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.metaKey || e.ctrlKey) return;
            if (
                !/^[0-9]$/.test(e.key) &&
                ![
                    "ArrowUp",
                    "ArrowDown",
                    "ArrowLeft",
                    "ArrowRight",
                    "Delete",
                    "Tab",
                    "Backspace",
                    "Enter",
                ].includes(e.key)
            ) {
                e.preventDefault();
                return;
            }

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const delta = e.key === "ArrowUp" ? 1 : -1;
                const next = stepPart(date, field, delta);
                setDate(next);
                onChange(new Date(next.year, next.month - 1, next.day));
                return;
            }

            if (e.key === "ArrowRight") {
                const atEnd =
                    e.currentTarget.selectionStart === e.currentTarget.value.length ||
                    (e.currentTarget.selectionStart === 0 &&
                        e.currentTarget.selectionEnd === e.currentTarget.value.length);
                if (!atEnd) return;
                e.preventDefault();
                if (field === "day") monthRef.current?.focus();
                if (field === "month") yearRef.current?.focus();
            } else if (e.key === "ArrowLeft") {
                const atStart =
                    e.currentTarget.selectionStart === 0 ||
                    (e.currentTarget.selectionStart === 0 &&
                        e.currentTarget.selectionEnd === e.currentTarget.value.length);
                if (!atStart) return;
                e.preventDefault();
                if (field === "month") dayRef.current?.focus();
                if (field === "year") monthRef.current?.focus();
            }
        };
    }

    function focusSelect(e: FocusEvent<HTMLInputElement>) {
        if (window.innerWidth > 1024) e.target.select();
    }

    return (
        <div
            className="
              flex items-center gap-0.5 rounded-control border border-border-warm bg-surface
              px-2.5 py-2 text-sm text-ink
            "
        >
            <input
                type="text"
                ref={dayRef}
                inputMode="numeric"
                maxLength={2}
                value={date.day || ""}
                onChange={handleChange("day")}
                onKeyDown={handleKeyDown("day")}
                onFocus={focusSelect}
                onBlur={handleBlur("day")}
                className="w-7 border-none bg-transparent p-0 text-center outline-none"
                placeholder="DD"
                aria-label="Day"
            />
            <span className="text-ink-subtle" aria-hidden>
                /
            </span>
            <input
                type="text"
                ref={monthRef}
                inputMode="numeric"
                maxLength={2}
                value={date.month || ""}
                onChange={handleChange("month")}
                onKeyDown={handleKeyDown("month")}
                onFocus={focusSelect}
                onBlur={handleBlur("month")}
                className="w-7 border-none bg-transparent p-0 text-center outline-none"
                placeholder="MM"
                aria-label="Month"
            />
            <span className="text-ink-subtle" aria-hidden>
                /
            </span>
            <input
                type="text"
                ref={yearRef}
                inputMode="numeric"
                maxLength={4}
                value={date.year || ""}
                onChange={handleChange("year")}
                onKeyDown={handleKeyDown("year")}
                onFocus={focusSelect}
                onBlur={handleBlur("year")}
                className="w-12 border-none bg-transparent p-0 text-center outline-none"
                placeholder="YYYY"
                aria-label="Year"
            />
        </div>
    );
}

type DateParts = { day: number; month: number; year: number };

function partsFromDate(d: Date): DateParts {
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function stepPart(date: DateParts, field: keyof DateParts, delta: 1 | -1): DateParts {
    const next = { ...date };
    if (field === "day") {
        const d = new Date(date.year, date.month - 1, date.day);
        d.setDate(d.getDate() + delta);
        return partsFromDate(d);
    }
    if (field === "month") {
        let month = date.month + delta;
        let year = date.year;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        if (month < 1) {
            month = 12;
            year -= 1;
        }
        const maxDay = new Date(year, month, 0).getDate();
        return { day: Math.min(date.day, maxDay), month, year };
    }
    return { ...date, year: date.year + delta };
}
