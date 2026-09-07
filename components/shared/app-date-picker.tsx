"use client";

import { useState } from "react";

import { CalendarIcon } from "lucide-react";

import { formatDateIn, formatDateIso } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Date field matching the shared control height. Value is a `yyyy-MM-dd`
 * calendar string; the trigger shows `dd/mm/yyyy` per the project date format.
 */
export function AppDatePicker({
    id,
    value,
    onChange,
    onBlur,
    placeholder = "dd/mm/yyyy",
    disabled,
    invalid,
    className,
}: {
    id?: string;
    value: string | null;
    onChange: (next: string | null) => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
}) {
    const [open, setOpen] = useState(false);

    // `yyyy-MM-dd` is parsed as local midnight, matching what the calendar shows.
    const selected = value ? new Date(`${value}T00:00:00`) : undefined;
    const hasValidDate = selected != null && !Number.isNaN(selected.getTime());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={invalid || undefined}
                        onBlur={onBlur}
                        className={cn(
                            `
                              justify-between rounded-control border-2 border-border-warm bg-surface
                              px-3.5 text-[15px] font-normal text-ink block-control-lg inline-full
                              hover:border-ink-subtle hover:bg-surface
                              aria-invalid:border-danger-mid
                            `,
                            !hasValidDate && "text-ink-subtle",
                            className,
                        )}
                    >
                        {hasValidDate ? formatDateIn(selected) : placeholder}
                        <CalendarIcon
                            aria-hidden
                            className="shrink-0 text-ink-muted block-4 inline-4"
                        />
                    </Button>
                }
            />
            <PopoverContent align="start" className="p-0 inline-auto">
                <Calendar
                    mode="single"
                    selected={hasValidDate ? selected : undefined}
                    defaultMonth={hasValidDate ? selected : undefined}
                    onSelect={(next) => {
                        onChange(next ? formatDateIso(next) : null);
                        setOpen(false);
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    );
}
