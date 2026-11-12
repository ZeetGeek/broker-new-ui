"use client";

import * as React from "react";
import { type DayButton, DayPicker, getDefaultClassNames, type Locale } from "react-day-picker";

import { cn } from "@/lib/utils";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/shared/icons";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    locale,
    formatters,
    components,
    ...props
}: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                `
                  group/calendar bg-surface p-3 text-ink [--cell-radius:var(--radius-inner)]
                  [--cell-size:--spacing(11)]
                  in-data-[slot=card-content]:bg-transparent
                  in-data-[slot=popover-content]:bg-transparent
                `,
                String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                className,
            )}
            captionLayout={captionLayout}
            locale={locale}
            formatters={{
                formatMonthDropdown: (date) =>
                    date.toLocaleString(locale?.code, { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: cn("inline-fit", defaultClassNames.root),
                months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
                month: cn("flex flex-col gap-3 inline-full", defaultClassNames.month),
                nav: cn(
                    `
                      absolute inset-x-0 inset-bs-0 flex items-center justify-between gap-1
                      inline-full
                    `,
                    defaultClassNames.nav,
                ),
                button_previous: cn(
                    buttonVariants({ variant: buttonVariant }),
                    `
                      p-0 text-brand-text select-none block-(--cell-size)
                      inline-(--cell-size) hover:bg-brand-soft hover:text-brand-text
                      active:translate-y-0 active:scale-100
                      aria-disabled:opacity-50
                    `,
                    defaultClassNames.button_previous,
                ),
                button_next: cn(
                    buttonVariants({ variant: buttonVariant }),
                    `
                      p-0 text-brand-text select-none block-(--cell-size)
                      inline-(--cell-size) hover:bg-brand-soft hover:text-brand-text
                      active:translate-y-0 active:scale-100
                      aria-disabled:opacity-50
                    `,
                    defaultClassNames.button_next,
                ),
                month_caption: cn(
                    `
                      flex items-center justify-center px-(--cell-size) block-(--cell-size)
                      inline-full
                    `,
                    defaultClassNames.month_caption,
                ),
                dropdowns: cn(
                    `
                      flex items-center justify-center gap-1.5 text-sm font-medium
                      block-(--cell-size) inline-full
                    `,
                    defaultClassNames.dropdowns,
                ),
                dropdown_root: cn(
                    "relative rounded-(--cell-radius)",
                    defaultClassNames.dropdown_root,
                ),
                dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
                caption_label: cn(
                    "font-semibold text-ink select-none",
                    captionLayout === "label"
                        ? "text-sm"
                        : `
                          flex items-center gap-1 rounded-(--cell-radius) text-sm
                          [&>svg]:text-muted-foreground [&>svg]:block-3.5 [&>svg]:inline-3.5
                        `,
                    defaultClassNames.caption_label,
                ),
                month_grid: cn("border-collapse inline-full", defaultClassNames.month_grid),
                weekdays: cn("flex", defaultClassNames.weekdays),
                weekday: cn(
                    `
                      flex-1 rounded-(--cell-radius) text-xs font-medium text-ink-muted
                      select-none
                    `,
                    defaultClassNames.weekday,
                ),
                week: cn("mbs-1 flex inline-full", defaultClassNames.week),
                week_number_header: cn(
                    "select-none inline-(--cell-size)",
                    defaultClassNames.week_number_header,
                ),
                week_number: cn(
                    "text-[0.8rem] text-muted-foreground select-none",
                    defaultClassNames.week_number,
                ),
                day: cn(
                    `
                      group/day relative aspect-square rounded-(--cell-radius) p-0 text-center
                      select-none block-full inline-full
                      [&:last-child[data-selected=true]_button]:rounded-e-(--cell-radius)
                    `,
                    props.showWeekNumber
                        ? "[&:nth-child(2)[data-selected=true]_button]:rounded-s-(--cell-radius)"
                        : "[&:first-child[data-selected=true]_button]:rounded-s-(--cell-radius)",
                    defaultClassNames.day,
                ),
                range_start: cn(
                    `
                      relative isolate z-0 rounded-s-(--cell-radius) bg-brand-soft
                      after:absolute after:inset-y-0 after:inset-e-0 after:bg-brand-soft after:inline-4
                    `,
                    defaultClassNames.range_start,
                ),
                range_middle: cn("rounded-none", defaultClassNames.range_middle),
                range_end: cn(
                    `
                      relative isolate z-0 rounded-e-(--cell-radius) bg-brand-soft
                      after:absolute after:inset-y-0 after:inset-s-0 after:bg-brand-soft after:inline-4
                    `,
                    defaultClassNames.range_end,
                ),
                today: defaultClassNames.today,
                outside: cn(
                    "text-ink-subtle aria-selected:text-brand-text",
                    defaultClassNames.outside,
                ),
                disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
                hidden: cn("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Root: ({ className, rootRef, ...props }) => {
                    return (
                        <div
                            data-slot="calendar"
                            ref={rootRef}
                            className={cn(className)}
                            {...props}
                        />
                    );
                },
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === "left") {
                        return (
                            <ChevronLeftIcon
                                className={cn("block-4 inline-4 rtl:rotate-180", className)}
                                {...props}
                            />
                        );
                    }

                    if (orientation === "right") {
                        return (
                            <ChevronRightIcon
                                className={cn("block-4 inline-4 rtl:rotate-180", className)}
                                {...props}
                            />
                        );
                    }

                    return (
                        <ChevronDownIcon className={cn("block-4 inline-4", className)} {...props} />
                    );
                },
                DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
                WeekNumber: ({ children, ...props }) => {
                    return (
                        <td {...props}>
                            <div
                                className="
                                  flex items-center justify-center text-center block-(--cell-size)
                                  inline-(--cell-size)
                                "
                            >
                                {children}
                            </div>
                        </td>
                    );
                },
                ...components,
            }}
            {...props}
        />
    );
}

function CalendarDayButton({
    className,
    day,
    modifiers,
    locale,
    ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
    const defaultClassNames = getDefaultClassNames();

    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString(locale?.code)}
            data-selected-single={
                modifiers.selected &&
                !modifiers.range_start &&
                !modifiers.range_end &&
                !modifiers.range_middle
            }
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={cn(
                `
                  relative isolate z-10 flex aspect-square flex-col gap-1 rounded-(--cell-radius) border-0
                  leading-none font-medium text-ink shadow-none block-full inline-full min-inline-0
                  group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10
                  group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px]
                  group-data-[focused=true]/day:ring-ring/50 hover:bg-brand-soft
                  hover:text-brand-text active:translate-y-0
                  active:scale-100
                  data-[range-end=true]:rounded-(--cell-radius)
                  data-[range-end=true]:rounded-e-(--cell-radius) data-[range-end=true]:bg-brand
                  data-[range-end=true]:text-surface
                  data-[range-end=true]:hover:bg-brand data-[range-end=true]:hover:text-surface
                  data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-brand-soft
                  data-[range-middle=true]:text-brand-text
                  data-[range-start=true]:rounded-(--cell-radius)
                  data-[range-start=true]:rounded-s-(--cell-radius)
                  data-[range-start=true]:bg-brand data-[range-start=true]:text-surface
                  data-[range-start=true]:hover:bg-brand data-[range-start=true]:hover:text-surface
                  data-[selected-single=true]:bg-brand
                  data-[selected-single=true]:text-surface
                  data-[selected-single=true]:hover:bg-brand data-[selected-single=true]:hover:text-surface
                  [&>span]:text-xs [&>span]:opacity-70
                `,
                modifiers.today && !modifiers.selected && "bg-brand-soft text-brand-text",
                defaultClassNames.day,
                className,
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };
