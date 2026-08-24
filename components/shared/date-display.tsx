import { formatDateIn, formatDateIso, formatDateShort, formatWeekdayDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export type DateDisplayProps = {
    date: Date;
    variant?: "full" | "short" | "weekday";
    className?: string;
};

const FORMATTERS = {
    full: formatDateIn,
    short: formatDateShort,
    weekday: formatWeekdayDate,
} as const;

export function DateDisplay({ date, variant = "full", className }: DateDisplayProps) {
    return (
        <time dateTime={formatDateIso(date)} className={cn("tabular", className)}>
            {FORMATTERS[variant](date)}
        </time>
    );
}
