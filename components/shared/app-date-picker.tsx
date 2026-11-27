"use client";

import { useState } from "react";
import type { Matcher } from "react-day-picker";

import { cva, type VariantProps } from "class-variance-authority";

import { formatDateIn } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { AppDateCalendar, parseCalendarDate } from "@/components/shared/app-date-calendar";
import { IconButton } from "@/components/shared/icon-button";
import { CalendarIcon } from "@/components/shared/icons";
import { MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const datePickerTriggerVariants = cva(
    `
      justify-between rounded-control border border-border-warm bg-surface text-control font-normal text-ink
      shadow-none transition-[border-color,box-shadow] inline-full
      hover:border-ink-subtle hover:bg-surface
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
      disabled:bg-surface-muted
      aria-expanded:border-ring
      aria-invalid:border-danger-mid
      aria-invalid:hover:border-danger-mid
      aria-invalid:focus-visible:ring-danger/20
    `,
    {
        variants: {
            size: {
                xs: "gap-1 px-2.5 block-control-xs",
                sm: "gap-1 px-3 block-control-sm",
                default: "gap-1.5 px-3.5 block-control-md",
                md: "gap-1.5 px-4 block-control-lg",
                lg: "gap-2 px-4 block-control-xl",
            },
        },
        defaultVariants: {
            size: "lg",
        },
    },
);

const datePickerIconVariants = cva("shrink-0 text-ink-muted", {
    variants: {
        size: {
            xs: "block-3 inline-3",
            sm: "block-3.5 inline-3.5",
            default: "block-4 inline-4",
            md: "block-4 inline-4",
            lg: "block-4.5 inline-4.5",
        },
    },
    defaultVariants: {
        size: "lg",
    },
});

/**
 * Date field with a yyyy-MM-dd value and a dd/mm/yyyy trigger.
 * Days before today are disabled unless allowPast is set.
 */
export function AppDatePicker({
    id,
    value,
    onChange,
    onBlur,
    placeholder = "Pick a date",
    disabled,
    invalid,
    allowPast = false,
    min,
    max,
    required = false,
    disabledDates,
    size = "lg",
    iconOnly = false,
    className,
    "aria-describedby": describedBy,
}: {
    id?: string;
    value: string | null;
    onChange: (next: string | null) => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    allowPast?: boolean;
    /** Inclusive yyyy-MM-dd limits for range fields and constrained scheduling. */
    min?: string;
    max?: string;
    /** Keep a date selected when choosing the selected day again. */
    required?: boolean;
    disabledDates?: Matcher | Matcher[];
    className?: string;
    /** Compact calendar action for planner toolbars. */
    iconOnly?: boolean;
    "aria-describedby"?: string;
} & VariantProps<typeof datePickerTriggerVariants>) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const selected = parseCalendarDate(value);
    const TriggerButton = iconOnly ? IconButton : Button;
    const trigger = (
        <TriggerButton
            id={id}
            type="button"
            {...(iconOnly ? { size: "md" as const } : { variant: "outline" as const })}
            aria-label={iconOnly ? "Jump to a date" : undefined}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-expanded={open}
            onBlur={onBlur}
            className={cn(
                !iconOnly && datePickerTriggerVariants({ size }),
                !iconOnly && !selected && "text-ink-subtle",
                className,
            )}
        >
            <span className={iconOnly ? "sr-only" : "truncate"}>
                {selected ? formatDateIn(selected) : placeholder}
            </span>
            <CalendarIcon
                aria-hidden
                data-icon="inline-end"
                className={datePickerIconVariants({ size })}
            />
        </TriggerButton>
    );
    const calendar = (
        <AppDateCalendar
            value={value}
            onChange={(next) => {
                onChange(next);
                setOpen(false);
            }}
            allowPast={allowPast}
            min={min}
            max={max}
            required={required}
            disabledDates={disabledDates}
            autoFocus={!mobile && open}
        />
    );

    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                title="Choose date"
                trigger={trigger}
                edgeToEdge
                bodyClassName="px-1 pbs-3 pbe-4"
            >
                {calendar}
            </MobileActionDrawer>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={trigger} />
            <PopoverContent
                aria-label="Choose date"
                align="start"
                sideOffset={8}
                className="
                  gap-0 overflow-visible rounded-card border border-border-warm bg-surface
                  p-3 shadow-lg ring-0 inline-auto
                "
            >
                {calendar}
            </PopoverContent>
        </Popover>
    );
}
