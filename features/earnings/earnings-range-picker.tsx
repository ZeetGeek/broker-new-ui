"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { startOfDay } from "date-fns";

import { cn } from "@/lib/utils";

import { CalendarIcon, Check, ChevronDown } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
    EARNINGS_PRESETS,
    type EarningsSelection,
    formatWindow,
    resolveEarningsWindow,
} from "@/features/earnings/earnings-math";

function presetLabel(selection: EarningsSelection): string {
    if (selection.preset === "custom") return "Custom range";
    return EARNINGS_PRESETS.find((p) => p.value === selection.preset)?.label ?? "Period";
}

/**
 * Period picker: quick presets on the left, a two-month range calendar on the
 * right. Picking a preset applies at once; a custom range applies on "Apply"
 * so a half-picked range never reloads the report.
 */
export function EarningsRangePicker({
    value,
    onChange,
}: {
    value: EarningsSelection;
    onChange: (next: EarningsSelection) => void;
}) {
    const [open, setOpen] = useState(false);
    const range = resolveEarningsWindow(value);
    const [draft, setDraft] = useState<DateRange | undefined>(undefined);
    const today = startOfDay(new Date());

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (next) {
            setDraft(range.from ? { from: range.from, to: range.to } : undefined);
        }
    }

    function applyPreset(preset: EarningsSelection["preset"]) {
        onChange({ preset });
        setOpen(false);
    }

    function applyCustom() {
        if (!draft?.from) return;
        onChange({ preset: "custom", customFrom: draft.from, customTo: draft.to ?? draft.from });
        setOpen(false);
    }

    const draftLabel = draft?.from
        ? formatWindow({ from: draft.from, to: draft.to ?? draft.from })
        : "Pick a start date";

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        aria-expanded={open}
                        aria-label={`Period: ${presetLabel(value)}, ${formatWindow(range)}. Change period`}
                        className="
                          justify-between gap-3 rounded-control border border-border-warm bg-surface
                          px-3.5 font-normal text-ink shadow-none block-control-md
                          hover:border-ink-subtle hover:bg-surface
                          aria-expanded:border-ring
                          max-sm:inline-full
                        "
                    >
                        <span className="flex items-center gap-2 min-inline-0">
                            <CalendarIcon
                                aria-hidden
                                className="shrink-0 text-ink-muted block-4 inline-4"
                            />
                            <span className="font-medium">{presetLabel(value)}</span>
                            <span className="truncate text-ink-muted max-sm:hidden">
                                · {formatWindow(range)}
                            </span>
                        </span>
                        <ChevronDown
                            aria-hidden
                            className="shrink-0 text-ink-muted block-4 inline-4"
                        />
                    </Button>
                }
            />
            <PopoverContent
                align="end"
                sideOffset={8}
                className="
                  gap-0 overflow-hidden rounded-card border border-border-warm bg-surface p-0
                  shadow-lg ring-0 inline-auto max-inline-[calc(100vw-2rem)]
                "
            >
                <div className="flex flex-col md:flex-row">
                    <ul
                        aria-label="Quick periods"
                        className="
                          flex gap-1 overflow-x-auto border-be border-border-warm p-2
                          md:flex-col md:overflow-visible md:border-e md:border-be-0 md:min-inline-48
                        "
                    >
                        {EARNINGS_PRESETS.map((preset) => {
                            const active = value.preset === preset.value;
                            return (
                                <li key={preset.value} className="shrink-0">
                                    <button
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => applyPreset(preset.value)}
                                        className={cn(
                                            `
                                              flex items-center justify-between gap-3 rounded-control
                                              px-3 text-start text-sm whitespace-nowrap block-control-md inline-full
                                              hover:bg-surface-muted
                                              focus-visible:outline-2
                                              focus-visible:outline-ring max-md:block-control-lg
                                            `,
                                            active
                                                ? "bg-brand-soft font-medium text-brand-text hover:bg-brand-soft"
                                                : "text-ink",
                                        )}
                                    >
                                        {preset.label}
                                        {active ? (
                                            <Check
                                                aria-hidden
                                                className="block-4 inline-4 max-md:hidden"
                                            />
                                        ) : null}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="flex flex-col">
                        <p className="px-4 pbs-3 text-sm font-medium text-ink">Custom range</p>
                        <Calendar
                            mode="range"
                            selected={draft}
                            onSelect={setDraft}
                            numberOfMonths={2}
                            defaultMonth={
                                draft?.from ??
                                new Date(today.getFullYear(), today.getMonth() - 1, 1)
                            }
                            disabled={{ after: today }}
                            endMonth={today}
                            className="[&_.rdp-months]:flex-col sm:[&_.rdp-months]:flex-row"
                        />
                        <div
                            className="
                              flex items-center justify-between gap-3 border-bs border-border-warm
                              px-4 py-3
                            "
                        >
                            <p className="text-sm text-ink-muted tabular-nums" aria-live="polite">
                                {draftLabel}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!draft?.from}
                                    onClick={applyCustom}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
